import { ArtifactResponseSchema } from "../schemas/artifactSchema";
import type { Artifact } from "../types/artifact";
import type { CaptureInput } from "../types/capture";
import { generateClientFallbackArtifact } from "./clientFallbackArtifact";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const generateArtifact = async (input: CaptureInput): Promise<Artifact> => {
  const requestInput: CaptureInput = {
    ...input,
    imageDataUrl: input.specimenImageDataUrl || input.imageDataUrl,
  };

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
