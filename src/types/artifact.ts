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
  isolatedSpecimenDataUrl?: string;
  sourceImageDataUrl?: string;
  specimenImageDataUrl?: string;
  thumbnailDataUrl?: string;
  objectBoundary?: ObjectBoundary;
  extraction?: ArtifactExtraction;
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
