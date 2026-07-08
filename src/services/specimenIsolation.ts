import type { ObjectBoundary } from "../types/artifact";

export type SpecimenIsolationRequest = {
  specimenImageDataUrl: string;
  sourceImageDataUrl?: string;
  objectBoundary?: ObjectBoundary;
  artifactId?: string;
  fossilId?: string;
};

export type SpecimenIsolationResponse = {
  isolatedSpecimenDataUrl?: string;
  status: "success" | "failed" | "unavailable";
  reason?: string;
};

export const isolateSpecimen = async (_request: SpecimenIsolationRequest): Promise<SpecimenIsolationResponse> => ({
  status: "unavailable",
  reason: "No dedicated specimen isolation provider is configured.",
});
