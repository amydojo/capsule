import type { Artifact, ObjectBoundary, PreservationStage } from "./artifact";
import type { ExtractionResult } from "./extraction";

export type CaptureInput = {
  imageDataUrl: string;
  sourceImageDataUrl?: string;
  specimenImageDataUrl?: string;
  thumbnailDataUrl?: string;
  objectBoundary?: ObjectBoundary;
  extraction?: Omit<ExtractionResult, "specimenImageDataUrl" | "sourceImageDataUrl" | "objectBoundary">;
  objectName?: string;
  whyNow?: string;
  futureMemory?: string;
  origin?: string;
  capturePoint: string;
};

export type PreservationSessionStatus = "idle" | "intake" | "capturing" | "preserving" | "complete" | "error";

export type PreservationSession = {
  id: string;
  status: PreservationSessionStatus;
  input?: CaptureInput;
  artifact?: Artifact;
  error?: string;
  activeStage: PreservationStage;
  progress: number;
};
