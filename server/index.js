import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { generateFallbackArtifactPayload } from "./fallback/generateFallbackArtifact.js";
import { artifactSystemPrompt, buildArtifactUserPrompt } from "./prompts/artifactPrompt.js";
import { ArtifactSchema, CaptureInputSchema, GeneratedArtifactSchema } from "./schemas/artifactSchema.js";

dotenv.config({ path: new URL("./.env", import.meta.url).pathname });

const app = express();
const port = Number(process.env.PORT || 8787);
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.use(cors({ origin: true }));
app.use(express.json({ limit: "15mb" }));

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

const buildArtifact = (generated, input, ai) => {
  const now = new Date().toISOString();
  const artifact = {
    id: createFossilId(),
    ...generated,
    capturePoint: input.capturePoint,
    origin: input.origin?.trim() || "unspecified origin",
    preservationState: "active",
    currentStage: "preserved",
    imageDataUrl: input.imageDataUrl,
    thumbnailDataUrl: input.imageDataUrl,
    createdAt: now,
    updatedAt: now,
    observations: [],
    timeline: [
      {
        id: createEventId(),
        stage: "created",
        label: "Artifact generated",
        description: ai.usedFallback ? "Fallback generator produced a structured artifact record." : "Vision model produced a structured artifact record.",
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

  const result = ArtifactSchema.safeParse(artifact);
  if (!result.success) {
    const fallback = generateFallbackArtifactPayload(input);
    return ArtifactSchema.parse({ ...artifact, ...fallback, ai: { provider: "server", model: "fallback", usedFallback: true } });
  }
  return result.data;
};

const generateWithOpenAI = async (input) => {
  if (!process.env.OPENAI_API_KEY) return undefined;

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
          { type: "image_url", image_url: { url: input.imageDataUrl } },
        ],
      },
    ],
  });

  return parseJsonObject(completion.choices?.[0]?.message?.content);
};

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/artifacts/generate", async (request, response) => {
  const parsedInput = CaptureInputSchema.safeParse(request.body);
  if (!parsedInput.success) {
    response.status(400).json({ error: "Invalid capture input." });
    return;
  }

  const input = parsedInput.data;
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
      modelUsed = model;
    }
  } catch {
    generatedPayload = undefined;
  }

  if (!generatedPayload) {
    generatedPayload = generateFallbackArtifactPayload(input);
  }

  const artifact = buildArtifact(generatedPayload, input, {
    provider,
    model: modelUsed,
    usedFallback,
  });

  response.json({ artifact });
});

app.listen(port, () => {
  console.log(`Capsule preservation server listening on http://localhost:${port}`);
});
