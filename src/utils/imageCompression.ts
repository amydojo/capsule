export type ImageCompressionOptions = {
  maxDimension?: number;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  preserveTransparency?: boolean;
};

export type ImageCompressionResult = {
  dataUrl: string;
  originalBytes: number;
  storedBytes: number;
  compressionApplied: boolean;
  mimeType: string;
  width?: number;
  height?: number;
  reason?: string;
};

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

export const isDataUrl = (value: unknown): value is string =>
  typeof value === "string" && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);

export const estimateDataUrlBytes = (value: string) => {
  if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value)) {
    return typeof TextEncoder !== "undefined" ? new TextEncoder().encode(value).byteLength : value.length;
  }

  const commaIndex = value.indexOf(",");
  const base64 = commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const getDataUrlMimeType = (dataUrl: string) => {
  const match = dataUrl.match(/^data:([^;,]+)[;,]/);
  return match?.[1] || "image/jpeg";
};

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image load failed"));
    image.src = dataUrl;
  });

export const compressDataUrl = async (
  input: string,
  options: ImageCompressionOptions = {},
): Promise<ImageCompressionResult> => {
  const originalBytes = estimateDataUrlBytes(input);
  const fallbackMimeType = getDataUrlMimeType(input);

  if (!isDataUrl(input) || typeof document === "undefined") {
    return {
      dataUrl: input,
      originalBytes,
      storedBytes: originalBytes,
      compressionApplied: false,
      mimeType: fallbackMimeType,
      reason: "not a browser image data URL",
    };
  }

  try {
    const {
      maxDimension = DEFAULT_MAX_DIMENSION,
      quality = DEFAULT_QUALITY,
      preserveTransparency = false,
    } = options;
    const outputMimeType = preserveTransparency ? "image/png" : options.mimeType || "image/jpeg";
    const image = await loadImage(input);
    const scale = Math.min(1, maxDimension / image.width, maxDimension / image.height);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("canvas unavailable");
    }

    context.drawImage(image, 0, 0, width, height);
    const compressed = canvas.toDataURL(outputMimeType, preserveTransparency ? undefined : quality);
    const storedBytes = estimateDataUrlBytes(compressed);
    const shouldKeepOriginal = storedBytes >= originalBytes && scale === 1 && !preserveTransparency;

    if (shouldKeepOriginal) {
      return {
        dataUrl: input,
        originalBytes,
        storedBytes: originalBytes,
        compressionApplied: false,
        mimeType: fallbackMimeType,
        width: image.width,
        height: image.height,
        reason: "compressed image was not smaller",
      };
    }

    return {
      dataUrl: compressed,
      originalBytes,
      storedBytes,
      compressionApplied: compressed !== input,
      mimeType: outputMimeType,
      width,
      height,
    };
  } catch (error) {
    return {
      dataUrl: input,
      originalBytes,
      storedBytes: originalBytes,
      compressionApplied: false,
      mimeType: fallbackMimeType,
      reason: error instanceof Error ? error.message : "compression failed",
    };
  }
};
