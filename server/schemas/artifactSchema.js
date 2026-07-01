import { z } from "zod";

export const CaptureInputSchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
  sourceImageDataUrl: z.string().startsWith("data:image/").optional(),
  specimenImageDataUrl: z.string().startsWith("data:image/").optional(),
  thumbnailDataUrl: z.string().startsWith("data:image/").optional(),
  objectBoundary: z
    .object({
      x: z.coerce.number().min(0).max(1),
      y: z.coerce.number().min(0).max(1),
      width: z.coerce.number().min(0).max(1),
      height: z.coerce.number().min(0).max(1),
      unit: z.literal("normalized"),
    })
    .optional(),
  extraction: z
    .object({
      method: z.enum(["manual-object-field", "assisted-object-field", "simulated-isolation", "fallback"]),
      confidence: z.coerce.number().min(0).max(1),
      warnings: z.array(z.string()).optional().default([]),
      createdAt: z.string().optional(),
    })
    .optional(),
  objectName: z.string().trim().min(1).optional().default("Object"),
  whyNow: z.string().trim().min(1).optional().default("Preserved from a Capsule capture."),
  futureMemory: z.string().trim().min(1).optional().default("This object existed here and was worth preserving."),
  origin: z.string().optional().default("field capture"),
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

export const ArtifactSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  commonName: z.string().min(1),
  category: z.string().min(1),
  classification: z.string().min(1),
  capturePoint: z.string().min(1),
  origin: z.string(),
  material: z.array(z.string().min(1)).min(1),
  condition: z.string().min(1),
  visibleDetails: z.array(z.string().min(1)),
  emotionalHypothesis: z.string().min(1),
  essence: z.string().min(1),
  preservationState: z.enum(["active", "sealed", "rediscovered"]),
  continuityScore: z.coerce.number().min(0).max(100),
  currentStage: z.enum(["captured", "isolated", "analyzed", "traced", "preserved", "sealed"]),
  imageDataUrl: z.string().min(1),
  isolatedSpecimenDataUrl: z.string().optional(),
  sourceImageDataUrl: z.string().optional(),
  specimenImageDataUrl: z.string().optional(),
  thumbnailDataUrl: z.string().optional(),
  objectBoundary: z
    .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number(), unit: z.literal("normalized") })
    .optional(),
  extraction: ArtifactExtractionSchema.optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  observations: z.array(z.object({ id: z.string(), text: z.string(), createdAt: z.string() })),
  timeline: z.array(z.object({ id: z.string(), stage: z.string(), label: z.string(), description: z.string(), date: z.string() })),
  ai: z.object({ provider: z.string(), model: z.string(), usedFallback: z.boolean() }).optional(),
});
