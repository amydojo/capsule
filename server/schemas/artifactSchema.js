import { z } from "zod";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() || undefined : value),
  z.string().min(1).optional(),
);

const ObjectBoundarySchema = z.object({
  x: z.coerce.number().min(0).max(1),
  y: z.coerce.number().min(0).max(1),
  width: z.coerce.number().min(0).max(1),
  height: z.coerce.number().min(0).max(1),
  unit: z.literal("normalized"),
});

export const CaptureInputSchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
  sourceImageDataUrl: z.string().startsWith("data:image/").optional(),
  specimenImageDataUrl: z.string().startsWith("data:image/").optional(),
  isolatedSpecimenDataUrl: z.string().startsWith("data:image/").optional(),
  pristineSpecimenDataUrl: z.string().startsWith("data:image/").optional(),
  artifactRenderDataUrl: z.string().startsWith("data:image/").optional(),
  thumbnailDataUrl: z.string().startsWith("data:image/").optional(),
  objectBoundary: ObjectBoundarySchema.optional(),
  extraction: z
    .object({
      method: z.enum(["manual-object-field", "assisted-object-field", "simulated-isolation", "fallback"]),
      confidence: z.coerce.number().min(0).max(1),
      warnings: z.array(z.string()).optional().default([]),
      createdAt: z.string().optional(),
    })
    .optional(),
  objectName: optionalTrimmedString.default("Object"),
  whyNow: optionalTrimmedString,
  futureMemory: optionalTrimmedString,
  origin: optionalTrimmedString.default("field capture"),
  collection: optionalTrimmedString,
  capturePoint: z.string().min(1),
});

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

const ExtractionMethodSchema = z.enum(["manual-object-field", "assisted-object-field", "simulated-isolation", "fallback"]);
const ArtifactExtractionSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;
  const extraction = value;
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
  visibleDetails: z.array(z.string().min(1)),
  emotionalHypothesis: z.string().min(1),
  essence: z.string().min(1),
  preservationState: z.enum(["active", "sealed", "rediscovered"]),
  continuityScore: z.coerce.number().min(0).max(100),
  currentStage: z.enum(["captured", "isolated", "analyzed", "traced", "preserved", "sealed"]),
  imageDataUrl: z.string().min(1),
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
  observations: z.array(z.object({ id: z.string(), text: z.string(), createdAt: z.string() })),
  timeline: z.array(z.object({ id: z.string(), stage: z.string(), label: z.string(), description: z.string(), date: z.string() })),
  record: ArtifactRecordSchema.optional(),
  ai: z.object({ provider: z.string(), model: z.string(), usedFallback: z.boolean() }).optional(),
});
