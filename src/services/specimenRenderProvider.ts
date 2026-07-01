import type { ObjectBoundary } from "../types/artifact";
import { resizeImageDataUrl } from "../utils/image";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 28_000;

export type SpecimenRenderProviderRequest = {
  specimenImageDataUrl: string;
  sourceImageDataUrl?: string;
  objectName?: string;
  artifactId?: string;
  fossilId?: string;
  objectBoundary?: ObjectBoundary;
};

export type SpecimenRenderProviderResponse = {
  pristineSpecimenDataUrl?: string;
  status: "success" | "failed" | "unavailable";
  reason?: string;
  provider?: "openai";
};

const normalizeProviderImage = async (dataUrl: string) =>
  resizeImageDataUrl(dataUrl, { maxWidth: 1200, maxHeight: 1200, quality: 0.84 }).catch(() => dataUrl);

export const renderPristineSpecimen = async (
  request: SpecimenRenderProviderRequest,
): Promise<SpecimenRenderProviderResponse> => {
  if (!request.specimenImageDataUrl) {
    return { status: "failed", reason: "specimenImageDataUrl is required." };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/specimens/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { status: "failed", reason: "Pristine render service returned an error.", provider: "openai" };
    }

    const result = (await response.json()) as SpecimenRenderProviderResponse;
    if (result.status === "success" && result.pristineSpecimenDataUrl) {
      return {
        ...result,
        pristineSpecimenDataUrl: await normalizeProviderImage(result.pristineSpecimenDataUrl),
        provider: "openai",
      };
    }

    return {
      status: result.status === "unavailable" ? "unavailable" : "failed",
      reason: result.reason,
      provider: result.provider,
    };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof DOMException && error.name === "AbortError" ? "Pristine render request timed out." : "Pristine render request failed.",
      provider: "openai",
    };
  } finally {
    window.clearTimeout(timeout);
  }
};
