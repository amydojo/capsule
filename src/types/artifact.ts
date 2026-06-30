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
  thumbnailDataUrl?: string;
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
