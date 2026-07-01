import type { Artifact } from "../types/artifact";

export const getArtifactHeroImage = (artifact: Artifact) =>
  artifact.pristineSpecimenDataUrl ||
  artifact.artifactRenderDataUrl ||
  artifact.isolatedSpecimenDataUrl ||
  artifact.specimenImageDataUrl ||
  artifact.imageDataUrl ||
  artifact.sourceImageDataUrl ||
  "";

export const getArtifactSourceImage = (artifact: Artifact) => artifact.sourceImageDataUrl || "";

export const getArtifactSpecimenImage = (artifact: Artifact) =>
  artifact.isolatedSpecimenDataUrl || artifact.specimenImageDataUrl || artifact.imageDataUrl || "";

export const getSpecimenImageDataUrl = getArtifactSpecimenImage;

export const getArtifactThumbnailDataUrl = getArtifactHeroImage;

export const hasPristineSpecimen = (artifact: Artifact) => Boolean(artifact.pristineSpecimenDataUrl);

export const hasPreservedRender = (artifact: Artifact) => Boolean(artifact.artifactRenderDataUrl);

export const hasObjectFieldPending = (artifact: Artifact) => Boolean(artifact.sourceImageDataUrl && !artifact.specimenImageDataUrl && !artifact.isolatedSpecimenDataUrl);
