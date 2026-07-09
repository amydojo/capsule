import { createUnavailableResult } from "./types.js";

const PROVIDER_ID = "embedding-unavailable";
const MODEL_ID = "none";

export const createUnavailableEmbeddingResult = (warning = "provider unavailable") =>
  createUnavailableResult({
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    warning,
    extra: {
      retrievalMetadata: {},
    },
  });

/**
 * Embedding provider contract.
 * Future providers should implement embedArtifact(input) and return retrieval metadata.
 */
export const unavailableEmbeddingProvider = {
  id: PROVIDER_ID,
  label: "Unavailable embedding provider",
  status: "unavailable",
  embedArtifact: async (_input) => createUnavailableEmbeddingResult(),
};
