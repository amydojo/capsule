import { z } from "zod";

export const PreservationStageSchema = z.enum(["captured", "isolated", "analyzed", "traced", "preserved", "sealed"]);
export const ArtifactLifecycleStatusSchema = z.enum(["active", "sealed", "rediscovered"]);

export const GeneratedArtifactSchema = z.object({
  title: z.string().min(1),
  commonName: z.string().min(1),
  category: z.string().min(1),
  classification: z.string().min(1),
  material: z.array(z.string().min(1)).min(1),
  condition: z.string().min(1),
  visibleDetails: z.array(z.string().min(1)).min(1),
  emotionalHypothesis: z.string().min(1),
  essence: z.string().min(1),
  continuityScore: z.coerce.number().min(70).max(98),
});

export const ArtifactTimelineEventSchema = z.object({
  id: z.string().min(1),
  stage: z.union([PreservationStageSchema, z.enum(["created", "updated", "rediscovered"])]),
  label: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
});

export const ArtifactObservationSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  createdAt: z.string().min(1),
});

export const ObjectBoundarySchema = z.object({
  x: z.coerce.number().min(0).max(1),
  y: z.coerce.number().min(0).max(1),
  width: z.coerce.number().min(0).max(1),
  height: z.coerce.number().min(0).max(1),
  unit: z.literal("normalized"),
});

export const ExtractionMethodSchema = z.enum(["manual-object-field", "assisted-object-field", "simulated-isolation", "fallback"]);

export const ArtifactExtractionSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;
  const extraction = value as { method?: string; warning?: string; warnings?: string[] };
  return {
    ...extraction,
    method: extraction.method === "manual-crop" ? "manual-object-field" : extraction.method,
    warnings: Array.isArray(extraction.warnings) ? extraction.warnings : extraction.warning ? [extraction.warning] : [],
  };
}, z.object({
  method: ExtractionMethodSchema,
  confidence: z.coerce.number().min(0).max(1),
  warnings: z.array(z.string()).default([]),
  warning: z.string().optional(),
}));

export const ArtifactRenderMetadataSchema = z.object({
  version: z.string().min(1),
  method: z.enum(["openai-pristine-render", "background-removed", "specimen-crop", "local-preserved-render", "fallback-render"]),
  isolationStatus: z.enum(["not_attempted", "success", "failed", "unavailable"]),
  pristineStatus: z.enum(["not_attempted", "success", "failed", "unavailable"]),
  localRenderStatus: z.enum(["not_attempted", "success", "failed"]),
  motionSeed: z.string().min(1),
  createdAt: z.string().min(1),
  provider: z.enum(["openai", "local", "none"]).optional(),
});

export const ArtifactImageReferenceSchema = z.object({
  storage: z.literal("indexeddb-v1"),
  key: z.string().min(1),
  byteSize: z.coerce.number().min(0),
  createdAt: z.string().min(1),
});

export const ArtifactStorageDiagnosticsSchema = z.object({
  version: z.string().min(1),
  method: z.enum(["indexeddb-v1", "localstorage-legacy", "metadata-only-degraded"]),
  compressionApplied: z.boolean(),
  localStorageBytes: z.coerce.number().min(0).optional(),
  indexedDbImageBytes: z.coerce.number().min(0).optional(),
  sourceOriginalBytes: z.coerce.number().min(0).optional(),
  sourceStoredBytes: z.coerce.number().min(0).optional(),
  artifactRenderStoredBytes: z.coerce.number().min(0).optional(),
  droppedImageFields: z.array(z.string()).optional(),
  lastSaveStatus: z.enum(["success", "failed", "degraded"]),
  lastSaveReason: z.string().optional(),
  createdAt: z.string().min(1),
});

export const PressureTraceSchema = z.object({
  compression: z.coerce.number().min(0).max(1),
  familiarity: z.coerce.number().min(0).max(1),
  fragility: z.coerce.number().min(0).max(1),
  residue: z.coerce.number().min(0).max(1),
  charge: z.coerce.number().min(0).max(1),
  preservationNeed: z.coerce.number().min(0).max(1),
});

