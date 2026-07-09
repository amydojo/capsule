import { createUnavailableResult } from "./types.js";

const PROVIDER_ID = "segmentation-unavailable";
const MODEL_ID = "none";

export const createUnavailableSegmentationResult = (warning = "provider unavailable") =>
  createUnavailableResult({
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    warning,
  });

/**
 * Segmentation provider contract.
 * Future providers should implement segment(input) and return object isolation data.
 */
export const unavailableSegmentationProvider = {
  id: PROVIDER_ID,
  label: "Unavailable segmentation provider",
  status: "unavailable",
  segment: async (_input) => createUnavailableSegmentationResult(),
};
