import type { ArtifactRenderMetadata, ObjectBoundary } from "../types/artifact";
import { createMotionSeed, getPressureTraceParams } from "./motionSeed";

type LocalSpecimenRenderInput = {
  artifactId?: string;
  fossilId?: string;
  specimenImageDataUrl?: string;
  pristineSpecimenDataUrl?: string;
  isolatedSpecimenDataUrl?: string;
  sourceImageDataUrl?: string;
  objectBoundary?: ObjectBoundary;
  theme?: "light" | "dark";
};

type LocalSpecimenRenderResult = {
  artifactRenderDataUrl?: string;
  render: ArtifactRenderMetadata & {
    method: "local-preserved-render" | "specimen-crop" | "fallback-render";
    provider?: "local";
  };
};

const VERSION = "specimen-render-v1";
const CANVAS_WIDTH = 1120;
const CANVAS_HEIGHT = 880;

const loadCanvasImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Specimen render image could not be loaded."));
    image.src = dataUrl;
  });

const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
};

const exportCanvas = (canvas: HTMLCanvasElement) => {
  const webp = canvas.toDataURL("image/webp", 0.78);
  if (webp.startsWith("data:image/webp")) return webp;
  const jpeg = canvas.toDataURL("image/jpeg", 0.78);
  if (jpeg.startsWith("data:image/jpeg")) return jpeg;
  return canvas.toDataURL("image/png");
};

const drawPreservationField = (context: CanvasRenderingContext2D, seed: string, theme: "light" | "dark") => {
  const params = getPressureTraceParams(seed);
  const dark = theme === "dark";
  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;
  const centerX = width / 2 + params.drift * 0.32;
  const centerY = height * 0.48;

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, dark ? "#17181d" : "#fbfaf6");
  background.addColorStop(0.52, dark ? "#101116" : "#f0eee7");
  background.addColorStop(1, dark ? "#0a0b0d" : "#e5e1d7");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(centerX, centerY, 40, centerX, centerY, width * 0.5);
  glow.addColorStop(0, dark ? `rgba(101,112,255,${params.glowIntensity})` : `rgba(101,112,255,${params.glowIntensity * 0.42})`);
  glow.addColorStop(0.52, dark ? "rgba(154,149,86,0.1)" : "rgba(255,255,255,0.78)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.translate(centerX, centerY + 18);
  context.rotate(params.drift * 0.0018);
  for (let index = 0; index < params.contourDensity; index += 1) {
    const radius = (180 + index * params.lineSpacing * 1.55) * params.ringRadius;
    context.beginPath();
    context.ellipse(0, 0, radius * 1.35, radius * 0.64, 0, 0, Math.PI * 2);
    context.strokeStyle = dark
      ? `rgba(242,239,234,${Math.max(0.04, params.opacity - index * 0.032)})`
      : `rgba(47,52,146,${Math.max(0.035, params.opacity * 0.38 - index * 0.018)})`;
    context.lineWidth = index === 0 ? 1.4 : 1;
    context.stroke();
  }
  context.restore();

  context.fillStyle = dark ? "rgba(242,239,234,0.08)" : "rgba(255,255,255,0.56)";
  context.beginPath();
  context.ellipse(width / 2, height * 0.23, width * 0.34, 34, 0, 0, Math.PI * 2);
  context.fill();
};

const drawSpecimen = (context: CanvasRenderingContext2D, image: HTMLImageElement, seed: string) => {
  const params = getPressureTraceParams(seed);
  const maxWidth = CANVAS_WIDTH * 0.66;
  const maxHeight = CANVAS_HEIGHT * 0.58;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1.35);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const x = Math.round((CANVAS_WIDTH - width) / 2);
  const y = Math.round(CANVAS_HEIGHT * 0.45 - height / 2);
  const radius = Math.max(26, Math.min(46, Math.min(width, height) * 0.08));

  context.save();
  context.fillStyle = "rgba(23,25,28,0.18)";
  context.filter = "blur(24px)";
  context.beginPath();
  context.ellipse(CANVAS_WIDTH / 2 + params.drift * 0.18, y + height + params.shadowOffset, width * 0.36, Math.max(24, height * 0.08), 0, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.save();
  context.globalAlpha = 0.38;
  context.filter = "blur(22px) saturate(1.05)";
  roundedRect(context, x + 8, y + 12, width - 16, height - 24, radius);
  context.clip();
  context.drawImage(image, x, y, width, height);
  context.restore();

  context.save();
  context.shadowColor = "rgba(23,25,28,0.28)";
  context.shadowBlur = 34;
  context.shadowOffsetY = 18;
  roundedRect(context, x, y, width, height, radius);
  context.clip();
  context.drawImage(image, x, y, width, height);

  const highlight = context.createLinearGradient(x, y, x + width, y + height);
  highlight.addColorStop(0, "rgba(255,255,255,0.28)");
  highlight.addColorStop(0.42, "rgba(255,255,255,0)");
  highlight.addColorStop(1, "rgba(255,255,255,0.12)");
  context.fillStyle = highlight;
  context.fillRect(x, y, width, height);
  context.restore();

  context.save();
  context.strokeStyle = "rgba(255,255,255,0.46)";
  context.lineWidth = 1;
  roundedRect(context, x + 0.5, y + 0.5, width - 1, height - 1, radius);
  context.stroke();
  context.restore();
};

const createRenderMetadata = (
  input: LocalSpecimenRenderInput,
  method: "local-preserved-render" | "specimen-crop" | "fallback-render",
  localRenderStatus: "success" | "failed",
): LocalSpecimenRenderResult["render"] => ({
  version: VERSION,
  method,
  isolationStatus: input.isolatedSpecimenDataUrl ? "success" : "not_attempted",
  pristineStatus: input.pristineSpecimenDataUrl ? "success" : "not_attempted",
  localRenderStatus,
  motionSeed: createMotionSeed({
    artifactId: input.artifactId || input.fossilId,
    boundary: input.objectBoundary,
    source: input.sourceImageDataUrl?.slice(0, 128),
    specimen: input.specimenImageDataUrl?.slice(0, 128),
  }),
  createdAt: new Date().toISOString(),
  provider: "local",
});

export const createLocalPreservedSpecimenRender = async (input: LocalSpecimenRenderInput): Promise<LocalSpecimenRenderResult> => {
  const baseImage = input.pristineSpecimenDataUrl || input.isolatedSpecimenDataUrl || input.specimenImageDataUrl;
  if (!baseImage) {
    return {
      render: createRenderMetadata(input, "fallback-render", "failed"),
    };
  }

  const render = createRenderMetadata(input, "local-preserved-render", "success");

  try {
    const image = await loadCanvasImage(baseImage);
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Local render canvas is unavailable.");

    drawPreservationField(context, render.motionSeed, input.theme || "light");
    drawSpecimen(context, image, render.motionSeed);

    return {
      artifactRenderDataUrl: exportCanvas(canvas),
      render,
    };
  } catch {
    return {
      render: {
        ...render,
        method: input.specimenImageDataUrl ? "specimen-crop" : "fallback-render",
        localRenderStatus: "failed",
      },
    };
  }
};
