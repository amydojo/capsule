import { createUnavailableResult } from "./types.js";

const PROVIDER_ID = "vision-unavailable";
const MODEL_ID = "none";

export const createUnavailableVisionResult = (warning = "provider unavailable") =>
  createUnavailableResult({
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    warning,
    extra: {
      observedFacts: {},
      confidenceByField: {},
    },
  });

/**
 * Vision provider contract.
 * Future providers should implement analyze(input) and return observed facts.
 */
export const unavailableVisionProvider = {
  id: PROVIDER_ID,
  label: "Unavailable vision provider",
  status: "unavailable",
  analyze: async (_input) => createUnavailableVisionResult(),
};
