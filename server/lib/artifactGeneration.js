import OpenAI from "openai";
import { generateFallbackArtifactPayload } from "../fallback/generateFallbackArtifact.js";
import { artifactSystemPrompt, buildArtifactUserPrompt } from "../prompts/artifactPrompt.js";
import { collectProviderResults, mergeProviderResultsIntoRecord } from "../providers/index.js";
import { ArtifactSchema, CaptureInputSchema, GeneratedArtifactSchema } from "../schemas/artifactSchema.js";
import { normalizeArtifactRecord } from "./artifactRecord.js";

const createEventId = () => `evt-${crypto.randomUUID()}`;
const createFossilId = () => `CF-${Math.floor(10000 + Math.random() * 89999)}`;

const parseJsonObject = (content) => {
  if (!content) return undefined;
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return undefined;
    try {
      return JSON.parse(match[0]);
    } catch {
      return undefined;
    }
  }
};

const normalizeGeneratedPayload = (payload, input) => {
  const fallback = generateFallbackArtifactPayload(input);
  const merged = {
    ...fallback,
    ...(payload || {}),
    material: Array.isArray(payload?.material) ? payload.material : fallback.material,
    visibleDetails: Array.isArray(payload?.visibleDetails) ? payload.visibleDetails : fallback.visibleDetails,
    continuityScore: Number(payload?.continuityScore ?? fallback.continuityScore),
  };

  const result = GeneratedArtifactSchema.safeParse(merged);
  return result.success ? result.data : fallback;
};

const buildProviderInput = (input, artifactRecord) => ({
  imageDataUrl: input.imageDataUrl,
  specimenImageDataUrl: input.specimenImageDataUrl,
  objectBoundary: input.objectBoundary,
  artifactRecord,
  context: {
    objectName: input.objectName,
    whyNow: input.whyNow,
    origin: input.origin,
    collection: input.collection,
    capturePoint: input.capturePoint,
  },
  requestId: crypto.randomUUID(),
});

const buildArtifact = (generated, input, ai, providerResults) => {
  const now = new Date().toISOString();
  const specimenImage = input.specimenImageDataUrl || input.imageDataUrl;
  const extraction = input.objectBoundary
    ? {
        method: input.extraction?.method || "manual-object-field",
        confidence: input.extraction?.confidence ?? 0.84,
        warnings: input.extraction?.warnings || [],
      }
    : input.specimenImageDataUrl
      ? { method: "simulated-isolation", confidence: 0.62, warnings: [] }
      : { method: "fallback", confidence: 0.42, warnings: ["Object field was not supplied."] };

  const artifact = {
    id: createFossilId(),
    ...generated,
    capturePoint: input.capturePoint,
    origin: input.origin?.trim() || "field capture",
    objectName: input.objectName?.trim() || undefined,
    whyNow: input.whyNow?.trim() || undefined,
    collection: input.collection?.trim() || undefined,
    contextNote: input.whyNow?.trim() || undefined,
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
        id: createEventId(),
        stage: "created",
        label: "Artifact record created",
        description: "Artifact record created.",
        date: now,
      },
      {
        id: createEventId(),
        stage: "preserved",
        label: "Object Preserved",
        description: "Preservation Chamber completed continuity mapping.",
        date: now,
      },
    ],
    ai,
  };

  const artifactWithRecord = {
    ...artifact,
    record: mergeProviderResultsIntoRecord(normalizeArtifactRecord(artifact), providerResults),
  };

  const result = ArtifactSchema.safeParse(artifactWithRecord);
  if (!result.success) {
    const fallback = generateFallbackArtifactPayload(input);
    const fallbackArtifact = { ...artifact, ...fallback, ai: { provider: "server", model: "fallback", usedFallback: true } };
    return ArtifactSchema.parse({ ...fallbackArtifact, record: mergeProviderResultsIntoRecord(normalizeArtifactRecord(fallbackArtifact), providerResults) });
  }
  return result.data;
};

const generateWithOpenAI = async (input) => {
  if (!process.env.OPENAI_API_KEY) return undefined;

  const specimenImage = input.specimenImageDataUrl || input.imageDataUrl;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: artifactSystemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: buildArtifactUserPrompt(input) },
          { type: "image_url", image_url: { url: specimenImage } },
        ],
      },
    ],
  });

  return parseJsonObject(completion.choices?.[0]?.message?.content);
};

export const parseCaptureInput = (payload) => CaptureInputSchema.safeParse(payload);

export const generateArtifactFromInput = async (input) => {
  let usedFallback = true;
  let provider = "server";
  let modelUsed = "fallback";
  let generatedPayload;

  try {
    const aiPayload = await generateWithOpenAI(input);
    if (aiPayload) {
      generatedPayload = normalizeGeneratedPayload(aiPayload, input);
      usedFallback = false;
      provider = "openai";
      modelUsed = process.env.OPENAI_MODEL || "gpt-4o-mini";
    }
  } catch {
    generatedPayload = undefined;
  }

  if (!generatedPayload) {
    generatedPayload = generateFallbackArtifactPayload(input);
  }

  const providerResults = await collectProviderResults(buildProviderInput(input));

  return buildArtifact(generatedPayload, input, {
    provider,
    model: modelUsed,
    usedFallback,
  }, providerResults);
};
