import { generateArtifactFromInput, parseCaptureInput } from "../../server/lib/artifactGeneration.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

const readJsonBody = async (request) => {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body === "string") return JSON.parse(request.body);

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch {
    response.status(400).json({ error: "Invalid JSON payload." });
    return;
  }

  const parsedInput = parseCaptureInput(payload);
  if (!parsedInput.success) {
    response.status(400).json({ error: "Invalid capture input." });
    return;
  }

  try {
    const artifact = await generateArtifactFromInput(parsedInput.data);
    response.status(200).json({ artifact });
  } catch {
    response.status(500).json({ error: "Preservation service could not generate an artifact." });
  }
}
