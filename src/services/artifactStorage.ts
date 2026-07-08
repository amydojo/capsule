import { ArtifactSchema } from "../schemas/artifactSchema";
import type {
  Artifact,
  ArtifactImageField,
  ArtifactImageReference,
  ArtifactStorageDiagnostics,
  ArtifactTimelineEvent,
} from "../types/artifact";
import {
  compressDataUrl,
  estimateDataUrlBytes,
  isDataUrl,
  type ImageCompressionOptions,
} from "../utils/imageCompression";

const STORAGE_KEY = "capsule_artifacts_v1";
const IMAGE_DB_NAME = "capsule_artifact_images_v1";
const IMAGE_STORE_NAME = "artifact_images";
const IMAGE_DB_VERSION = 1;
const STORAGE_VERSION = "artifact-storage-v1";
const IMAGE_REFERENCE_PREFIX = "capsule-idb://";

const IMAGE_FIELDS: ArtifactImageField[] = [
  "sourceImageDataUrl",
  "specimenImageDataUrl",
  "imageDataUrl",
  "artifactRenderDataUrl",
  "isolatedSpecimenDataUrl",
  "pristineSpecimenDataUrl",
  "thumbnailDataUrl",
];

const OPTIONAL_DROP_ORDER: ArtifactImageField[] = [
  "pristineSpecimenDataUrl",
  "artifactRenderDataUrl",
  "isolatedSpecimenDataUrl",
  "imageDataUrl",
];

const RETRY_PROFILES = [
  { maxDimension: 1600, quality: 0.82 },
  { maxDimension: 1200, quality: 0.72 },
  { maxDimension: 960, quality: 0.65 },
];

type StorageFailureKind = "quota exceeded" | "indexeddb unavailable" | "serialization failed" | "unknown";

type ArtifactImageRecord = {
  key: string;
  artifactId: string;
  fieldName: ArtifactImageField;
  dataUrl: string;
  byteSize: number;
  createdAt: string;
};

type PreparedImage = {
  fieldName: ArtifactImageField;
  dataUrl: string;
  byteSize: number;
  originalBytes: number;
  compressionApplied: boolean;
  reason?: string;
};

type ImageStorageAttempt = {
  fields: ArtifactImageField[];
  droppedImageFields: ArtifactImageField[];
};

export type SaveArtifactOptions = {
  retryAttempt?: number;
};

const canUseStorage = () => typeof window !== "undefined" && "localStorage" in window;

const byteLength = (value: string) =>
  typeof TextEncoder !== "undefined" ? new TextEncoder().encode(value).byteLength : value.length;

