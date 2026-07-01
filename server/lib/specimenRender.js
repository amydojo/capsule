import OpenAI, { toFile } from "openai";

const DEFAULT_IMAGE_MODEL = "gpt-image-2";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 12_000_000;
const DEFAULT_TIMEOUT_MS = 24_000;

const RENDER_PROMPT = `Create a pristine isolated product-style render of this exact object for a future archaeology preservation record.

Preserve:
- object identity
- object shape
- proportions
- color
- markings
- printed text if visible
- wear
- material cues
- distinctive details

Improve:
- remove messy background
- clean visual clutter
- use controlled studio lighting
- neutral perspective
- subtle realistic contact shadow
- crisp object edges
- premium Apple hardware photography feel

Do not:
- add hands
- add props
- add new labels
- add new logos
- invent new text
- change the object type
- cartoonize
- stylize into illustration
- make it look like a toy unless it is a toy
- change visible markings unnecessarily

Output should be suitable as the hero specimen in a Capsule Artifact Record.`;

const isDisabled = (value) => ["0", "false", "off", "no"].includes(String(value || "").trim().toLowerCase());

const getRenderConfig = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const enabled = apiKey && !isDisabled(process.env.OPENAI_IMAGE_RENDER_ENABLED);
  return {
    apiKey,
    enabled,
    model: process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
    timeoutMs: Number(process.env.OPENAI_IMAGE_RENDER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  };
};

const dataUrlToImageFile = async (dataUrl) => {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    throw new Error("Specimen image must be a data URL.");
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error("Specimen image payload is too large.");
  }

  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,([\s\S]+)$/i);
  if (!match) throw new Error("Specimen image data URL is not supported.");

  const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) throw new Error("Specimen image is empty.");
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error("Specimen image exceeds the render size cap.");

  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return toFile(buffer, `specimen.${extension}`, { type: mimeType });
};

const withTimeout = async (promise, timeoutMs) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("OpenAI render timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const buildPrompt = (payload) => {
  const context = [
    payload.objectName ? `Known object name: ${String(payload.objectName).slice(0, 140)}` : "",
    payload.artifactId || payload.fossilId ? `Artifact ID: ${payload.artifactId || payload.fossilId}` : "",
    payload.objectBoundary ? "Use the supplied specimen crop as the primary reference. Source capture is provenance only." : "",
  ].filter(Boolean);

  return context.length ? `${RENDER_PROMPT}\n\nContext:\n${context.join("\n")}` : RENDER_PROMPT;
};

export const renderPristineSpecimenFromPayload = async (payload) => {
  const { apiKey, enabled, model, timeoutMs } = getRenderConfig();
  if (!apiKey) {
    return { status: "unavailable", reason: "OPENAI_API_KEY is not configured." };
  }
  if (!enabled) {
    return { status: "unavailable", reason: "OpenAI image rendering is disabled." };
  }
  if (!payload?.specimenImageDataUrl) {
    return { status: "failed", reason: "specimenImageDataUrl is required." };
  }

  try {
    const image = await dataUrlToImageFile(payload.specimenImageDataUrl);
    const client = new OpenAI({ apiKey, timeout: timeoutMs });
    const result = await withTimeout(
      client.images.edit(
        {
          model,
          image,
          prompt: buildPrompt(payload),
          n: 1,
          size: "1024x1024",
          quality: "medium",
          background: "auto",
          input_fidelity: "high",
          output_format: "webp",
          output_compression: 82,
        },
        { timeout: timeoutMs },
      ),
      timeoutMs + 1_000,
    );

    const base64Image = result?.data?.[0]?.b64_json;
    if (!base64Image) {
      return { status: "failed", reason: "OpenAI did not return image data.", provider: "openai" };
    }

    const outputFormat = result.output_format || "webp";
    return {
      pristineSpecimenDataUrl: `data:image/${outputFormat};base64,${base64Image}`,
      status: "success",
      provider: "openai",
    };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "OpenAI render failed.",
      provider: "openai",
    };
  }
};
