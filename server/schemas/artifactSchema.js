import { z } from "zod";

export const CaptureInputSchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
  objectName: z.string().min(1),
  whyNow: z.string().min(1),
  futureMemory: z.string().min(1),
  origin: z.string().optional().default(""),
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
  thumbnailDataUrl: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  observations: z.array(z.object({ id: z.string(), text: z.string(), createdAt: z.string() })),
  timeline: z.array(z.object({ id: z.string(), stage: z.string(), label: z.string(), description: z.string(), date: z.string() })),
  ai: z.object({ provider: z.string(), model: z.string(), usedFallback: z.boolean() }).optional(),
});