export const ArtifactRecordSchema = z.object({
  identity: z.object({
    capsuleId: z.string().min(1),
    createdAt: z.string().min(1),
    userGivenName: z.string().min(1).optional(),
    systemArtifactName: z.string().min(1),
    collection: z.string().min(1).optional(),
  }),
  source: z.object({
    originalImageDataUrl: z.string().optional(),
    specimenImageDataUrl: z.string().optional(),
    isolatedSpecimenDataUrl: z.string().optional(),
    artifactRenderDataUrl: z.string().optional(),
    objectBoundary: ObjectBoundarySchema.optional(),
    userNote: z.string().min(1).optional(),
    origin: z.string().min(1).optional(),
  }),
  observedFacts: z.object({
    objectLabel: z.string().min(1),
    visibleText: z.array(z.string()).default([]),
    colors: z.array(z.string()).default([]),
    shapeAndSilhouette: z.array(z.string()).default([]),
    marksAndWear: z.array(z.string()).default([]),
    materialTags: z.array(z.string()).default([]),
    sceneContext: z.string().min(1).optional(),
  }),
  interpretiveLayer: z.object({
    artifactClass: z.string().min(1),
    pressureTrace: PressureTraceSchema,
    continuityNote: z.string().min(1),
    memoryHypothesis: z.string().min(1).optional(),
    toneTags: z.array(z.string()).optional(),
    doNotOverclaim: z.boolean(),
  }),
  modelProvenance: z.object({
    visionModel: z.string().min(1).optional(),
    detectorModel: z.string().min(1).optional(),
    segmentationModel: z.string().min(1).optional(),
    depthModel: z.string().min(1).optional(),
    embeddingModel: z.string().min(1).optional(),
    confidenceByField: z.record(z.string(), z.coerce.number().min(0).max(1)),
  }),
});

export const ArtifactSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  commonName: z.string().min(1),
  category: z.string().min(1),
  classification: z.string().min(1),
  capturePoint: z.string().min(1),
  origin: z.string(),
  objectName: z.string().optional(),
  whyNow: z.string().optional(),
  collection: z.string().optional(),
  contextNote: z.string().optional(),
  material: z.array(z.string().min(1)).min(1),
  condition: z.string().min(1),
  visibleDetails: z.array(z.string().min(1)).default([]),
  emotionalHypothesis: z.string().min(1),
  essence: z.string().min(1),
  preservationState: ArtifactLifecycleStatusSchema,
  continuityScore: z.coerce.number().min(0).max(100),
  currentStage: PreservationStageSchema,
  imageDataUrl: z.string().default(""),
  sourceImageDataUrl: z.string().optional(),
  specimenImageDataUrl: z.string().optional(),
  isolatedSpecimenDataUrl: z.string().optional(),
  pristineSpecimenDataUrl: z.string().optional(),
  artifactRenderDataUrl: z.string().optional(),
  thumbnailDataUrl: z.string().optional(),
  objectBoundary: ObjectBoundarySchema.optional(),
  extraction: ArtifactExtractionSchema.optional(),
  render: ArtifactRenderMetadataSchema.optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  observations: z.array(ArtifactObservationSchema),
  timeline: z.array(ArtifactTimelineEventSchema),
  record: ArtifactRecordSchema.optional(),
  imageReferences: z.record(z.string(), ArtifactImageReferenceSchema).optional(),
  storage: ArtifactStorageDiagnosticsSchema.optional(),
  ai: z
    .object({
      provider: z.string().min(1),
      model: z.string().min(1),
      usedFallback: z.boolean(),
    })
    .optional(),
});

export const ArtifactResponseSchema = z.object({
  artifact: ArtifactSchema,
});

export type GeneratedArtifactPayload = z.infer<typeof GeneratedArtifactSchema>;
export type ArtifactRecordPayload = z.infer<typeof ArtifactRecordSchema>;
