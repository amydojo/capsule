import type { Artifact } from "../types/artifact";

export const getSpecimenImageDataUrl = (artifact: Artifact) => artifact.isolatedSpecimenDataUrl || artifact.specimenImageDataUrl || artifact.imageDataUrl || "";

export const getArtifactThumbnailDataUrl = (artifact: Artifact) => artifact.isolatedSpecimenDataUrl || artifact.specimenImageDataUrl || artifact.thumbnailDataUrl || artifact.imageDataUrl || "";

export const hasObjectFieldPending = (artifact: Artifact) => Boolean(artifact.sourceImageDataUrl && !artifact.specimenImageDataUrl && !artifact.isolatedSpecimenDataUrl);
