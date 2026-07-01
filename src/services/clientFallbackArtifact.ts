import type { GeneratedArtifactPayload } from "../schemas/artifactSchema";
import type { Artifact } from "../types/artifact";
import type { CaptureInput } from "../types/capture";

const createId = (prefix = "evt") => {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${randomId}`;
};

const createFossilId = () => `CF-${Math.floor(10000 + Math.random() * 89999)}`;

const titleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");

const inferMaterials = (objectName: string) => {
  const name = objectName.toLowerCase();
  if (/cat|dog|pet|remy|animal/.test(name)) return ["living subject"];
  if (name.includes("notebook")) return ["paper", "ink", "elastic"];
  if (name.includes("receipt") || name.includes("order") || name.includes("label")) return ["paper", "adhesive", "ink"];
  if (name.includes("shoe")) return ["rubber", "fabric", "lace"];
  if (name.includes("toy")) return ["plastic", "paint"];
  if (name.includes("key")) return ["metal", "plastic"];
  if (name.includes("mug")) return ["ceramic"];
  if (name.includes("shirt") || name.includes("clothing") || name.includes("jacket")) return ["fabric", "thread"];
  return ["object material unresolved"];
};

const inferClassification = (input: CaptureInput) => {
  const text = `${input.objectName} ${input.whyNow} ${input.futureMemory}`.toLowerCase();
  if (/cat|dog|pet|remy|animal|companion/.test(text)) return "domestic presence record";
  if (/first|launch|start|beginning|idea|build|origin/.test(text)) return "origin artifact";
  if (/order|receipt|label|proof/.test(text)) return "transaction artifact";
  if (/shoe|tool|used|wear|work/.test(text)) return "use artifact";
  return "continuity artifact";
};

const createEssence = (input: CaptureInput) => {
  const source = input.futureMemory.trim() || input.whyNow.trim();
  const cleaned = source.replace(/[.!?]+$/g, "").toLowerCase();
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 16).join(" ");
  return words || "an ordinary object held in continuity.";
};

const createGeneratedPayload = (input: CaptureInput): GeneratedArtifactPayload => {
  const objectName = input.objectName.trim() || "ordinary object";
  const specificity = `${input.whyNow} ${input.futureMemory}`.trim().length;
  const materials = inferMaterials(objectName);
  const classification = inferClassification(input);
  const score = Math.min(96, Math.max(72, specificity > 110 ? 93 : specificity > 56 ? 88 : 78));
  const title = objectName.toLowerCase().includes("notebook") && classification === "origin artifact" ? "Creative Origin Notebook" : titleCase(objectName);
  const hasSpecimen = Boolean(input.specimenImageDataUrl);
  const livingSubject = materials[0] === "living subject";

  return {
    title,
    commonName: objectName.toLowerCase(),
    category: "object",
    classification,
    material: materials,
    condition: livingSubject ? "present, alert, source-captured" : hasSpecimen ? "Object Field locked, specimen preserved" : "source-captured, Object Field pending",
    visibleDetails: hasSpecimen
      ? ["selected specimen region", "source capture retained as provenance", livingSubject ? "domestic presence retained cautiously" : "user context preserved with specimen"]
      : ["source capture retained as provenance", "Object Field pending", livingSubject ? "domestic presence retained cautiously" : "user context retained"],
    emotionalHypothesis: livingSubject ? "The subject appears connected to a domestic continuity moment." : "The artifact appears connected to the moment the user chose to preserve it.",
    essence: createEssence(input),
    continuityScore: score,
  };
};

export const generateClientFallbackArtifact = (input: CaptureInput): Artifact => {
  const generated = createGeneratedPayload(input);
  const now = new Date().toISOString();
  const specimenImage = input.specimenImageDataUrl || input.imageDataUrl;
  const extraction = input.objectBoundary
    ? {
        method: input.extraction?.method || ("manual-object-field" as const),
        confidence: input.extraction?.confidence ?? 0.82,
        warnings: input.extraction?.warnings || [],
      }
    : input.specimenImageDataUrl
      ? { method: "simulated-isolation" as const, confidence: 0.62, warnings: [] }
      : { method: "fallback" as const, confidence: 0.42, warnings: ["Object boundary was not provided."] };

  return {
    id: createFossilId(),
    ...generated,
    capturePoint: input.capturePoint,
    origin: input.origin?.trim() || "unspecified origin",
    preservationState: "active",
    currentStage: "preserved",
    imageDataUrl: specimenImage,
    sourceImageDataUrl: input.sourceImageDataUrl,
    specimenImageDataUrl: input.specimenImageDataUrl || specimenImage,
    thumbnailDataUrl: input.thumbnailDataUrl || specimenImage,
    objectBoundary: input.objectBoundary,
    extraction,
    createdAt: now,
    updatedAt: now,
    observations: [],
    timeline: [
      {
        id: createId("evt"),
        stage: "created",
        label: "Artifact generated",
        description: "Local fallback generated a structured artifact record.",
        date: now,
      },
      {
        id: createId("evt"),
        stage: "preserved",
        label: "Object Preserved",
        description: "Preservation Chamber completed local continuity mapping.",
        date: now,
      },
    ],
    ai: {
      provider: "client",
      model: "local-fallback",
      usedFallback: true,
    },
  };
};
