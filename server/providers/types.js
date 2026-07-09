/**
 * @typedef {"ready" | "unavailable" | "error"} ProviderStatus
 *
 * @typedef {Object} ProviderProvenance
 * @property {string} providerId
 * @property {string} modelId
 * @property {ProviderStatus} status
 * @property {string} createdAt
 *
 * @typedef {Object} ProviderContext
 * @property {string=} objectName
 * @property {string=} whyNow
 * @property {string=} origin
 * @property {string=} collection
 * @property {string=} capturePoint
 *
 * @typedef {Object} ModelProviderInput
 * @property {string=} imageDataUrl
 * @property {string=} specimenImageDataUrl
 * @property {{ x: number, y: number, width: number, height: number, unit: "normalized" }=} objectBoundary
 * @property {Object=} artifactRecord
 * @property {ProviderContext=} context
 * @property {string=} requestId
 *
 * @typedef {Object} BaseProviderResult
 * @property {ProviderStatus} status
 * @property {string} providerId
 * @property {string} modelId
 * @property {number} confidence
 * @property {string[]} warnings
 * @property {ProviderProvenance} provenance
 *
 * @typedef {BaseProviderResult & {
 *   observedFacts?: {
 *     objectLabel?: string,
 *     visibleText?: string[],
 *     colors?: string[],
 *     shapeAndSilhouette?: string[],
 *     marksAndWear?: string[],
 *     materialTags?: string[],
 *     sceneContext?: string
 *   },
 *   confidenceByField?: Record<string, number>
 * }} VisionProviderResult
 *
 * @typedef {BaseProviderResult & {
 *   objectBoundary?: { x: number, y: number, width: number, height: number, unit: "normalized" },
 *   maskDataUrl?: string,
 *   cutoutDataUrl?: string,
 *   isolatedSpecimenDataUrl?: string
 * }} SegmentationProviderResult
 *
 * @typedef {BaseProviderResult & {
 *   depthMapDataUrl?: string,
 *   parallaxMetadata?: Record<string, unknown>
 * }} DepthProviderResult
 *
 * @typedef {BaseProviderResult & {
 *   embeddingRef?: string,
 *   vectorDimensions?: number,
 *   retrievalMetadata?: Record<string, unknown>
 * }} EmbeddingProviderResult
 */

export const PROVIDER_STATUS = Object.freeze({
  ready: "ready",
  unavailable: "unavailable",
  error: "error",
});

export const createProviderProvenance = ({ providerId, modelId = "none", status }) => ({
  providerId,
  modelId,
  status,
  createdAt: new Date().toISOString(),
});

export const createUnavailableResult = ({ providerId, modelId = "none", warning = "provider unavailable", extra = {} }) => ({
  status: PROVIDER_STATUS.unavailable,
  providerId,
  modelId,
  confidence: 0,
  warnings: [warning],
  provenance: createProviderProvenance({ providerId, modelId, status: PROVIDER_STATUS.unavailable }),
  ...extra,
});

export const createErrorResult = (fallbackResult, warning = "provider error") => ({
  ...fallbackResult,
  status: PROVIDER_STATUS.error,
  confidence: 0,
  warnings: [warning],
  provenance: createProviderProvenance({
    providerId: fallbackResult.providerId,
    modelId: fallbackResult.modelId || "none",
    status: PROVIDER_STATUS.error,
  }),
});

export const safeCallProvider = async (providerCall, fallbackResult) => {
  try {
    return await providerCall();
  } catch {
    return createErrorResult(fallbackResult);
  }
};

export const providerModelLabel = (result) => {
  if (!result) return undefined;
  if (result.status === PROVIDER_STATUS.ready) return result.modelId || result.providerId;
  return result.status;
};
