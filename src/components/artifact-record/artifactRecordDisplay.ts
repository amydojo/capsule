import type { Artifact, ArtifactRecord, PressureTrace } from "../../types/artifact";

type OptionalArtifactDisplayFields = Partial<{
  accessionId: string;
  cutoutDataUrl: string;
  imageUrl: string;
  name: string;
  renderDataUrl: string;
}>;

type DisplayArtifact = Artifact & OptionalArtifactDisplayFields;

export type ArtifactDisplayRow = {
  label: string;
  value: string;
};

export type ArtifactRecordSectionId =
  | "user-context"
  | "observed"
  | "inferred"
  | "source"
  | "model";

export type ArtifactRecordDisplaySection = {
  id: ArtifactRecordSectionId;
  label: string;
  rows: ArtifactDisplayRow[];
  summary?: string;
};

const GENERIC_VALUES = new Set([
  "unknown",
  "unclear",
  "object",
  "artifact",
  "item",
  "misc",
  "miscellaneous",
  "field capture",
  "continuity artifact",
  "unknown material",
  "source image",
  "image capture",
  "generated artifact",
  "none",
  "n/a",
  "null",
  "undefined",
]);

const pressureTraceLabels: Array<keyof PressureTrace> = [
  "compression",
  "familiarity",
  "fragility",
  "residue",
  "charge",
  "preservationNeed",
];

const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const displayValue = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ");

export const isUsefulArtifactValue = (value: unknown) => {
  const normalized = normalizeValue(value);
  return normalized.length > 0 && !GENERIC_VALUES.has(normalized);
};

const firstUseful = (...values: unknown[]) => values.map(displayValue).find(isUsefulArtifactValue);

const usefulList = (values: unknown[] = []) => {
  const seen = new Set<string>();

  return values.reduce<string[]>((collected, value) => {
    const display = displayValue(value);
    const normalized = normalizeValue(display);
    if (!isUsefulArtifactValue(display) || seen.has(normalized)) return collected;
    seen.add(normalized);
    collected.push(display);
    return collected;
  }, []);
};

const row = (label: string, value: unknown): ArtifactDisplayRow | undefined => {
  const display = displayValue(value);
  return isUsefulArtifactValue(display) ? { label, value: display } : undefined;
};

const compactJoin = (values: unknown[], fallback?: string) => {
  const useful = usefulList(values);
  return useful.length ? useful.join(", ") : fallback;
};

const formatPercent = (value: number) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;

const formatFieldLabel = (value: string) =>
  value
    .replace(/\./g, " / ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatPressureLabel = (value: keyof PressureTrace) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

const polishVisibleDetail = (detail: string) => {
  const normalized = detail.toLowerCase();
  if (normalized.includes("uploaded") && normalized.includes("object image")) return "selected specimen region";
  if (normalized.includes("user-provided") && normalized.includes("object context")) return "selected specimen evidence retained";
  if (normalized.includes("mixed") && normalized.includes("material") && normalized.includes("inferred")) return "surface details pending closer analysis";
  return detail;
};

const sourceStatus = (record: ArtifactRecord, artifact: Artifact) => {
  if (record.source.isolatedSpecimenDataUrl || artifact.isolatedSpecimenDataUrl) return "isolated specimen";
  if (record.source.specimenImageDataUrl || artifact.specimenImageDataUrl) return "specimen retained";
  if (record.source.artifactRenderDataUrl || artifact.artifactRenderDataUrl) return "render retained";
  if (record.source.originalImageDataUrl || artifact.sourceImageDataUrl || artifact.imageDataUrl) return "source retained";
  return undefined;
};

export const getArtifactDisplayTitle = (artifact: Artifact, record: ArtifactRecord) => {
  const displayArtifact = artifact as DisplayArtifact;
  return (
    firstUseful(
      record.identity.userGivenName,
      artifact.objectName,
      record.identity.systemArtifactName,
      artifact.title,
      displayArtifact.name,
    ) || "Untitled artifact"
  );
};

export const getArtifactAccessionLabel = (artifact: Artifact) => {
  const displayArtifact = artifact as DisplayArtifact;
  const accessionId = displayValue(displayArtifact.accessionId);
  if (accessionId) return accessionId;

  const safeId = displayValue(artifact.id).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!safeId) return "CAP-LOCAL";

  const suffix = safeId.length > 5 ? safeId.slice(-5) : safeId;
  return `CAP-${suffix}`;
};

export const getArtifactHeroImage = (artifact: Artifact, record: ArtifactRecord) => {
  const displayArtifact = artifact as DisplayArtifact;
  return (
    record.source.isolatedSpecimenDataUrl ||
    artifact.isolatedSpecimenDataUrl ||
    artifact.specimenImageDataUrl ||
    displayArtifact.cutoutDataUrl ||
    displayArtifact.renderDataUrl ||
    artifact.artifactRenderDataUrl ||
    record.source.artifactRenderDataUrl ||
    artifact.imageDataUrl ||
    displayArtifact.imageUrl ||
    artifact.sourceImageDataUrl ||
    null
  );
};

export const formatPreservedDate = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return isUsefulArtifactValue(value) ? displayValue(value) : "date not recorded";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
};

