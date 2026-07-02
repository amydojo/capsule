import type { Artifact } from "../types/artifact";
import { deleteArtifact, loadArtifact, saveArtifact, STORAGE_KEY } from "./artifactStorage";

type ArtifactStorageSmokeResult = {
  artifactId: string;
  localStorageHasImagePayload: boolean;
  rehydratedImages: string[];
  storageMethod?: string;
  sourceOriginalBytes?: number;
  sourceStoredBytes?: number;
};

const createSmokeImage = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Smoke check canvas unavailable.");

  for (let index = 0; index < height; index += 8) {
    context.fillStyle = `rgb(${(index * 7) % 255}, ${(index * 13) % 255}, ${(index * 19) % 255})`;
    context.fillRect(0, index, width, 8);
  }

  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.fillRect(width * 0.2, height * 0.22, width * 0.58, height * 0.5);
  return canvas.toDataURL("image/png");
};

const createSmokeArtifact = (): Artifact => {
  const now = new Date().toISOString();
  const sourceImageDataUrl = createSmokeImage(2200, 1600);
  const specimenImageDataUrl = createSmokeImage(1200, 1000);
  const id = `CF-SMOKE-${Date.now()}`;

  return {
    id,
    title: "Storage Smoke Artifact",
    commonName: "storage smoke artifact",
    category: "object",
    classification: "continuity artifact",
    capturePoint: "storage smoke check",
    origin: "local browser utility",
    material: ["test material"],
    condition: "captured for preservation",
    visibleDetails: ["storage smoke image retained"],
    emotionalHypothesis: "Storage path is being checked.",
    essence: "A generated artifact used to verify local persistence.",
    preservationState: "active",
    continuityScore: 88,
    currentStage: "preserved",
    imageDataUrl: specimenImageDataUrl,
    sourceImageDataUrl,
    specimenImageDataUrl,
    thumbnailDataUrl: specimenImageDataUrl,
    createdAt: now,
    updatedAt: now,
    observations: [],
    timeline: [
      {
        id: `${id}-created`,
        stage: "created",
        label: "Artifact record created",
        description: "Storage smoke artifact created.",
        date: now,
      },
    ],
  };
};

export const runArtifactStorageSmokeCheck = async (): Promise<ArtifactStorageSmokeResult> => {
  if (typeof window === "undefined") {
    throw new Error("Artifact storage smoke check must run in a browser.");
  }

  const artifact = createSmokeArtifact();
  const savedArtifact = await saveArtifact(artifact, { retryAttempt: 1 });
  const storedRecord = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]")
    .find((item: { id?: string }) => item.id === artifact.id);
  const loadedArtifact = await loadArtifact(artifact.id);
  const result: ArtifactStorageSmokeResult = {
    artifactId: artifact.id,
    localStorageHasImagePayload: JSON.stringify(storedRecord || {}).includes("data:image"),
    rehydratedImages: [
      loadedArtifact?.sourceImageDataUrl ? "sourceImageDataUrl" : "",
      loadedArtifact?.specimenImageDataUrl ? "specimenImageDataUrl" : "",
      loadedArtifact?.imageDataUrl ? "imageDataUrl" : "",
    ].filter(Boolean),
    storageMethod: savedArtifact.storage?.method,
    sourceOriginalBytes: savedArtifact.storage?.sourceOriginalBytes,
    sourceStoredBytes: savedArtifact.storage?.sourceStoredBytes,
  };

  await deleteArtifact(artifact.id);
  return result;
};
