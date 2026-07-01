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

export type Artifact = {
  id: string;
  title: string;
  commonName: string;
  category: string;
  classification: string;
  capturePoint: string;
  origin: string;
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
  ai?: {
    provider: string;
    model: string;
    usedFallback: boolean;
  };
};
