import type { Artifact, PreservationStage } from "./artifact";

export type CaptureInput = {
  imageDataUrl: string;
  objectName: string;
  whyNow: string;
  futureMemory: string;
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
