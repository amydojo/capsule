const pressureTraceKeys = ["compression", "familiarity", "fragility", "residue", "charge", "preservationNeed"];

const trimOptional = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || undefined;
};

const firstString = (...values) => values.map(trimOptional).find(Boolean);

const cleanArray = (values) => (Array.isArray(values) ? values.map(trimOptional).filter(Boolean) : []);

const clamp01 = (value, fallback) => {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(1, Math.max(0, numericValue));
};

const rounded = (value) => Math.round(value * 100) / 100;

const includesWearLanguage = (value) => /wear|worn|mark|scratch|crease|stain|residue|edge|softened|lift|compressed|patina|surface/i.test(value);

const createFallbackPressureTrace = (artifact) => {
  const visibleDetails = cleanArray(artifact.visibleDetails);
  const hasUserContext = Boolean(artifact.objectName || artifact.contextNote || artifact.whyNow || artifact.collection);
  const hasWear = visibleDetails.some(includesWearLanguage) || /wear|worn|used|soft|aged|compressed/i.test(artifact.condition || "");

  return {
    compression: artifact.storage?.compressionApplied ? 0.56 : 0.48,
    familiarity: hasUserContext ? 0.55 : 0.44,
    fragility: hasWear ? 0.56 : 0.48,
    residue: hasWear ? 0.54 : 0.44,
    charge: rounded(0.4 + clamp01((artifact.continuityScore || 50) / 100, 0.5) * 0.2),
    preservationNeed: artifact.specimenImageDataUrl || artifact.artifactRenderDataUrl ? 0.58 : 0.5,
  };
};

const completePressureTrace = (pressureTrace, artifact) => {
  const fallback = createFallbackPressureTrace(artifact);
  return pressureTraceKeys.reduce(
    (completed, key) => ({
      ...completed,
      [key]: clamp01(pressureTrace?.[key], fallback[key]),
    }),
    {},
  );
};

const createConfidenceByField = (artifact, existing) => {
  const defaults = {
    "observedFacts.objectLabel": clamp01(artifact.extraction?.confidence, 0.62),
    "observedFacts.colors": 0.4,
    "observedFacts.materialTags": 0.56,
    "interpretiveLayer.continuityNote": artifact.ai?.usedFallback ? 0.5 : 0.58,
    "interpretiveLayer.memoryHypothesis": artifact.ai?.usedFallback ? 0.46 : 0.52,
  };

  return Object.entries({ ...defaults, ...(existing || {}) }).reduce((confidence, [key, value]) => {
    confidence[key] = clamp01(value, defaults[key] ?? 0.5);
    return confidence;
  }, {});
};

export const normalizeArtifactRecord = (artifact) => {
  const existing = artifact.record;
  const visibleDetails = cleanArray(artifact.visibleDetails);
  const existingShape = cleanArray(existing?.observedFacts?.shapeAndSilhouette);
  const existingMarks = cleanArray(existing?.observedFacts?.marksAndWear);
  const shapeAndSilhouette = existingShape.length ? existingShape : visibleDetails;
  const marksAndWear = existingMarks.length ? existingMarks : visibleDetails.filter(includesWearLanguage);
  const userNote = firstString(existing?.source?.userNote, artifact.contextNote, artifact.whyNow);
  const origin = firstString(existing?.source?.origin, artifact.origin);
  const userGivenName = firstString(existing?.identity?.userGivenName, artifact.objectName);
  const systemArtifactName = firstString(existing?.identity?.systemArtifactName, artifact.title, artifact.commonName, "Untitled artifact") ?? "Untitled artifact";
  const objectLabel = firstString(existing?.observedFacts?.objectLabel, artifact.commonName, artifact.objectName, artifact.classification, "visible object") ?? "visible object";
  const existingMaterials = cleanArray(existing?.observedFacts?.materialTags);
  const materialTags = existingMaterials.length ? existingMaterials : cleanArray(artifact.material);
  const continuityNote = firstString(existing?.interpretiveLayer?.continuityNote, artifact.essence, "Record preserved without added interpretation.") ?? "Record preserved without added interpretation.";

  return {
    identity: {
      capsuleId: firstString(existing?.identity?.capsuleId, artifact.id) ?? artifact.id,
      createdAt: firstString(existing?.identity?.createdAt, artifact.createdAt) ?? artifact.createdAt,
      userGivenName,
      systemArtifactName,
      collection: firstString(existing?.identity?.collection, artifact.collection),
    },
    source: {
      originalImageDataUrl: firstString(existing?.source?.originalImageDataUrl, artifact.sourceImageDataUrl, artifact.imageDataUrl),
      specimenImageDataUrl: firstString(existing?.source?.specimenImageDataUrl, artifact.specimenImageDataUrl, artifact.imageDataUrl),
      isolatedSpecimenDataUrl: firstString(existing?.source?.isolatedSpecimenDataUrl, artifact.isolatedSpecimenDataUrl),
      artifactRenderDataUrl: firstString(existing?.source?.artifactRenderDataUrl, artifact.artifactRenderDataUrl, artifact.pristineSpecimenDataUrl),
      objectBoundary: existing?.source?.objectBoundary || artifact.objectBoundary,
      userNote,
      origin,
    },
    observedFacts: {
      objectLabel,
      visibleText: cleanArray(existing?.observedFacts?.visibleText),
      colors: cleanArray(existing?.observedFacts?.colors),
      shapeAndSilhouette,
      marksAndWear,
      materialTags,
      sceneContext: firstString(existing?.observedFacts?.sceneContext),
    },
    interpretiveLayer: {
      artifactClass: firstString(existing?.interpretiveLayer?.artifactClass, artifact.classification, artifact.category, "continuity artifact") ?? "continuity artifact",
      pressureTrace: completePressureTrace(existing?.interpretiveLayer?.pressureTrace, artifact),
      continuityNote,
      memoryHypothesis: firstString(existing?.interpretiveLayer?.memoryHypothesis, artifact.emotionalHypothesis),
      toneTags: cleanArray(existing?.interpretiveLayer?.toneTags),
      doNotOverclaim: existing?.interpretiveLayer?.doNotOverclaim ?? true,
    },
    modelProvenance: {
      visionModel: firstString(existing?.modelProvenance?.visionModel, artifact.ai?.model),
      detectorModel: firstString(existing?.modelProvenance?.detectorModel),
      segmentationModel: firstString(existing?.modelProvenance?.segmentationModel),
      depthModel: firstString(existing?.modelProvenance?.depthModel),
      embeddingModel: firstString(existing?.modelProvenance?.embeddingModel),
      confidenceByField: createConfidenceByField(artifact, existing?.modelProvenance?.confidenceByField),
    },
  };
};
