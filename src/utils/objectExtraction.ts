import type { NormalizedBoundary } from "../types/extraction";

type ExtractSpecimenOptions = {
  sourceImageDataUrl: string;
  boundary: NormalizedBoundary;
  outputMaxWidth?: number;
  outputMaxHeight?: number;
  quality?: number;
};

type ThumbnailOptions = {
  specimenImageDataUrl: string;
  maxWidth?: number;
  quality?: number;
};

type ObjectFieldBoundaryOptions = {
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  frameWidth: number;
  frameHeight: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

type DefaultBoundaryOptions = {
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  preferredAspectRatio?: number;
};

type ExtractionConfidenceOptions = {
  boundary: NormalizedBoundary;
  objectName?: string;
  imageWidth?: number;
  imageHeight?: number;
};

export const MIN_BOUNDARY_SIZE = 0.08;
const DEFAULT_SPECIMEN_MAX = 1400;
const DEFAULT_SPECIMEN_QUALITY = 0.88;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the source capture."));
    image.src = dataUrl;
  });

export const clampBoundary = (boundary: NormalizedBoundary): NormalizedBoundary => {
  const width = clamp(Number.isFinite(boundary.width) ? boundary.width : MIN_BOUNDARY_SIZE, MIN_BOUNDARY_SIZE, 1);
  const height = clamp(Number.isFinite(boundary.height) ? boundary.height : MIN_BOUNDARY_SIZE, MIN_BOUNDARY_SIZE, 1);

  return {
    x: clamp(Number.isFinite(boundary.x) ? boundary.x : 0, 0, 1 - width),
    y: clamp(Number.isFinite(boundary.y) ? boundary.y : 0, 0, 1 - height),
    width,
    height,
    unit: "normalized",
  };
};

export const validateBoundary = (boundary: NormalizedBoundary): { ok: true } | { ok: false; message: string } => {
  if (boundary.unit !== "normalized") return { ok: false, message: "Object field coordinates are invalid." };
  if (![boundary.x, boundary.y, boundary.width, boundary.height].every(Number.isFinite)) {
    return { ok: false, message: "Object field coordinates are invalid." };
  }
  if (boundary.width < MIN_BOUNDARY_SIZE || boundary.height < MIN_BOUNDARY_SIZE) {
    return { ok: false, message: "Lock a larger Object Field." };
  }
  if (boundary.x < 0 || boundary.y < 0 || boundary.x + boundary.width > 1 || boundary.y + boundary.height > 1) {
    return { ok: false, message: "Object field exceeded the source capture." };
  }
  return { ok: true };
};

const drawResizedImage = (image: HTMLImageElement, maxWidth: number, maxHeight: number, quality: number): string => {
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const outputWidth = Math.max(1, Math.round(image.width * scale));
  const outputHeight = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare specimen image.");
  context.drawImage(image, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL("image/jpeg", quality);
};

export const extractSpecimenFromImage = async ({
  sourceImageDataUrl,
  boundary,
  outputMaxWidth = DEFAULT_SPECIMEN_MAX,
  outputMaxHeight = DEFAULT_SPECIMEN_MAX,
  quality = DEFAULT_SPECIMEN_QUALITY,
}: ExtractSpecimenOptions): Promise<string> => {
  const image = await loadImage(sourceImageDataUrl);
  const clamped = clampBoundary(boundary);
  const validation = validateBoundary(clamped);
  if (!validation.ok) throw new Error(validation.message);

  const sourceX = Math.round(clamped.x * image.width);
  const sourceY = Math.round(clamped.y * image.height);
  const sourceWidth = Math.max(1, Math.min(image.width - sourceX, Math.round(clamped.width * image.width)));
  const sourceHeight = Math.max(1, Math.min(image.height - sourceY, Math.round(clamped.height * image.height)));

  if (sourceWidth < 80 || sourceHeight < 80) throw new Error("Lock a larger Object Field.");

  const scale = Math.min(1, outputMaxWidth / sourceWidth, outputMaxHeight / sourceHeight);
  const outputWidth = Math.max(1, Math.round(sourceWidth * scale));
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not lock the object field.");

  // Manual object field is the V1 reality extraction MVP.
  // TODO: replace boundary extraction with a segmentation mask.
  // TODO: add depth and multi-view capture metadata when native capture exists.
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL("image/jpeg", quality);
};

export const makeSpecimenThumbnail = async ({ specimenImageDataUrl, maxWidth = 480, quality = 0.76 }: ThumbnailOptions): Promise<string> => {
  const image = await loadImage(specimenImageDataUrl);
  return drawResizedImage(image, maxWidth, maxWidth, quality);
};

export const getDefaultObjectBoundary = ({
  imageNaturalWidth,
  imageNaturalHeight,
  preferredAspectRatio = 1,
}: DefaultBoundaryOptions): NormalizedBoundary => {
  const imageAspect = imageNaturalWidth / imageNaturalHeight;
  const desiredAspect = Math.max(0.25, Math.min(4, preferredAspectRatio));
  const base = 0.72;
  const width = imageAspect >= desiredAspect ? (base * desiredAspect) / imageAspect : base;
  const height = imageAspect >= desiredAspect ? base : (base * imageAspect) / desiredAspect;

  return clampBoundary({
    x: (1 - width) / 2,
    y: (1 - height) / 2,
    width,
    height,
    unit: "normalized",
  });
};

export const calculateBoundaryFromObjectField = ({
  imageNaturalWidth,
  imageNaturalHeight,
  frameWidth,
  frameHeight,
  zoom,
  offsetX,
  offsetY,
}: ObjectFieldBoundaryOptions): NormalizedBoundary => {
  const defaultBoundary = getDefaultObjectBoundary({
    imageNaturalWidth,
    imageNaturalHeight,
    preferredAspectRatio: frameWidth / frameHeight,
  });
  const normalizedZoom = clamp(zoom, 1, 3);
  const width = clamp(defaultBoundary.width / normalizedZoom, MIN_BOUNDARY_SIZE, 1);
  const height = clamp(defaultBoundary.height / normalizedZoom, MIN_BOUNDARY_SIZE, 1);
  const maxOffsetX = 0.5 - width / 2;
  const maxOffsetY = 0.5 - height / 2;
  const centerX = 0.5 + clamp(offsetX, -100, 100) / 100 * maxOffsetX;
  const centerY = 0.5 + clamp(offsetY, -100, 100) / 100 * maxOffsetY;

  return clampBoundary({
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    unit: "normalized",
  });
};

export const estimateExtractionConfidence = ({ boundary, objectName = "", imageWidth = 0, imageHeight = 0 }: ExtractionConfidenceOptions): number => {
  const clamped = clampBoundary(boundary);
  const area = clamped.width * clamped.height;
  const areaScore = 1 - Math.min(1, Math.abs(area - 0.34) / 0.34);
  const contextScore = objectName.trim().length > 2 ? 0.08 : 0;
  const resolutionScore = imageWidth >= 700 && imageHeight >= 700 ? 0.06 : 0;
  return Math.round(clamp(0.72 + areaScore * 0.1 + contextScore + resolutionScore, 0.58, 0.96) * 100) / 100;
};

export const estimateDataUrlSize = (dataUrl: string) => Math.round(Math.max(0, dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
