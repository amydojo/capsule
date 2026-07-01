import { renderPristineSpecimenFromPayload } from "../../server/lib/specimenRender.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
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
    response.status(400).json({ status: "failed", reason: "Invalid JSON payload." });
    return;
  }

  const result = await renderPristineSpecimenFromPayload(payload);
  const statusCode = result.status === "failed" && result.reason === "specimenImageDataUrl is required." ? 400 : 200;
  response.status(statusCode).json(result);
}