export const summarizePressureTrace = (pressureTrace: PressureTrace) => {
  const strongest = pressureTraceLabels
    .map((label) => ({ label, value: pressureTrace[label] }))
    .filter((item) => Number.isFinite(item.value))
    .sort((left, right) => right.value - left.value)
    .slice(0, 2)
    .map((item) => formatPressureLabel(item.label));

  return strongest.length ? strongest.join(" + ") : undefined;
};

export const getArtifactPrimaryMetadata = (artifact: Artifact, record: ArtifactRecord) => {
  const material = compactJoin(record.observedFacts.materialTags, undefined);
  const source = sourceStatus(record, artifact);
  const origin = firstUseful(record.source.origin, artifact.origin);
  const collection = firstUseful(record.identity.collection, artifact.collection);
  const artifactClass = firstUseful(record.interpretiveLayer.artifactClass, artifact.classification);

  const preferred = collection || material
    ? [
        row("ORIGIN", origin),
        row("COLLECTION", collection),
        row("MATERIAL", material),
        row("CLASS", artifactClass),
        row("SOURCE", source),
      ]
    : [
        row("SOURCE", source),
        row("ORIGIN", origin),
        row("CLASS", artifactClass),
        row("MATERIAL", material),
      ];

  return preferred.filter((item): item is ArtifactDisplayRow => Boolean(item)).slice(0, 3);
};

export const getArtifactRecordSections = (artifact: Artifact, record: ArtifactRecord): ArtifactRecordDisplaySection[] => {
  const userRows = [
    row("Object name", record.identity.userGivenName || artifact.objectName),
    row("Context", record.source.userNote || artifact.contextNote || artifact.whyNow),
    row("Origin", record.source.origin || artifact.origin),
    row("Collection", record.identity.collection || artifact.collection),
  ].filter((item): item is ArtifactDisplayRow => Boolean(item));

  const visibleDetails = usefulList(record.observedFacts.shapeAndSilhouette.map(polishVisibleDetail));
  const marksAndWear = usefulList(record.observedFacts.marksAndWear.map(polishVisibleDetail));
  const observedRows = [
    row("Object label", record.observedFacts.objectLabel),
    row("Material", compactJoin(record.observedFacts.materialTags)),
    row("Visible text", compactJoin(record.observedFacts.visibleText)),
    row("Colors", compactJoin(record.observedFacts.colors)),
    row("Shape", compactJoin(visibleDetails)),
    row("Marks", compactJoin(marksAndWear)),
    row("Confidence", record.modelProvenance.confidenceByField["observedFacts.objectLabel"] ? formatPercent(record.modelProvenance.confidenceByField["observedFacts.objectLabel"]) : undefined),
  ].filter((item): item is ArtifactDisplayRow => Boolean(item));

  const pressureSummary = summarizePressureTrace(record.interpretiveLayer.pressureTrace);
  const inferredRows = [
    row("Class", record.interpretiveLayer.artifactClass || artifact.classification),
    row("Continuity", record.interpretiveLayer.continuityNote || artifact.essence),
    row("Hypothesis", record.interpretiveLayer.memoryHypothesis || artifact.emotionalHypothesis),
    row("Pressure", pressureSummary),
    row("Caution", record.interpretiveLayer.doNotOverclaim ? "interpretation restrained" : undefined),
  ].filter((item): item is ArtifactDisplayRow => Boolean(item));

  const sourceRows = [
    row("Source", sourceStatus(record, artifact)),
    row("Original", record.source.originalImageDataUrl || artifact.sourceImageDataUrl ? "retained" : undefined),
    row("Specimen", record.source.specimenImageDataUrl || artifact.specimenImageDataUrl ? "retained" : undefined),
    row("Isolated", record.source.isolatedSpecimenDataUrl || artifact.isolatedSpecimenDataUrl ? "retained" : undefined),
    row("Render", record.source.artifactRenderDataUrl || artifact.artifactRenderDataUrl ? "retained" : undefined),
    row("Boundary", record.source.objectBoundary || artifact.objectBoundary ? "recorded" : undefined),
  ].filter((item): item is ArtifactDisplayRow => Boolean(item));

  const modelRows = [
    row("Vision", record.modelProvenance.visionModel),
    row("Detector", record.modelProvenance.detectorModel),
    row("Segmentation", record.modelProvenance.segmentationModel),
    row("Depth", record.modelProvenance.depthModel),
    row("Embedding", record.modelProvenance.embeddingModel),
    row("Provider", artifact.ai ? `${artifact.ai.provider} / ${artifact.ai.model}` : undefined),
    row("Fallback", artifact.ai?.usedFallback ? "structured fallback" : undefined),
    ...Object.entries(record.modelProvenance.confidenceByField).map(([label, value]) =>
      row(formatFieldLabel(label), formatPercent(value)),
    ),
  ].filter((item): item is ArtifactDisplayRow => Boolean(item));

  const sections: ArtifactRecordDisplaySection[] = [
    { id: "user-context", label: "USER CONTEXT", rows: userRows },
    { id: "observed", label: "OBSERVED BY CAPSULE", rows: observedRows },
    { id: "inferred", label: "INFERRED BY CAPSULE", rows: inferredRows },
    { id: "source", label: "SOURCE EVIDENCE", rows: sourceRows },
    { id: "model", label: "MODEL PROVENANCE", rows: modelRows },
  ];

  return sections.filter((section) => section.rows.length > 0);
};
