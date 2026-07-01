const titleCase = (value) =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");

const inferMaterials = (objectName) => {
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

const inferClassification = (input) => {
  const text = `${input.objectName} ${input.whyNow} ${input.futureMemory}`.toLowerCase();
  if (/cat|dog|pet|remy|animal|companion/.test(text)) return "domestic presence record";
  if (/first|launch|start|beginning|idea|build|origin/.test(text)) return "origin artifact";
  if (/receipt|order|label|proof/.test(text)) return "transaction artifact";
  if (/shoe|tool|used|wear|work/.test(text)) return "use artifact";
  return "continuity artifact";
};

const createEssence = (input) => {
  const source = input.futureMemory?.trim() || input.whyNow?.trim() || "an ordinary object held in continuity";
  const sentence = source.replace(/[.!?]+$/g, "").toLowerCase();
  return sentence.split(/\s+/).filter(Boolean).slice(0, 16).join(" ") || "an ordinary object held in continuity.";
};

export const generateFallbackArtifactPayload = (input) => {
  const objectName = input.objectName?.trim() || "ordinary object";
  const classification = inferClassification(input);
  const material = inferMaterials(objectName);
  const contextStrength = `${input.whyNow || ""} ${input.futureMemory || ""}`.trim().length;
  const continuityScore = Math.min(96, Math.max(72, contextStrength > 120 ? 94 : contextStrength > 58 ? 89 : 78));
  const title = objectName.toLowerCase().includes("notebook") && classification === "origin artifact" ? "Creative Origin Notebook" : titleCase(objectName);
  const hasSpecimen = Boolean(input.specimenImageDataUrl);
  const livingSubject = material[0] === "living subject";

  return {
    title,
    commonName: objectName.toLowerCase(),
    category: "object",
    classification,
    material,
    condition: livingSubject ? "present, alert, source-captured" : hasSpecimen ? "Object Field locked, specimen preserved" : "source-captured, Object Field pending",
    visibleDetails: hasSpecimen
      ? ["selected specimen region", "source capture retained as provenance", livingSubject ? "domestic presence retained cautiously" : "user context preserved with specimen"]
      : ["source capture retained as provenance", "Object Field pending", livingSubject ? "domestic presence retained cautiously" : "user context retained"],
    emotionalHypothesis: livingSubject ? "The subject appears connected to a domestic continuity moment." : "The artifact appears connected to the moment the user chose to preserve it.",
    essence: createEssence(input),
    continuityScore,
  };
};
