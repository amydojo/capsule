import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChamberInstrument, { type ChamberDiagnosticRow } from "../components/chamber/ChamberInstrument";
import { mapGenerationLifecycleToChamberState } from "../components/chamber/chamberStateMachine";
import CapsuleBottomDock from "../components/system/CapsuleBottomDock";
import CapsulePhoneFrame from "../components/system/CapsulePhoneFrame";
import { ROUTES } from "../constants/navigation";
import { usePreservationSession } from "../context/PreservationSessionContext";
import { generateArtifact } from "../services/artifactApi";
import { processSpecimenImages } from "../services/specimenProcessing";
import type { PreservationStage } from "../types/artifact";
import type { CaptureInput } from "../types/capture";
import { getArtifactHeroImage } from "../utils/artifactImage";

const preservationStages: PreservationStage[] = ["captured", "isolated", "analyzed", "traced", "preserved"];
const COMPLETION_HANDOFF_MS = 560;
const VISUAL_TICK_MS = 420;

export default function PreservationChamber() {
  const navigate = useNavigate();
  const {
    session,
    beginPreservation,
    setStageProgress,
    completePreservation,
    failPreservation,
    resetSession,
  } = usePreservationSession();
  const [elapsedMs, setElapsedMs] = useState(0);
  const runRef = useRef<string | null>(null);
  const completedRunRef = useRef<string | null>(null);
  const retryAttemptRef = useRef(1);
  const autoTimerRef = useRef<number | undefined>(undefined);
  const artifactTimerRef = useRef<number | undefined>(undefined);
  const visualTimerRef = useRef<number | undefined>(undefined);
  const visualStartedAtRef = useRef<number | undefined>(undefined);
  const visualSessionIdRef = useRef<string | undefined>(undefined);
  const stageTimersRef = useRef<number[]>([]);
  const mountedRef = useRef(false);
  const reviewNavigationKeyRef = useRef<string | null>(null);

  const activeInput = session.input;
  const artifactId = session.artifact?.id;
  const chamberImage = session.artifact ? getArtifactHeroImage(session.artifact) : activeInput?.specimenImageDataUrl || activeInput?.imageDataUrl || "";
  const objectLabel = session.artifact?.commonName || activeInput?.objectName || "preserved object";
  const extraction = session.artifact?.extraction || activeInput?.extraction;
  const hasManualExtraction = extraction?.method === "manual-object-field" || Boolean(session.artifact?.objectBoundary || activeInput?.objectBoundary);
  const hasSourceRetained = Boolean(
    (session.artifact?.sourceImageDataUrl && session.artifact?.specimenImageDataUrl) ||
      (activeInput?.sourceImageDataUrl && activeInput?.specimenImageDataUrl),
  );
  const hasSourceEvidence = Boolean(
    activeInput?.sourceImageDataUrl ||
      activeInput?.imageDataUrl ||
      session.artifact?.sourceImageDataUrl ||
      session.artifact?.imageDataUrl,
  );
  const hasObjectField = Boolean(
    activeInput?.objectBoundary ||
      activeInput?.specimenImageDataUrl ||
      session.artifact?.objectBoundary ||
      session.artifact?.specimenImageDataUrl,
  );
  const hasContextLock = Boolean(
    activeInput?.objectName ||
      activeInput?.whyNow ||
      activeInput?.origin ||
      activeInput?.collection ||
      activeInput?.capturePoint ||
      session.artifact?.objectName ||
      session.artifact?.whyNow ||
      session.artifact?.origin ||
      session.artifact?.collection ||
      session.artifact?.record?.source.userNote,
  );
  const sourceImageSrc =
    activeInput?.thumbnailDataUrl ||
    activeInput?.specimenImageDataUrl ||
    activeInput?.sourceImageDataUrl ||
    activeInput?.imageDataUrl ||
    chamberImage;
  const isPreserving = session.status === "preserving";
  const isComplete = session.status === "complete" && Boolean(session.artifact);
  const isFailed = session.status === "error";
  const hasCapture = Boolean(activeInput || session.artifact);

  const clearStageTimers = useCallback(() => {
    stageTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    stageTimersRef.current = [];
  }, []);

  const runPreservation = useCallback(
    async (input: CaptureInput, sessionId: string, retryAttempt = 1) => {
      const runKey = `${sessionId}:${retryAttempt}`;
      if (runRef.current === runKey) return;
      runRef.current = runKey;
      completedRunRef.current = null;
      clearStageTimers();
      visualStartedAtRef.current = window.performance.now();
      visualSessionIdRef.current = sessionId;
      if (mountedRef.current) setElapsedMs(0);
      beginPreservation();

      const stageTimers = preservationStages.map((stage, index) =>
        window.setTimeout(() => {
          if (!mountedRef.current) return;
          setStageProgress(stage, Math.min(92, 16 + index * 19));
        }, index * 820),
      );
      stageTimersRef.current = stageTimers;

      try {
        const artifact = await generateArtifact(input).then((generatedArtifact) =>
          processSpecimenImages(generatedArtifact, input).catch(() => generatedArtifact),
        );
        if (!mountedRef.current || completedRunRef.current === runKey) return;
        completedRunRef.current = runKey;
        clearStageTimers();
        setStageProgress("preserved", 100);
        await completePreservation(artifact);
      } catch (error) {
        if (!mountedRef.current) return;
        clearStageTimers();
        runRef.current = null;
        failPreservation(error instanceof Error ? error.message : "Preservation could not complete. A local artifact record can still be formed.");
      }
    },
    [beginPreservation, clearStageTimers, completePreservation, failPreservation, setStageProgress],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearStageTimers();
      if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
      if (artifactTimerRef.current) window.clearTimeout(artifactTimerRef.current);
      if (visualTimerRef.current) window.clearInterval(visualTimerRef.current);
    };
  }, [clearStageTimers]);

  useEffect(() => {
    if (session.status !== "intake" && session.status !== "preserving") {
      if (visualTimerRef.current) window.clearInterval(visualTimerRef.current);
      visualTimerRef.current = undefined;
      if (session.status === "idle") setElapsedMs(0);
      return;
    }

    if (visualSessionIdRef.current !== session.id || visualStartedAtRef.current === undefined) {
      visualSessionIdRef.current = session.id;
      visualStartedAtRef.current = window.performance.now();
    }

    const updateElapsed = () => {
      if (!mountedRef.current || visualStartedAtRef.current === undefined) return;
      setElapsedMs(Math.round(window.performance.now() - visualStartedAtRef.current));
    };

    updateElapsed();
    if (visualTimerRef.current) window.clearInterval(visualTimerRef.current);
    visualTimerRef.current = window.setInterval(updateElapsed, VISUAL_TICK_MS);

    return () => {
      if (visualTimerRef.current) window.clearInterval(visualTimerRef.current);
      visualTimerRef.current = undefined;
    };
  }, [session.id, session.status]);

  useEffect(() => {
    if (!activeInput || session.status !== "intake") return;
    if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    autoTimerRef.current = window.setTimeout(() => {
      retryAttemptRef.current = 1;
      void runPreservation(activeInput, session.id, retryAttemptRef.current);
    }, 600);

    return () => {
      if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    };
  }, [activeInput, runPreservation, session.id, session.status]);

  const goToReview = useCallback(() => {
    if (!artifactId) return;
    const reviewKey = `${session.id}:${artifactId}`;
    if (reviewNavigationKeyRef.current === reviewKey) return;
    reviewNavigationKeyRef.current = reviewKey;
    navigate(ROUTES.review);
  }, [artifactId, navigate, session.id]);

  useEffect(() => {
    if (!isComplete || !artifactId) return;
    if (artifactTimerRef.current) window.clearTimeout(artifactTimerRef.current);
    artifactTimerRef.current = window.setTimeout(goToReview, COMPLETION_HANDOFF_MS);

    return () => {
      if (artifactTimerRef.current) window.clearTimeout(artifactTimerRef.current);
    };
  }, [artifactId, goToReview, isComplete]);

  const retryPreservation = () => {
    if (!activeInput) return;
    retryAttemptRef.current = Math.min(3, retryAttemptRef.current + 1);
    void runPreservation(activeInput, session.id, retryAttemptRef.current);
  };

  const diagnostics = useMemo<ChamberDiagnosticRow[]>(
    () => [
      ["Object", objectLabel],
      ["Origin", activeInput?.origin || session.artifact?.origin || "not recorded"],
      ["Source", hasSourceRetained ? "retained" : hasSourceEvidence ? "entered" : "not received"],
      ["Object field", hasObjectField ? "sealed" : "not sealed"],
      ["Context", hasContextLock ? "attached" : "not attached"],
      ["Boundary", hasManualExtraction ? "locked" : hasObjectField ? "simulated" : "not sealed"],
    ].map(([label, value]) => ({ label, value })),
    [
      activeInput?.origin,
      hasContextLock,
      hasManualExtraction,
      hasObjectField,
      hasSourceEvidence,
      hasSourceRetained,
      objectLabel,
      session.artifact?.origin,
    ],
  );

  const chamberState = useMemo(
    () =>
      mapGenerationLifecycleToChamberState({
        generationStatus: session.status,
        elapsedMs,
        hasContextLock,
        hasObjectField,
        hasSourceEvidence,
        isComplete,
        isFailed,
      }),
    [elapsedMs, hasContextLock, hasObjectField, hasSourceEvidence, isComplete, isFailed, session.status],
  );

  return (
    <CapsulePhoneFrame
      mode="preservation"
      footer={<CapsuleBottomDock mode="preservation" />}
      className="chamber-app-shell"
      screenClassName="chamber-runtime-shell"
      contentClassName="chamber-runtime-content"
    >
      <ChamberInstrument
        states={chamberState.statesWithStatus}
        activeStateId={chamberState.activeStateId}
        displayProgress={chamberState.displayProgress}
        statusLine={chamberState.statusLine}
        isReady={chamberState.isReady}
        isFailed={isFailed}
        hasCapture={hasCapture}
        isPreserving={isPreserving}
        objectLabel={objectLabel}
        sourceImageSrc={sourceImageSrc}
        sourceImageAlt={`${objectLabel} source evidence`}
        diagnostics={diagnostics}
        error={session.error}
        showNewSource={hasCapture && session.status !== "preserving"}
        onReview={goToReview}
        onRetry={retryPreservation}
        onBackToCapture={() => navigate(ROUTES.capture)}
        onReturnToVault={() => navigate(ROUTES.vault)}
        onNewSource={resetSession}
      />
    </CapsulePhoneFrame>
  );
}
