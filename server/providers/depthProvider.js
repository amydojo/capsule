import { createUnavailableResult } from "./types.js";

const PROVIDER_ID = "depth-unavailable";
const MODEL_ID = "none";

export const createUnavailableDepthResult = (warning = "provider unavailable") =>
  createUnavailableResult({
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    warning,
  });

/**
 * Depth provider contract.
 * Future providers should implement estimateDepth(input) and return depth/parallax metadata.
 */
export const unavailableDepthProvider = {
  id: PROVIDER_ID,
  label: "Unavailable depth provider",
  status: "unavailable",
  estimateDepth: async (_input) => createUnavailableDepthResult(),
};
