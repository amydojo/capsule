import type { PreservationSessionStatus } from "../../types/capture";

export const CHAMBER_STATE_IDS = {
  sourceReceived: "SOURCE_RECEIVED",
  objectFieldSealed: "OBJECT_FIELD_SEALED",
  contextLockAttached: "CONTEXT_LOCK_ATTACHED",
  observedFactsForming: "OBSERVED_FACTS_FORMING",
  interpretiveLayerRestrained: "INTERPRETIVE_LAYER_RESTRAINED",
  recordReadyForReview: "RECORD_READY_FOR_REVIEW",
} as const;

export type ChamberStateId = (typeof CHAMBER_STATE_IDS)[keyof typeof CHAMBER_STATE_IDS];

export type ChamberSemanticStatus = "pending" | "active" | "complete" | "ready" | "failed";

export type ChamberState = {
  id: ChamberStateId;
  label: string;
  description: string;
  stageIndex: number;
  visualWeight: number;
  semanticStatus: ChamberSemanticStatus;
};

export type ChamberStateMachineInput = {
  generationStatus: PreservationSessionStatus;
  elapsedMs: number;
  hasContextLock: boolean;
  hasObjectField: boolean;
  hasSourceEvidence: boolean;
  isComplete: boolean;
  isFailed: boolean;
};

export type ChamberStateMachineResult = {
  activeStateId: ChamberStateId;
  statesWithStatus: ChamberState[];
  displayProgress: number;
  statusLine: string;
  isReady: boolean;
};

export const CHAMBER_STATES: ChamberState[] = [
  {
    id: CHAMBER_STATE_IDS.sourceReceived,
    label: "SOURCE RECEIVED",
    description: "Source evidence entered the chamber.",
    stageIndex: 0,
    visualWeight: 12,
    semanticStatus: "pending",
  },
  {
    id: CHAMBER_STATE_IDS.objectFieldSealed,
    label: "OBJECT FIELD SEALED",
    description: "The selected object field is sealed.",
    stageIndex: 1,
    visualWeight: 26,
    semanticStatus: "pending",
  },
  {
    id: CHAMBER_STATE_IDS.contextLockAttached,
    label: "CONTEXT LOCK ATTACHED",
    description: "User context is attached as provenance.",
    stageIndex: 2,
    visualWeight: 40,
    semanticStatus: "pending",
  },
  {
    id: CHAMBER_STATE_IDS.observedFactsForming,
    label: "OBSERVED FACTS FORMING",
    description: "Capsule is forming observed record fields.",
    stageIndex: 3,
    visualWeight: 58,
    semanticStatus: "pending",
  },
  {
    id: CHAMBER_STATE_IDS.interpretiveLayerRestrained,
    label: "INTERPRETIVE LAYER RESTRAINED",
    description: "Interpretation is held until review.",
    stageIndex: 4,
    visualWeight: 74,
    semanticStatus: "pending",
  },
  {
    id: CHAMBER_STATE_IDS.recordReadyForReview,
    label: "RECORD READY FOR REVIEW",
    description: "The record is ready for human review.",
    stageIndex: 5,
    visualWeight: 100,
    semanticStatus: "pending",
  },
];

const READY_INDEX = CHAMBER_STATES.length - 1;
const VISUAL_PROGRESS_CAP = 86;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getElapsedStageIndex = (elapsedMs: number) => {
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed >= 3400) return 4;
  if (elapsed >= 2200) return 3;
  if (elapsed >= 1300) return 2;
  if (elapsed >= 650) return 1;
  return 0;
};

const getLifecycleStageIndex = ({
  generationStatus,
  elapsedMs,
  hasContextLock,
  hasObjectField,
  hasSourceEvidence,
}: ChamberStateMachineInput) => {
  if (!hasSourceEvidence) return 0;
  if (generationStatus === "intake") return 0;

  let stageIndex = getElapsedStageIndex(elapsedMs);
  if (!hasObjectField) stageIndex = Math.min(stageIndex, 1);
  if (!hasContextLock) stageIndex = Math.min(stageIndex, 2);
  return clamp(stageIndex, 0, READY_INDEX - 1);
};

const getVisualProgress = (activeIndex: number, elapsedMs: number, isComplete: boolean) => {
  if (isComplete) return 100;

  const stateWeight = CHAMBER_STATES[activeIndex]?.visualWeight ?? 0;
  const dwell = clamp((Math.max(0, elapsedMs) / 1000) * 1.8, 0, 10);
  return Math.round(clamp(stateWeight + dwell, 0, VISUAL_PROGRESS_CAP));
};

/**
 * This is a presentation state model, not provider-reported granular progress.
 * Until real backend progress exists, displayProgress is derived from lifecycle
 * state and elapsed time, then capped below complete while preservation is
 * still pending.
 */
export const mapGenerationLifecycleToChamberState = (
  input: ChamberStateMachineInput,
): ChamberStateMachineResult => {
  const activeIndex = input.isComplete ? READY_INDEX : getLifecycleStageIndex(input);
  const activeState = CHAMBER_STATES[activeIndex] ?? CHAMBER_STATES[0];

  const statesWithStatus = CHAMBER_STATES.map((state) => {
    let semanticStatus: ChamberSemanticStatus = "pending";

    if (input.isComplete) {
      semanticStatus = state.stageIndex === READY_INDEX ? "ready" : "complete";
    } else if (input.isFailed) {
      if (state.stageIndex < activeIndex) semanticStatus = "complete";
      if (state.stageIndex === activeIndex) semanticStatus = "failed";
    } else if (input.hasSourceEvidence) {
      if (state.stageIndex < activeIndex) semanticStatus = "complete";
      if (state.stageIndex === activeIndex) semanticStatus = "active";
    }

    return {
      ...state,
      semanticStatus,
    };
  });

  const statusLine = input.isFailed
    ? "PRESERVATION INTERRUPTED"
    : input.isComplete
      ? "REVIEW READY"
      : input.hasSourceEvidence
        ? activeState.label
        : "SOURCE EVIDENCE REQUIRED";

  return {
    activeStateId: activeState.id,
    statesWithStatus,
    displayProgress: getVisualProgress(activeIndex, input.elapsedMs, input.isComplete),
    statusLine,
    isReady: input.isComplete,
  };
};
