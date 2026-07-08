import type { ExtractionMethod, NormalizedBoundary } from "./extraction";

export type PreservationStage = "captured" | "isolated" | "analyzed" | "traced" | "preserved" | "sealed";

export type ArtifactLifecycleStatus = "active" | "sealed" | "rediscovered";

export type ArtifactTimelineEvent = {
  id: string;
  stage: PreservationStage | "created" | "updated" | "rediscovered";
  label: string;
  description: string;
  date: string;
};

export type ArtifactObservation = {
  id: string;
  text: string;
  createdAt: string;
};

export type ObjectBoundary = NormalizedBoundary;

export type PressureTrace = {
  compression: number;
  familiarity: number;
  fragility: number;
  residue: number;
  charge: number;
  preservationNeed: number;
};

export type ArtifactRecord = {
  identity: {
    capsuleId: string;
    createdAt: string;
    userGivenName?: string;
    systemArtifactName: string;
    collection?: string;
  };
  source: {
    originalImageDataUrl?: string;
    specimenImageDataUrl?: string;
    isolatedSpecimenDataUrl?: string;
    artifactRenderDataUrl?: string;
    objectBoundary?: ObjectBoundary;
    userNote?: string;
    origin?: string;
  };
  observedFacts: {
    objectLabel: string;
    visibleText: string[];
    colors: string[];
    shapeAndSilhouette: string[];
    marksAndWear: string[];
    materialTags: string[];
    sceneContext?: string;
  };
  interpretiveLayer: {
    artifactClass: string;
    pressureTrace: PressureTrace;
    continuityNote: string;
    memoryHypothesis?: string;
    toneTags?: string[];
    doNotOverclaim: boolean;
  };
  modelProvenance: {
    visionModel?: string;
    detectorModel?: string;
    segmentationModel?: string;
    depthModel?: string;
    embeddingModel?: string;
    confidenceByField: Record<string, number>;
  };
};

export type ArtifactExtraction = {
  method: ExtractionMethod;
  confidence: number;
  warnings: string[];
  warning?: string;
};

export type ArtifactRenderMethod =
  | "openai-pristine-render"
  | "background-removed"
  | "specimen-crop"
  | "local-preserved-render"
  | "fallback-render";

export type ArtifactRenderMetadata = {
  version: string;
  method: ArtifactRenderMethod;
  isolationStatus: "not_attempted" | "success" | "failed" | "unavailable";
  pristineStatus: "not_attempted" | "success" | "failed" | "unavailable";
  localRenderStatus: "not_attempted" | "success" | "failed";
  motionSeed: string;
  createdAt: string;
  provider?: "openai" | "local" | "none";
};

export type ArtifactImageField =
  | "sourceImageDataUrl"
  | "specimenImageDataUrl"
  | "imageDataUrl"
  | "artifactRenderDataUrl"
  | "isolatedSpecimenDataUrl"
  | "pristineSpecimenDataUrl"
  | "thumbnailDataUrl";

export type ArtifactImageReference = {
  storage: "indexeddb-v1";
  key: string;
  byteSize: number;
  createdAt: string;
};

export type ArtifactStorageDiagnostics = {
  version: string;
  method: "indexeddb-v1" | "localstorage-legacy" | "metadata-only-degraded";
  compressionApplied: boolean;
  localStorageBytes?: number;
  indexedDbImageBytes?: number;
  sourceOriginalBytes?: number;
  sourceStoredBytes?: number;
  artifactRenderStoredBytes?: number;
  droppedImageFields?: string[];
  lastSaveStatus: "success" | "failed" | "degraded";
  lastSaveReason?: string;
  createdAt: string;
};

export type Artifact = {
  id: string;
  title: string;
  commonName: string;
  category: string;
  classification: string;
  capturePoint: string;
  origin: string;
  objectName?: string;
  whyNow?: string;
  collection?: string;
  contextNote?: string;
  material: string[];
  condition: string;
  visibleDetails: string[];
  emotionalHypothesis: string;
  essence: string;
  preservationState: ArtifactLifecycleStatus;
  continuityScore: number;
  currentStage: PreservationStage;
  imageDataUrl: string;
  sourceImageDataUrl?: string;
  specimenImageDataUrl?: string;
  isolatedSpecimenDataUrl?: string;
  pristineSpecimenDataUrl?: string;
  artifactRenderDataUrl?: string;
  thumbnailDataUrl?: string;
  objectBoundary?: ObjectBoundary;
  extraction?: ArtifactExtraction;
  render?: ArtifactRenderMetadata;
  createdAt: string;
  updatedAt: string;
  observations: ArtifactObservation[];
  timeline: ArtifactTimelineEvent[];
  record?: ArtifactRecord;
  imageReferences?: Partial<Record<ArtifactImageField, ArtifactImageReference>>;
  storage?: ArtifactStorageDiagnostics;
  ai?: {
    provider: string;
    model: string;
    usedFallback: boolean;
  };
};
