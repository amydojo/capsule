import { ArtifactSchema } from "../schemas/artifactSchema";
import type { Artifact, ArtifactTimelineEvent } from "../types/artifact";

const STORAGE_KEY = "capsule_artifacts_v1";

const canUseStorage = () => typeof window !== "undefined" && "localStorage" in window;

const createId = (prefix = "evt") => {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${randomId}`;
};

const readRawArtifacts = (): Artifact[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      const result = ArtifactSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
};

const writeArtifacts = (artifacts: Artifact[]) => {
  if (!canUseStorage()) return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(artifacts));
    return true;
  } catch {
    return false;
  }
};

const appendEvent = (artifact: Artifact, event: Omit<ArtifactTimelineEvent, "id" | "date">): Artifact => ({
  ...artifact,
  updatedAt: new Date().toISOString(),
  timeline: [
    ...artifact.timeline,
    {
      id: createId("evt"),
      date: new Date().toISOString(),
      ...event,
    },
  ],
});

export const getArtifacts = (): Artifact[] => readRawArtifacts().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

export const getArtifactById = (id: string): Artifact | undefined => getArtifacts().find((artifact) => artifact.id === id);

export const saveArtifact = (artifact: Artifact): Artifact[] => {
  const result = ArtifactSchema.safeParse(artifact);
  if (!result.success) return getArtifacts();

  const existing = getArtifacts().filter((item) => item.id !== artifact.id);
  const artifacts = [result.data, ...existing];
  const saved = writeArtifacts(artifacts);
  if (!saved) throw new Error("Capsule could not save this artifact locally. Try a smaller capture.");
  return artifacts;
};

export const updateArtifact = (id: string, patch: Partial<Artifact>): Artifact | undefined => {
  const artifacts = getArtifacts();
  const artifact = artifacts.find((item) => item.id === id);
  if (!artifact) return undefined;

  const updated: Artifact = {
    ...artifact,
    ...patch,
    id: artifact.id,
    updatedAt: new Date().toISOString(),
  };

  const result = ArtifactSchema.safeParse(updated);
  if (!result.success) return undefined;

  writeArtifacts([result.data, ...artifacts.filter((item) => item.id !== id)]);
  return result.data;
};

export const deleteArtifact = (id: string): void => {
  writeArtifacts(getArtifacts().filter((artifact) => artifact.id !== id));
};

export const addObservation = (id: string, text: string): Artifact | undefined => {
  const artifact = getArtifactById(id);
  const trimmed = text.trim();
  if (!artifact || !trimmed) return artifact;

  const observed = appendEvent(
    {
      ...artifact,
      observations: [
        ...artifact.observations,
        {
          id: createId("obs"),
          text: trimmed,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      stage: "updated",
      label: "Observation added",
      description: trimmed,
    },
  );

  return updateArtifact(id, observed);
};

export const sealArtifact = (id: string): Artifact | undefined => {
  const artifact = getArtifactById(id);
  if (!artifact) return undefined;
  if (artifact.preservationState === "sealed") return artifact;

  const sealed = appendEvent(
    {
      ...artifact,
      preservationState: "sealed",
      currentStage: "sealed",
    },
    {
      stage: "sealed",
      label: "Seal Fossil",
      description: "Artifact sealed into preserved state.",
    },
  );

  return updateArtifact(id, sealed);
};

export const markRediscovered = (id: string): Artifact | undefined => {
  const artifact = getArtifactById(id);
  if (!artifact) return undefined;

  const rediscovered = appendEvent(
    {
      ...artifact,
      preservationState: "rediscovered",
    },
    {
      stage: "rediscovered",
      label: "Rediscovered",
      description: "Artifact resurfaced for review.",
    },
  );

  return updateArtifact(id, rediscovered);
};

export { STORAGE_KEY };
