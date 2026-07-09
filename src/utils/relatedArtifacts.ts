import type { Artifact, PressureTrace } from "../types/artifact";
import { normalizeArtifactRecord } from "./artifactRecord";

export type RelatedArtifactReasonType =
  | "same-collection"
  | "same-origin"
  | "same-class"
  | "same-material"
  | "similar-pressure"
  | "shared-visible-text"
  | "legacy-field";

export type RelatedArtifactSeed = {
  artifact: Artifact;
  reason: string;
  reasonType: RelatedArtifactReasonType;
  score: number;
};

type ScoredReason = {
  reason: string;
  reasonType: RelatedArtifactReasonType;
  score: number;
  priority: number;
};

const GENERIC_VALUES = new Set([
  "unknown",
  "unclear",
  "object",
  "artifact",
  "item",
  "misc",
  "miscellaneous",
  "visible object",
  "source image",
  "unknown material",
  "material not classified",
  "material not classified.",
  "companion object",
  "field capture",
  "continuity artifact",
  "ordinary object",
  "captured for preservation",
]);

const pressureTraceLabels: Array<keyof PressureTrace> = ["compression", "familiarity", "fragility", "residue", "charge", "preservationNeed"];

const normalizeValue = (value?: string) => value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";

const displayValue = (value?: string) => value?.trim().replace(/\s+/g, " ") ?? "";

export const isUsefulMatchValue = (value: string) => {
  const normalized = normalizeValue(value);
  return normalized.length > 1 && !GENERIC_VALUES.has(normalized);
};

const usefulValues = (values: Array<string | undefined>) => {
  const seen = new Set<string>();

  return values.reduce<Array<{ normalized: string; display: string }>>((collected, value) => {
    const normalized = normalizeValue(value);
    const display = displayValue(value);
    if (!display || !isUsefulMatchValue(display) || seen.has(normalized)) return collected;
    seen.add(normalized);
    collected.push({ normalized, display });
    return collected;
  }, []);
};

const firstSharedValue = (currentValues: Array<string | undefined>, candidateValues: Array<string | undefined>) => {
  const candidateMap = new Map(usefulValues(candidateValues).map((value) => [value.normalized, value.display]));
  return usefulValues(currentValues).find((value) => candidateMap.has(value.normalized))?.display;
};

const pressureSignals = (currentPressure: PressureTrace, candidatePressure: PressureTrace) =>
  pressureTraceLabels.filter((label) => Math.abs(currentPressure[label] - candidatePressure[label]) <= 0.15);

const formatPressureSignal = (value: keyof PressureTrace) => value.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

const newestFirstTieBreak = (left: Artifact, right: Artifact) => {
  const dateDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);
  if (dateDifference !== 0) return dateDifference;
  return left.id.localeCompare(right.id);
};

export const findRelatedArtifactSeed = (currentArtifact: Artifact, allArtifacts: Artifact[]): RelatedArtifactSeed | null => {
  const currentRecord = normalizeArtifactRecord(currentArtifact);
  const currentId = currentArtifact.id;
  const candidates = allArtifacts.filter((artifact) => artifact.id !== currentId && normalizeValue(artifact.id) !== normalizeValue(currentRecord.identity.capsuleId));

  const scored = candidates.flatMap((candidate) => {
    const candidateRecord = normalizeArtifactRecord(candidate);
    const reasons: ScoredReason[] = [];
    const sharedCollection = firstSharedValue([currentRecord.identity.collection, currentArtifact.collection], [candidateRecord.identity.collection, candidate.collection]);
    const sharedOrigin = firstSharedValue([currentRecord.source.origin, currentArtifact.origin], [candidateRecord.source.origin, candidate.origin]);
    const sharedClass = firstSharedValue([currentRecord.interpretiveLayer.artifactClass], [candidateRecord.interpretiveLayer.artifactClass]);
    const sharedMaterial = firstSharedValue(currentRecord.observedFacts.materialTags, candidateRecord.observedFacts.materialTags);
    const sharedVisibleText = firstSharedValue(currentRecord.observedFacts.visibleText, candidateRecord.observedFacts.visibleText);
    const sharedLegacy = firstSharedValue(
      [currentArtifact.classification, currentArtifact.category, ...currentArtifact.material],
      [candidate.classification, candidate.category, ...candidate.material],
    );
    const sharedPressureSignals = pressureSignals(currentRecord.interpretiveLayer.pressureTrace, candidateRecord.interpretiveLayer.pressureTrace);

    if (sharedCollection) {
      reasons.push({ reason: `same collection: ${sharedCollection}`, reasonType: "same-collection", score: 100, priority: 1 });
    }

    if (sharedOrigin) {
      reasons.push({ reason: `same origin: ${sharedOrigin}`, reasonType: "same-origin", score: 80, priority: 2 });
    }

    if (sharedClass) {
      reasons.push({ reason: `same class: ${sharedClass}`, reasonType: "same-class", score: 70, priority: 3 });
    }

    if (sharedMaterial) {
      reasons.push({ reason: `same material: ${sharedMaterial}`, reasonType: "same-material", score: 60, priority: 4 });
    }

    if (sharedVisibleText) {
      reasons.push({ reason: `shared visible text: ${sharedVisibleText}`, reasonType: "shared-visible-text", score: 45, priority: 5 });
    }

    if (sharedPressureSignals.length >= 2) {
      const signalLabel = sharedPressureSignals.slice(0, 2).map(formatPressureSignal).join(" + ");
      reasons.push({ reason: `similar pressure: ${signalLabel}`, reasonType: "similar-pressure", score: 35, priority: 6 });
    }

    if (sharedLegacy && !sharedClass && !sharedMaterial) {
      reasons.push({ reason: `shared legacy field: ${sharedLegacy}`, reasonType: "legacy-field", score: 25, priority: 7 });
    }

    if (!reasons.length) return [];

    const displayReason = [...reasons].sort((left, right) => left.priority - right.priority)[0];
    const totalScore = reasons.reduce((total, reason) => total + reason.score, 0);

    return [
      {
        artifact: candidate,
        reason: displayReason.reason,
        reasonType: displayReason.reasonType,
        score: totalScore,
      },
    ];
  });

  return (
    scored.sort((left, right) => {
      const scoreDifference = right.score - left.score;
      if (scoreDifference !== 0) return scoreDifference;
      return newestFirstTieBreak(left.artifact, right.artifact);
    })[0] ?? null
  );
};
