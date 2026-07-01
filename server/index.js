import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { generateArtifactFromInput, parseCaptureInput } from "./lib/artifactGeneration.js";

dotenv.config({ path: new URL("./.env", import.meta.url).pathname });

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors({ origin: true }));
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/artifacts/generate", async (request, response) => {
  const parsedInput = parseCaptureInput(request.body);
  if (!parsedInput.success) {
    response.status(400).json({ error: "Invalid capture input." });
    return;
  }

  try {
    const artifact = await generateArtifactFromInput(parsedInput.data);
    response.json({ artifact });
  } catch {
    response.status(500).json({ error: "Preservation service could not generate an artifact." });
  }
});

app.listen(port, () => {
  console.log(`Capsule preservation server listening on http://localhost:${port}`);
});
