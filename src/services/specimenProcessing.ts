import type { Artifact, ArtifactRenderMetadata } from "../types/artifact";
import type { CaptureInput } from "../types/capture";
import { createMotionSeed } from "../utils/motionSeed";
import { createLocalPreservedSpecimenRender } from "../utils/specimenRender";
import { isolateSpecimen } from "./specimenIsolation";
import { renderPristineSpecimen } from "./specimenRenderProvider";

const VERSION = "specimen-render-v1";

const createFallbackRenderMetadata = (
  artifact: Artifact,
  input: CaptureInput,
  overrides: Partial<ArtifactRenderMetadata> = {},
): ArtifactRenderMetadata => ({
  version: VERSION,
  method: "fallback-render",
  isolationStatus: "not_attempted",
  pristineStatus: "not_attempted",
  localRenderStatus: "not_attempted",
  motionSeed: createMotionSeed({
    artifactId: artifact.id,
    boundary: artifact.objectBoundary || input.objectBoundary,
    source: (artifact.sourceImageDataUrl || input.sourceImageDataUrl)?.slice(0, 128),
    specimen: (artifact.specimenImageDataUrl || input.specimenImageDataUrl || artifact.imageDataUrl || input.imageDataUrl)?.slice(0, 128),
  }),
  createdAt: new Date().toISOString(),
  provider: "none",
  ...overrides,
});

export const processSpecimenImages = async (artifact: Artifact, input: CaptureInput): Promise<Artifact> => {
  const specimenImageDataUrl = artifact.specimenImageDataUrl || input.specimenImageDataUrl || artifact.imageDataUrl || input.imageDataUrl;
  const sourceImageDataUrl = artifact.sourceImageDataUrl || input.sourceImageDataUrl;
  const objectBoundary = artifact.objectBoundary || input.objectBoundary;

  if (!specimenImageDataUrl) {
    return {
      ...artifact,
      render: createFallbackRenderMetadata(artifact, input),
    };
  }

  let isolatedSpecimenDataUrl = artifact.isolatedSpecimenDataUrl || input.isolatedSpecimenDataUrl;
  let pristineSpecimenDataUrl = artifact.pristineSpecimenDataUrl || input.pristineSpecimenDataUrl;
  let isolationStatus: ArtifactRenderMetadata["isolationStatus"] = isolatedSpecimenDataUrl ? "success" : "not_attempted";
  let pristineStatus: ArtifactRenderMetadata["pristineStatus"] = pristineSpecimenDataUrl ? "success" : "not_attempted";

  if (!isolatedSpecimenDataUrl) {
    try {
      const isolation = await isolateSpecimen({
        specimenImageDataUrl,
        sourceImageDataUrl,
        objectBoundary,
        artifactId: artifact.id,
        fossilId: artifact.id,
      });
      isolationStatus = isolation.status;
      if (isolation.status === "success" && isolation.isolatedSpecimenDataUrl) {
        isolatedSpecimenDataUrl = isolation.isolatedSpecimenDataUrl;
      }
    } catch {
      isolationStatus = "failed";
    }
  }

  if (!pristineSpecimenDataUrl) {
    try {
      const pristine = await renderPristineSpecimen({
        specimenImageDataUrl: isolatedSpecimenDataUrl || specimenImageDataUrl,
        sourceImageDataUrl,
        objectName: artifact.commonName || input.objectName,
        artifactId: artifact.id,
        fossilId: artifact.id,
        objectBoundary,
      });
      pristineStatus = pristine.status;
      if (pristine.status === "success" && pristine.pristineSpecimenDataUrl) {
        pristineSpecimenDataUrl = pristine.pristineSpecimenDataUrl;
      }
    } catch {
      pristineStatus = "failed";
    }
  }

  let artifactRenderDataUrl = artifact.artifactRenderDataUrl || input.artifactRenderDataUrl;
  let render = createFallbackRenderMetadata(artifact, input, {
    isolationStatus,
    pristineStatus,
  });

  try {
    const localRender = await createLocalPreservedSpecimenRender({
      artifactId: artifact.id,
      fossilId: artifact.id,
      specimenImageDataUrl,
      isolatedSpecimenDataUrl,
      pristineSpecimenDataUrl,
      sourceImageDataUrl,
      objectBoundary,
      theme: "light",
    });
    artifactRenderDataUrl = localRender.artifactRenderDataUrl || artifactRenderDataUrl;
    render = {
      ...localRender.render,
      method: pristineStatus === "success" && pristineSpecimenDataUrl ? "openai-pristine-render" : localRender.render.method,
      isolationStatus,
      pristineStatus,
      localRenderStatus: localRender.render.localRenderStatus,
      provider: pristineStatus === "success" && pristineSpecimenDataUrl ? "openai" : localRender.render.localRenderStatus === "success" ? "local" : "none",
    };
  } catch {
    render = {
      ...render,
      method: specimenImageDataUrl ? "specimen-crop" : "fallback-render",
      localRenderStatus: "failed",
      provider: pristineStatus === "success" && pristineSpecimenDataUrl ? "openai" : "none",
    };
  }

  return {
    ...artifact,
    sourceImageDataUrl,
    specimenImageDataUrl,
    isolatedSpecimenDataUrl,
    pristineSpecimenDataUrl,
    artifactRenderDataUrl,
    render,
    updatedAt: new Date().toISOString(),
  };
};