const createId = (prefix = "evt") => {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${randomId}`;
};

const isArtifactImageField = (value: string): value is ArtifactImageField =>
  IMAGE_FIELDS.includes(value as ArtifactImageField);

const readImageField = (artifact: Artifact, fieldName: ArtifactImageField) =>
  (artifact as Partial<Record<ArtifactImageField, string>>)[fieldName];

const writeImageField = (artifact: Artifact, fieldName: ArtifactImageField, value?: string) => {
  const target = artifact as Partial<Record<ArtifactImageField, string>>;

  if (value) {
    target[fieldName] = value;
    return;
  }

  if (fieldName === "imageDataUrl") {
    artifact.imageDataUrl = "";
    return;
  }

  delete target[fieldName];
};

const imageRecordKey = (artifactId: string, fieldName: ArtifactImageField) => `${artifactId}:${fieldName}`;

const imageReferenceValue = (artifactId: string, fieldName: ArtifactImageField) =>
  `${IMAGE_REFERENCE_PREFIX}${encodeURIComponent(artifactId)}/${fieldName}`;

const parseImageReferenceValue = (value?: string): { artifactId: string; fieldName: ArtifactImageField; key: string } | undefined => {
  if (!value?.startsWith(IMAGE_REFERENCE_PREFIX)) return undefined;
  const parts = value.slice(IMAGE_REFERENCE_PREFIX.length).split("/");
  const artifactId = parts[0] ? decodeURIComponent(parts[0]) : "";
  const fieldName = parts[1] || "";
  if (!artifactId || !isArtifactImageField(fieldName)) return undefined;
  return {
    artifactId,
    fieldName,
    key: imageRecordKey(artifactId, fieldName),
  };
};

const classifyStorageError = (error: unknown): StorageFailureKind => {
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "quota exceeded";
  if (error instanceof Error && /quota/i.test(error.name)) return "quota exceeded";
  if (error instanceof Error && /quota/i.test(error.message)) return "quota exceeded";
  if (error instanceof Error && /indexeddb/i.test(error.message)) return "indexeddb unavailable";
  if (error instanceof Error && /serial/i.test(error.message)) return "serialization failed";
  return "unknown";
};

const createSaveError = (reason: StorageFailureKind) => {
  const error = new Error("Capsule could not finish saving this artifact on this device.");
  error.name = `ArtifactStorageError:${reason}`;
  return error;
};

const logStorage = (event: string, details: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.info(`[Capsule storage] ${event}`, details);
  }
};

const openImageDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = window.indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.objectStoreNames.contains(IMAGE_STORE_NAME)
        ? request.transaction?.objectStore(IMAGE_STORE_NAME)
        : db.createObjectStore(IMAGE_STORE_NAME, { keyPath: "key" });

      if (!store) return;
      if (!store.indexNames.contains("artifactId")) store.createIndex("artifactId", "artifactId", { unique: false });
      if (!store.indexNames.contains("fieldName")) store.createIndex("fieldName", "fieldName", { unique: false });
    };
    request.onerror = () => reject(request.error || new Error("IndexedDB unavailable"));
    request.onsuccess = () => resolve(request.result);
  });

const putImageRecords = async (records: ArtifactImageRecord[]) => {
  if (records.length === 0) return;
  const db = await openImageDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(IMAGE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(IMAGE_STORE_NAME);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("IndexedDB image write failed"));
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB image write aborted"));
      records.forEach((record) => store.put(record));
    });
  } finally {
    db.close();
  }
};

const getImageRecords = async (artifactId: string): Promise<Map<ArtifactImageField, ArtifactImageRecord>> => {
  const db = await openImageDb();

  try {
    const records = await new Promise<ArtifactImageRecord[]>((resolve, reject) => {
      const transaction = db.transaction(IMAGE_STORE_NAME, "readonly");
      const store = transaction.objectStore(IMAGE_STORE_NAME);
      const index = store.index("artifactId");
      const request = index.getAll(artifactId);
      request.onsuccess = () => resolve(request.result as ArtifactImageRecord[]);
      request.onerror = () => reject(request.error || new Error("IndexedDB image read failed"));
      transaction.onerror = () => reject(transaction.error || new Error("IndexedDB image read failed"));
    });

    return new Map(records.map((record) => [record.fieldName, record]));
  } finally {
    db.close();
  }
};

const deleteImageRecords = async (artifactId: string, fields?: ArtifactImageField[]) => {
  let records: ArtifactImageRecord[];

  try {
    records = Array.from((await getImageRecords(artifactId)).values());
  } catch {
    return;
  }

  const keys = fields
    ? records.filter((record) => fields.includes(record.fieldName)).map((record) => record.key)
    : records.map((record) => record.key);
  if (keys.length === 0) return;

  const db = await openImageDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(IMAGE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(IMAGE_STORE_NAME);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("IndexedDB image delete failed"));
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB image delete aborted"));
      keys.forEach((key) => store.delete(key));
    });
  } finally {
    db.close();
  }
};

const readStoredArtifacts = (): Artifact[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      const result = ArtifactSchema.safeParse(item);
      return result.success ? [result.data as Artifact] : [];
    });
  } catch {
    return [];
  }
};

const writeStoredArtifacts = (artifacts: Artifact[]) => {
  if (!canUseStorage()) {
    return {
      ok: false as const,
      bytes: 0,
      reason: "unknown" as StorageFailureKind,
      error: new Error("localStorage unavailable"),
    };
  }

  try {
    const serialized = JSON.stringify(artifacts);
    const bytes = byteLength(serialized);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return { ok: true as const, bytes };
  } catch (error) {
    return {
      ok: false as const,
      bytes: 0,
      reason: classifyStorageError(error),
      error,
    };
  }
};

const getRetryProfile = (retryAttempt = 1) => {
  const index = Math.min(RETRY_PROFILES.length - 1, Math.max(0, retryAttempt - 1));
  return RETRY_PROFILES[index];
};

const getCompressionOptions = (fieldName: ArtifactImageField, retryAttempt?: number): ImageCompressionOptions => {
  const profile = getRetryProfile(retryAttempt);
  const isThumbnail = fieldName === "thumbnailDataUrl";
  const preserveTransparency = fieldName === "isolatedSpecimenDataUrl";

  return {
    maxDimension: isThumbnail ? 640 : profile.maxDimension,
    mimeType: preserveTransparency ? "image/png" : "image/jpeg",
    quality: isThumbnail ? Math.min(profile.quality, 0.76) : profile.quality,
    preserveTransparency,
  };
};

const prepareImages = async (artifact: Artifact, options: SaveArtifactOptions) => {
  const images = new Map<ArtifactImageField, PreparedImage>();

  for (const fieldName of IMAGE_FIELDS) {
    const dataUrl = readImageField(artifact, fieldName);
    if (!isDataUrl(dataUrl)) continue;

    const compressed = await compressDataUrl(dataUrl, getCompressionOptions(fieldName, options.retryAttempt));
    images.set(fieldName, {
      fieldName,
      dataUrl: compressed.dataUrl,
      byteSize: compressed.storedBytes,
      originalBytes: compressed.originalBytes,
      compressionApplied: compressed.compressionApplied,
      reason: compressed.reason,
    });
  }

  return images;
};

const collectLegacyImages = (artifact: Artifact) => {
  const images = new Map<ArtifactImageField, PreparedImage>();

  for (const fieldName of IMAGE_FIELDS) {
    const dataUrl = readImageField(artifact, fieldName);
    if (!isDataUrl(dataUrl)) continue;
    const byteSize = estimateDataUrlBytes(dataUrl);
    images.set(fieldName, {
      fieldName,
      dataUrl,
      byteSize,
      originalBytes: byteSize,
      compressionApplied: false,
    });
  }

  return images;
};

const buildStorageAttempts = (images: Map<ArtifactImageField, PreparedImage>): ImageStorageAttempt[] => {
  const presentFields = IMAGE_FIELDS.filter((fieldName) => images.has(fieldName));
  const attempts: ImageStorageAttempt[] = [{ fields: presentFields, droppedImageFields: [] }];
  const droppedFields: ArtifactImageField[] = [];

  for (const fieldName of OPTIONAL_DROP_ORDER) {
    if (!images.has(fieldName)) continue;
    droppedFields.push(fieldName);
    attempts.push({
      fields: presentFields.filter((field) => !droppedFields.includes(field)),
      droppedImageFields: [...droppedFields],
    });
  }

  const smallestSourceOrSpecimen = (["specimenImageDataUrl", "sourceImageDataUrl"] as ArtifactImageField[])
    .filter((fieldName) => images.has(fieldName))
    .sort((a, b) => (images.get(a)?.byteSize || 0) - (images.get(b)?.byteSize || 0))[0];

  if (smallestSourceOrSpecimen) {
    attempts.push({
      fields: [smallestSourceOrSpecimen],
      droppedImageFields: presentFields.filter((fieldName) => fieldName !== smallestSourceOrSpecimen),
    });
  }

  return attempts.filter((attempt, index, allAttempts) => {
    const signature = attempt.fields.join("|");
    return allAttempts.findIndex((other) => other.fields.join("|") === signature) === index;
  });
};

const buildImageRecords = (
  artifactId: string,
  images: Map<ArtifactImageField, PreparedImage>,
  fields: ArtifactImageField[],
): ArtifactImageRecord[] => {
  const createdAt = new Date().toISOString();

  return fields.flatMap((fieldName) => {
    const image = images.get(fieldName);
    if (!image) return [];
    return [
      {
        key: imageRecordKey(artifactId, fieldName),
        artifactId,
        fieldName,
        dataUrl: image.dataUrl,
        byteSize: image.byteSize,
        createdAt,
      },
    ];
  });
};

const buildDiagnostics = ({
  artifact,
  images,
  keptFields,
  droppedImageFields,
  status,
  method,
  reason,
  localStorageBytes,
}: {
  artifact: Artifact;
  images: Map<ArtifactImageField, PreparedImage>;
  keptFields: ArtifactImageField[];
  droppedImageFields: ArtifactImageField[];
  status: ArtifactStorageDiagnostics["lastSaveStatus"];
  method: ArtifactStorageDiagnostics["method"];
  reason?: string;
  localStorageBytes?: number;
}): ArtifactStorageDiagnostics => {
  const sourceImage = images.get("sourceImageDataUrl");
  const artifactRenderImage = keptFields.includes("artifactRenderDataUrl") ? images.get("artifactRenderDataUrl") : undefined;

  return {
    version: STORAGE_VERSION,
    method,
    compressionApplied: Array.from(images.values()).some((image) => image.compressionApplied),
    localStorageBytes,
    indexedDbImageBytes: keptFields.reduce((total, fieldName) => total + (images.get(fieldName)?.byteSize || 0), 0),
    sourceOriginalBytes: sourceImage?.originalBytes,
    sourceStoredBytes: keptFields.includes("sourceImageDataUrl") ? sourceImage?.byteSize : undefined,
    artifactRenderStoredBytes: artifactRenderImage?.byteSize,
    droppedImageFields: droppedImageFields.length ? droppedImageFields : undefined,
    lastSaveStatus: status,
    lastSaveReason: reason,
    createdAt: artifact.storage?.createdAt || new Date().toISOString(),
  };
};

const buildMetadataArtifact = ({
  artifact,
  images,
  keptFields,
  droppedImageFields,
  diagnostics,
}: {
  artifact: Artifact;
  images: Map<ArtifactImageField, PreparedImage>;
  keptFields: ArtifactImageField[];
  droppedImageFields: ArtifactImageField[];
  diagnostics: ArtifactStorageDiagnostics;
}): Artifact => {
  const metadata: Artifact = {
    ...artifact,
    imageReferences: {},
    storage: {
      ...diagnostics,
      droppedImageFields: droppedImageFields.length ? droppedImageFields : diagnostics.droppedImageFields,
    },
  };

  for (const fieldName of IMAGE_FIELDS) {
    if (images.has(fieldName) && keptFields.includes(fieldName)) {
      const image = images.get(fieldName);
      const key = imageRecordKey(artifact.id, fieldName);
      writeImageField(metadata, fieldName, imageReferenceValue(artifact.id, fieldName));
      metadata.imageReferences = {
        ...metadata.imageReferences,
        [fieldName]: {
          storage: "indexeddb-v1",
          key,
          byteSize: image?.byteSize || 0,
          createdAt: new Date().toISOString(),
        },
      };
      continue;
    }

    const currentValue = readImageField(metadata, fieldName);
    if (isDataUrl(currentValue) || parseImageReferenceValue(currentValue)) {
      writeImageField(metadata, fieldName, undefined);
    }
  }

  if (!metadata.imageDataUrl) {
    metadata.imageDataUrl = metadata.specimenImageDataUrl || metadata.sourceImageDataUrl || "";
  }

  if (!metadata.imageReferences || Object.keys(metadata.imageReferences).length === 0) {
    delete metadata.imageReferences;
  }

  return metadata;
};

const writeMetadataArtifact = (metadata: Artifact) => {
  const existing = readStoredArtifacts().filter((artifact) => artifact.id !== metadata.id);
  let nextArtifacts = [metadata, ...existing];
  const estimatedBytes = byteLength(JSON.stringify(nextArtifacts));
  const metadataWithBytes: Artifact = {
    ...metadata,
    storage: metadata.storage
      ? {
          ...metadata.storage,
          localStorageBytes: estimatedBytes,
        }
      : metadata.storage,
  };
  nextArtifacts = [metadataWithBytes, ...existing];
  const writeResult = writeStoredArtifacts(nextArtifacts);
  return {
    ...writeResult,
    metadata: metadataWithBytes,
  };
};

const collectImageReferences = (artifact: Artifact) => {
  const references = new Map<ArtifactImageField, ArtifactImageReference>();

  for (const [fieldName, reference] of Object.entries(artifact.imageReferences || {})) {
    if (isArtifactImageField(fieldName)) {
      references.set(fieldName, reference);
    }
  }

  for (const fieldName of IMAGE_FIELDS) {
    const parsed = parseImageReferenceValue(readImageField(artifact, fieldName));
    if (!parsed) continue;
    references.set(fieldName, {
      storage: "indexeddb-v1",
      key: parsed.key,
      byteSize: references.get(fieldName)?.byteSize || 0,
      createdAt: references.get(fieldName)?.createdAt || artifact.storage?.createdAt || artifact.createdAt,
    });
  }

  return references;
};

const hydrateArtifact = async (metadata: Artifact): Promise<Artifact> => {
  const artifact: Artifact = { ...metadata };
  const references = collectImageReferences(metadata);
  const hasLegacyPayloads = IMAGE_FIELDS.some((fieldName) => isDataUrl(readImageField(metadata, fieldName)));

  if (references.size === 0) {
    return {
      ...artifact,
      storage: artifact.storage || (hasLegacyPayloads
        ? {
            version: STORAGE_VERSION,
            method: "localstorage-legacy",
            compressionApplied: false,
            lastSaveStatus: "success",
            createdAt: artifact.createdAt,
          }
        : artifact.storage),
    };
  }

  let records = new Map<ArtifactImageField, ArtifactImageRecord>();
  let readFailure: StorageFailureKind | undefined;

  try {
    records = await getImageRecords(metadata.id);
  } catch (error) {
    readFailure = classifyStorageError(error);
  }

  for (const fieldName of IMAGE_FIELDS) {
    const value = readImageField(metadata, fieldName);
    if (isDataUrl(value)) continue;

    const parsedReference = parseImageReferenceValue(value);
    const referenceField = parsedReference?.fieldName || fieldName;
    const record = records.get(referenceField);

    if (record?.dataUrl) {
      writeImageField(artifact, fieldName, record.dataUrl);
    } else if (parseImageReferenceValue(value)) {
      writeImageField(artifact, fieldName, undefined);
    }
  }

  if (!artifact.imageDataUrl) {
    artifact.imageDataUrl = artifact.specimenImageDataUrl || artifact.sourceImageDataUrl || "";
  }

  if (readFailure) {
    artifact.storage = {
      ...(artifact.storage || {
        version: STORAGE_VERSION,
        method: "metadata-only-degraded",
        compressionApplied: false,
        createdAt: artifact.createdAt,
      }),
      lastSaveStatus: "failed",
      lastSaveReason: readFailure,
    };
  }

  return artifact;
};

let migrationPromise: Promise<void> | undefined;

export const migrateLegacyArtifactsIfNeeded = async () => {
  migrationPromise ||= (async () => {
    const storedArtifacts = readStoredArtifacts();
    if (storedArtifacts.length === 0) return;

    let didMigrate = false;
    const migratedArtifacts: Artifact[] = [];

    for (const artifact of storedArtifacts) {
      const images = collectLegacyImages(artifact);
      if (images.size === 0 || artifact.imageReferences) {
        migratedArtifacts.push(artifact);
        continue;
      }

      const fields = IMAGE_FIELDS.filter((fieldName) => images.has(fieldName));
      const records = buildImageRecords(artifact.id, images, fields);

      try {
        await putImageRecords(records);
        const diagnostics = buildDiagnostics({
          artifact,
          images,
          keptFields: fields,
          droppedImageFields: [],
          status: "success",
          method: "indexeddb-v1",
          reason: "legacy artifact migrated to IndexedDB",
        });
        migratedArtifacts.push(buildMetadataArtifact({
          artifact,
          images,
          keptFields: fields,
          droppedImageFields: [],
          diagnostics,
        }));
        didMigrate = true;
      } catch (error) {
        logStorage("legacy migration skipped", {
          artifactId: artifact.id,
          reason: classifyStorageError(error),
          imageFields: fields,
        });
        migratedArtifacts.push(artifact);
      }
    }

    if (didMigrate) {
      const writeResult = writeStoredArtifacts(migratedArtifacts);
      if (!writeResult.ok) {
        logStorage("legacy migration metadata write failed", {
          reason: writeResult.reason,
        });
      }
    }
  })();

  return migrationPromise;
};

export const loadArtifacts = async (): Promise<Artifact[]> => {
  await migrateLegacyArtifactsIfNeeded();
  const artifacts = await Promise.all(readStoredArtifacts().map((artifact) => hydrateArtifact(artifact)));
  return artifacts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

export const loadArtifact = async (id: string): Promise<Artifact | undefined> =>
  (await loadArtifacts()).find((artifact) => artifact.id === id);

export const saveArtifact = async (artifact: Artifact, options: SaveArtifactOptions = {}): Promise<Artifact> => {
  const result = ArtifactSchema.safeParse(artifact);
  if (!result.success) {
    throw createSaveError("serialization failed");
  }

  await migrateLegacyArtifactsIfNeeded();

  const validArtifact = result.data as Artifact;
  const images = await prepareImages(validArtifact, options);
  const imageFieldsPresent = IMAGE_FIELDS.filter((fieldName) => images.has(fieldName));
  const compressionReasons = Array.from(images.values()).flatMap((image) => image.reason ? [`${image.fieldName}: ${image.reason}`] : []);
  let lastFailure: StorageFailureKind | undefined;

  logStorage("save started", {
    artifactId: validArtifact.id,
    imageFields: imageFieldsPresent,
    imageBytes: Object.fromEntries(Array.from(images.entries()).map(([fieldName, image]) => [fieldName, image.byteSize])),
    retryAttempt: Math.min(3, Math.max(1, options.retryAttempt || 1)),
  });

  for (const attempt of buildStorageAttempts(images)) {
    const records = buildImageRecords(validArtifact.id, images, attempt.fields);

    try {
      await putImageRecords(records);

      const diagnostics = buildDiagnostics({
        artifact: validArtifact,
        images,
        keptFields: attempt.fields,
        droppedImageFields: attempt.droppedImageFields,
        status: attempt.droppedImageFields.length ? "degraded" : "success",
        method: "indexeddb-v1",
        reason: attempt.droppedImageFields.length
          ? `Storage save degraded after ${lastFailure || "image payload pressure"}.`
          : compressionReasons[0],
      });
      const metadata = buildMetadataArtifact({
        artifact: validArtifact,
        images,
        keptFields: attempt.fields,
        droppedImageFields: attempt.droppedImageFields,
        diagnostics,
      });
      const writeResult = writeMetadataArtifact(metadata);

      if (!writeResult.ok) {
        lastFailure = writeResult.reason;
        await deleteImageRecords(validArtifact.id, attempt.fields).catch(() => undefined);
        continue;
      }

      const staleFields = IMAGE_FIELDS.filter((fieldName) => !attempt.fields.includes(fieldName));
      await deleteImageRecords(validArtifact.id, staleFields).catch(() => undefined);

      logStorage("save finished", {
        artifactId: validArtifact.id,
        imageFields: attempt.fields,
        approxLocalStorageBytes: writeResult.bytes,
        approxIndexedDbImageBytes: diagnostics.indexedDbImageBytes,
        compressionApplied: diagnostics.compressionApplied,
        storageMethod: diagnostics.method,
        saveStatus: diagnostics.lastSaveStatus,
        failureReason: diagnostics.lastSaveReason,
      });

      return hydrateArtifact(writeResult.metadata);
    } catch (error) {
      lastFailure = classifyStorageError(error);
      logStorage("image save attempt failed", {
        artifactId: validArtifact.id,
        reason: lastFailure,
        attemptedFields: attempt.fields,
        droppedImageFields: attempt.droppedImageFields,
      });
    }
  }

  const degradedDiagnostics = buildDiagnostics({
    artifact: validArtifact,
    images,
    keptFields: [],
    droppedImageFields: imageFieldsPresent,
    status: "degraded",
    method: "metadata-only-degraded",
    reason: lastFailure || "indexeddb unavailable",
  });
  const metadataOnly = buildMetadataArtifact({
    artifact: validArtifact,
    images,
    keptFields: [],
    droppedImageFields: imageFieldsPresent,
    diagnostics: degradedDiagnostics,
  });
  const writeResult = writeMetadataArtifact(metadataOnly);

  if (!writeResult.ok) {
    throw createSaveError(writeResult.reason);
  }

  await deleteImageRecords(validArtifact.id).catch(() => undefined);

  logStorage("save finished degraded", {
    artifactId: validArtifact.id,
    imageFields: [],
    approxLocalStorageBytes: writeResult.bytes,
    storageMethod: "metadata-only-degraded",
    saveStatus: "degraded",
    failureReason: degradedDiagnostics.lastSaveReason,
  });

  return hydrateArtifact(writeResult.metadata);
};

export const deleteArtifact = async (id: string): Promise<void> => {
  const artifacts = readStoredArtifacts().filter((artifact) => artifact.id !== id);
  writeStoredArtifacts(artifacts);
  await deleteImageRecords(id).catch(() => undefined);
};

export const updateArtifact = async (id: string, patch: Partial<Artifact>): Promise<Artifact | undefined> => {
  const artifact = await loadArtifact(id);
  if (!artifact) return undefined;

  return saveArtifact({
    ...artifact,
    ...patch,
    id: artifact.id,
    updatedAt: new Date().toISOString(),
  });
};

const appendEvent = (artifact: Artifact, event: Omit<ArtifactTimelineEvent, "id" | "date">): Artifact => ({
  ...artifact,
  updatedAt: new Date().toISOString(),
  timeline: [
    ...artifact.timeline,
    {
      id: createId("evt"),
      date: new Date().toISOString(),
      ...event,
    },
  ],
});

export const addObservation = async (id: string, text: string): Promise<Artifact | undefined> => {
  const artifact = await loadArtifact(id);
  const trimmed = text.trim();
  if (!artifact || !trimmed) return artifact;

  const observed = appendEvent(
    {
      ...artifact,
      observations: [
        ...artifact.observations,
        {
          id: createId("obs"),
          text: trimmed,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      stage: "updated",
      label: "Observation added",
      description: trimmed,
    },
  );

  return saveArtifact(observed);
};

export const sealArtifact = async (id: string): Promise<Artifact | undefined> => {
  const artifact = await loadArtifact(id);
  if (!artifact) return undefined;
  if (artifact.preservationState === "sealed") return artifact;

  const sealed = appendEvent(
    {
      ...artifact,
      preservationState: "sealed",
      currentStage: "sealed",
    },
    {
      stage: "sealed",
      label: "Seal Fossil",
      description: "Artifact sealed into preserved state.",
    },
  );

  return saveArtifact(sealed);
};

export const markRediscovered = async (id: string): Promise<Artifact | undefined> => {
  const artifact = await loadArtifact(id);
  if (!artifact) return undefined;

  const rediscovered = appendEvent(
    {
      ...artifact,
      preservationState: "rediscovered",
    },
    {
      stage: "rediscovered",
      label: "Rediscovered",
      description: "Artifact resurfaced for review.",
    },
  );

  return saveArtifact(rediscovered);
};

export { STORAGE_KEY };
