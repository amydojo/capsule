import { unavailableDepthProvider, createUnavailableDepthResult } from "./depthProvider.js";
import { unavailableEmbeddingProvider, createUnavailableEmbeddingResult } from "./embeddingProvider.js";
import { unavailableSegmentationProvider, createUnavailableSegmentationResult } from "./segmentationProvider.js";
import { PROVIDER_STATUS, providerModelLabel, safeCallProvider } from "./types.js";
import { unavailableVisionProvider, createUnavailableVisionResult } from "./visionProvider.js";

export { unavailableDepthProvider } from "./depthProvider.js";
export { unavailableEmbeddingProvider } from "./embeddingProvider.js";
export { unavailableSegmentationProvider } from "./segmentationProvider.js";
export { PROVIDER_STATUS, createErrorResult, createProviderProvenance, createUnavailableResult, providerModelLabel, safeCallProvider } from "./types.js";
export { unavailableVisionProvider } from "./visionProvider.js";

export const getModelProviders = () => ({
  visionProvider: unavailableVisionProvider,
  segmentationProvider: unavailableSegmentationProvider,
  depthProvider: unavailableDepthProvider,
  embeddingProvider: unavailableEmbeddingProvider,
});

export const collectProviderResults = async (input, providers = getModelProviders()) => ({
  vision: await safeCallProvider(() => providers.visionProvider.analyze(input), createUnavailableVisionResult()),
  segmentation: await safeCallProvider(() => providers.segmentationProvider.segment(input), createUnavailableSegmentationResult()),
  depth: await safeCallProvider(() => providers.depthProvider.estimateDepth(input), createUnavailableDepthResult()),
  embedding: await safeCallProvider(() => providers.embeddingProvider.embedArtifact(input), createUnavailableEmbeddingResult()),
});

const chooseModelLabel = (existingValue, providerResult) => {
  if (providerResult?.status === PROVIDER_STATUS.ready) return providerModelLabel(providerResult);
  return existingValue || providerModelLabel(providerResult);
};

const mergeDefinedFields = (base, patch = {}) =>
  Object.entries(patch).reduce(
    (merged, [key, value]) => (value === undefined || value === null ? merged : { ...merged, [key]: value }),
    base,
  );

export const mergeProviderResultsIntoRecord = (artifactRecord, providerResults = {}) => {
  const visionConfidence = providerResults.vision?.confidenceByField || {};
  const observedFacts =
    providerResults.vision?.status === PROVIDER_STATUS.ready
      ? mergeDefinedFields(artifactRecord.observedFacts, providerResults.vision.observedFacts)
      : artifactRecord.observedFacts;
  const source =
    providerResults.segmentation?.status === PROVIDER_STATUS.ready
      ? mergeDefinedFields(artifactRecord.source, {
          objectBoundary: providerResults.segmentation.objectBoundary,
          isolatedSpecimenDataUrl: providerResults.segmentation.isolatedSpecimenDataUrl || providerResults.segmentation.cutoutDataUrl,
        })
      : artifactRecord.source;

  return {
    ...artifactRecord,
    source,
    observedFacts,
    modelProvenance: {
      ...artifactRecord.modelProvenance,
      visionModel: chooseModelLabel(artifactRecord.modelProvenance.visionModel, providerResults.vision),
      segmentationModel: chooseModelLabel(artifactRecord.modelProvenance.segmentationModel, providerResults.segmentation),
      depthModel: chooseModelLabel(artifactRecord.modelProvenance.depthModel, providerResults.depth),
      embeddingModel: chooseModelLabel(artifactRecord.modelProvenance.embeddingModel, providerResults.embedding),
      confidenceByField: {
        ...artifactRecord.modelProvenance.confidenceByField,
        ...visionConfidence,
      },
    },
  };
};
