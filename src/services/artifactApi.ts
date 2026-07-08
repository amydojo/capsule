import { ArtifactResponseSchema } from "../schemas/artifactSchema";
import type { Artifact } from "../types/artifact";
import type { CaptureInput } from "../types/capture";
import { generateClientFallbackArtifact } from "./clientFallbackArtifact";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const normalizeCaptureInput = (input: CaptureInput): CaptureInput => ({
  ...input,
  imageDataUrl: input.specimenImageDataUrl || input.imageDataUrl,
  objectName: input.objectName?.trim() || "Object",
  origin: input.origin?.trim() || "field capture",
  whyNow: input.whyNow?.trim() || "Preserved from a Capsule capture.",
  futureMemory: input.futureMemory?.trim() || "This object existed here and was worth preserving.",
});

export const generateArtifact = async (input: CaptureInput): Promise<Artifact> => {
  const requestInput = normalizeCaptureInput(input);

  try {
    const response = await fetch(`${API_BASE_URL}/api/artifacts/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestInput),
    });

    if (!response.ok) {
      throw new Error("Preservation service returned an error.");
    }

    const json = await response.json();
    const parsed = ArtifactResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error("Preservation service returned an invalid artifact.");
    }

    return parsed.data.artifact;
  } catch {
    return generateClientFallbackArtifact(requestInput);
  }
};
