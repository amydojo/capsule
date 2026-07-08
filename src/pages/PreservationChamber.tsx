import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ExtractionReadout from "../components/ExtractionReadout";
import PreservationField from "../components/PreservationField";
import PreservationStageLine from "../components/PreservationStageLine";
import ScanChecklist from "../components/ScanChecklist";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { ROUTES } from "../constants/navigation";
import { usePreservationSession } from "../context/PreservationSessionContext";
import { primaryArtifact } from "../data/artifacts";
import { generateArtifact } from "../services/artifactApi";
import { processSpecimenImages } from "../services/specimenProcessing";
import type { PreservationStage } from "../types/artifact";
import type { CaptureInput } from "../types/capture";
import { getArtifactHeroImage } from "../utils/artifactImage";

const preservationStages: PreservationStage[] = ["captured", "isolated", "analyzed", "traced", "preserved"];

const statusText: Record<PreservationStage, string> = {
  captured: "Source field stabilized.",
  isolated: "Object boundary locked.",
  analyzed: "Reading selected specimen evidence.",
  traced: "Pressure trace forming.",
  preserved: "Continuity profile complete.",
  sealed: "Artifact sealed.",
};

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
  const runRef = useRef<string | null>(null);
  const retryAttemptRef = useRef(1);
  const autoTimerRef = useRef<number | undefined>(undefined);
  const artifactTimerRef = useRef<number | undefined>(undefined);
  const stageTimersRef = useRef<number[]>([]);

  const activeIndex = Math.max(0, preservationStages.indexOf(session.activeStage));
  const activeInput = session.input;
  const chamberImage = session.artifact ? getArtifactHeroImage(session.artifact) : activeInput?.specimenImageDataUrl || activeInput?.imageDataUrl || "";
  const objectLabel = session.artifact?.commonName || activeInput?.objectName || primaryArtifact.commonName;
  const extraction = session.artifact?.extraction || activeInput?.extraction;
  const hasManualExtraction = extraction?.method === "manual-object-field" || Boolean(session.artifact?.objectBoundary || activeInput?.objectBoundary);
  const hasSourceRetained = Boolean((session.artifact?.sourceImageDataUrl && session.artifact?.specimenImageDataUrl) || (activeInput?.sourceImageDataUrl && activeInput?.specimenImageDataUrl));
  const extractionConfidence = extraction?.confidence || (hasManualExtraction ? 0.84 : 0.62);
  const isPreserving = session.status === "preserving";
  const isComplete = session.status === "complete" && Boolean(session.artifact);
  const hasCapture = Boolean(activeInput || session.artifact);
  const checklistStatus = session.status === "complete" ? "done" : isPreserving ? "preserving" : "idle";

  const chamberTitle = useMemo(() => {
    if (session.status === "error") return "Preservation Interrupted";
    if (isComplete) return "Artifact Created";
    if (isPreserving) return "Preserving Object";
    return "Preserving Object";
  }, [isComplete, isPreserving, session.status]);

  const stateCopy = useMemo(() => {
    if (session.status === "error") return "Could not complete artifact generation.";
    if (isComplete) return "Object preserved.";
    if (isPreserving) return statusText[session.activeStage];
    if (activeInput) return "Object intake received. Preservation starting.";
    return "No active preservation.";
  }, [activeInput, isComplete, isPreserving, session.activeStage, session.status]);

  const runPreservation = useCallback(
    async (input: CaptureInput, sessionId: string, retryAttempt = 1) => {
      const runKey = `${sessionId}:${retryAttempt}`;
      if (runRef.current === runKey) return;
      runRef.current = runKey;
      stageTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      beginPreservation();

      const stageTimers = preservationStages.map((stage, index) =>
        window.setTimeout(() => {
          setStageProgress(stage, Math.min(92, 16 + index * 19));
        }, index * 820),
      );
      stageTimersRef.current = stageTimers;

      try {
        const minDuration = new Promise((resolve) => window.setTimeout(resolve, 3600));
        const artifactPromise = generateArtifact(input).then((artifact) =>
          processSpecimenImages(artifact, input).catch(() => artifact),
        );
        const [artifact] = await Promise.all([artifactPromise, minDuration]);
        stageTimers.forEach((timer) => window.clearTimeout(timer));
        stageTimersRef.current = [];
        setStageProgress("preserved", 100);
        await completePreservation(artifact);
      } catch (error) {
        stageTimers.forEach((timer) => window.clearTimeout(timer));
        stageTimersRef.current = [];
        runRef.current = null;
        failPreservation(error instanceof Error ? error.message : "Preservation could not complete. A local artifact can still be generated.");
      }
    },
    [beginPreservation, completePreservation, failPreservation, setStageProgress],
  );

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

  const retryPreservation = () => {
    if (!activeInput) return;
    retryAttemptRef.current = Math.min(3, retryAttemptRef.current + 1);
    void runPreservation(activeInput, session.id, retryAttemptRef.current);
  };

  useEffect(() => {
    return () => {
      stageTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      if (artifactTimerRef.current) window.clearTimeout(artifactTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isComplete || !session.artifact) return;
    if (artifactTimerRef.current) window.clearTimeout(artifactTimerRef.current);
    artifactTimerRef.current = window.setTimeout(() => {
      if (session.artifact) navigate(ROUTES.review);
    }, 1100);

    return () => {
      if (artifactTimerRef.current) window.clearTimeout(artifactTimerRef.current);
    };
  }, [isComplete, navigate, session.artifact]);

  if (!hasCapture) {
    return (
      <main className="instrument-shell min-h-[100dvh] overflow-x-hidden pb-[calc(env(safe-area-inset-bottom)+4rem)]">
        <TopBar fossilId={primaryArtifact.id} tone="dark" contextLabel="PRESERVING OBJECT" />
        <section className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-5 text-center sm:px-8">
          <p className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">PRESERVING OBJECT</p>
          <h1 className="mt-4 text-3xl font-semibold uppercase tracking-[0.04em] text-[var(--capsule-bone)] sm:text-5xl">No active preservation.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--capsule-ash-dim)]">Capture an object to begin preservation, or return to the Vault.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => navigate(ROUTES.vault)} className="device-control-button px-7 py-3.5 text-sm font-medium">
              Go to Vault
            </button>
            <button onClick={() => navigate(ROUTES.capture)} className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] shadow-[0_18px_42px_rgba(0,0,0,0.32)]">
              Capture Object
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="instrument-shell min-h-[100dvh] overflow-x-hidden pb-[calc(env(safe-area-inset-bottom)+4rem)]">
      <TopBar fossilId={session.artifact?.id || primaryArtifact.id} tone="dark" contextLabel="PRESERVING OBJECT" />
      <section className="mx-auto grid w-full max-w-[92rem] gap-5 px-4 pb-10 pt-1 sm:px-8 lg:grid-cols-[14rem_minmax(0,1fr)_15rem] lg:px-10">
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="hidden lg:order-1 lg:block lg:pt-36"
        >
          <ScanChecklist status={checklistStatus} />
          <div className="instrument-card-dark mt-4 rounded-2xl p-5">
            <p className="mono-label text-[0.6rem] text-[var(--capsule-ash-dim)]">Object</p>
            <p className="mt-3 text-sm font-medium text-[var(--capsule-bone)]">{objectLabel}</p>
            <p className="mt-5 mono-label text-[0.6rem] text-[var(--capsule-ash-dim)]">Origin</p>
            <p className="mt-3 text-xs leading-5 text-[var(--capsule-ash-dim)]">{activeInput?.origin || session.artifact?.origin || primaryArtifact.origin}</p>
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="order-1 lg:order-2"
        >
          <div className="mb-7 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">{isComplete ? "SPECIMEN ISOLATION" : "REALITY EXTRACTION"}</p>
              <h1 className="mt-2 text-3xl font-semibold uppercase leading-none tracking-[0.04em] text-[var(--capsule-bone)] sm:text-5xl">{chamberTitle}</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-[var(--capsule-ash-dim)]">Object extracted from reality. Containment field active.</p>
            </div>
            <span className="hidden rounded-full border border-[var(--capsule-line-dark)] bg-white/[0.055] px-3 py-1.5 font-mono text-[0.68rem] text-[var(--capsule-ash-dim)] sm:inline">
              {isComplete ? "Specimen Render" : isPreserving ? session.activeStage : "intake"}
            </span>
          </div>
          {isComplete && session.artifact ? (
            <PreservationField mode="chamber" imageDataUrl={chamberImage} imageAlt={objectLabel} motionSeed={session.artifact.render?.motionSeed} render={session.artifact.render} />
          ) : (
            <SpecimenStage
              tone="dark"
              showScanLine={isPreserving}
              showMarkers
              imageDataUrl={chamberImage}
              imageAlt={objectLabel}
              showIsolationChip={Boolean(chamberImage)}
              isolationLabel={hasManualExtraction ? "Isolation: manual" : "Isolation: simulated"}
            />
          )}
          <PreservationStageLine activeIndex={activeIndex} />
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-[var(--capsule-line-dark)] bg-white/[0.055] p-4 text-center lg:hidden">
            <p className="mono-label text-[0.58rem] text-[var(--capsule-ash-dim)]">PRESERVATION STATE</p>
            <p className="mt-2 text-sm leading-6 text-[var(--capsule-bone)]">{session.error || stateCopy}</p>
          </div>
          {hasManualExtraction && (
            <div className="mt-4 hidden space-y-3 lg:block">
              <div className="flex flex-wrap justify-center gap-2">
                <span className="mono-label rounded-full border border-[rgba(154,149,86,0.34)] bg-white/[0.055] px-3 py-1.5 text-[0.56rem] text-[var(--capsule-mineral-olive-bright)]">OBJECT FIELD LOCKED</span>
                <span className="mono-label rounded-full border border-[var(--capsule-line-dark)] bg-white/[0.055] px-3 py-1.5 text-[0.56rem] text-[var(--capsule-ash-dim)]">ISOLATION: MANUAL</span>
                {hasSourceRetained && <span className="mono-label rounded-full border border-[var(--capsule-line-dark)] bg-white/[0.055] px-3 py-1.5 text-[0.56rem] text-[var(--capsule-ash-dim)]">SOURCE RETAINED</span>}
              </div>
              <div className="mx-auto max-w-2xl rounded-[1.35rem] border border-[rgba(23,25,28,0.08)] bg-[rgba(13,14,16,0.86)] p-3">
                <ExtractionReadout confidence={extractionConfidence} method="manual-object-field" sourceRetained={hasSourceRetained} boundaryLocked compact />
              </div>
            </div>
          )}
          <div className="sticky bottom-0 z-30 -mx-4 mt-7 flex flex-wrap items-center justify-center gap-3 border-t border-[var(--capsule-line-dark)] bg-[rgba(13,14,16,0.88)] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
            {activeInput && session.status === "intake" && <button disabled className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] opacity-80 shadow-[0_18px_42px_rgba(0,0,0,0.32)]">Preparing Object...</button>}
            {isPreserving && <button disabled className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] opacity-80 shadow-[0_18px_42px_rgba(0,0,0,0.32)]">Preserving Object...</button>}
            {isComplete && session.artifact && (
              <button onClick={() => navigate(ROUTES.review)} className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] shadow-[0_18px_42px_rgba(0,0,0,0.32)]">
                Review Artifact
              </button>
            )}
            {session.status === "error" && activeInput && (
              <>
                <button onClick={retryPreservation} className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] shadow-[0_18px_42px_rgba(0,0,0,0.32)]">
                  Retry Preservation
                </button>
                <button onClick={() => navigate(ROUTES.capture)} className="device-control-button px-7 py-3.5 text-sm font-medium">
                  Return to Capture
                </button>
              </>
            )}
          </div>
          {hasManualExtraction && (
            <div className="mx-auto mt-5 max-w-2xl rounded-[1.25rem] border border-[rgba(13,14,16,0.1)] bg-[rgba(13,14,16,0.9)] p-3 lg:hidden">
              <ExtractionReadout confidence={extractionConfidence} method="manual-object-field" sourceRetained={hasSourceRetained} boundaryLocked compact />
            </div>
          )}
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="hidden lg:order-3 lg:block lg:pt-36"
        >
          <div className="instrument-card-dark rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--capsule-mineral-olive)] shadow-[0_0_0_6px_var(--capsule-mineral-olive-soft)]" />
              <p className="mono-label text-[0.6rem] text-[var(--capsule-ash-dim)]">Preservation State</p>
            </div>
            <h2 className="mt-5 text-xl font-semibold text-[var(--capsule-bone)]">{session.status === "error" ? "Interrupted" : isComplete ? "Object Preserved" : isPreserving ? "Preserving Object" : "Ready"}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--capsule-ash-dim)]">{session.error || stateCopy}</p>
            <div className="mt-8 flex items-end justify-between border-t border-[var(--capsule-line-dark)] pt-5">
              <span className="mono-label text-[0.58rem] text-[var(--capsule-ash-dim)]">Signal Strength</span>
              <span className="font-mono text-2xl text-[var(--capsule-bone)]">{Math.round(session.progress || 0)}%</span>
            </div>
          </div>
          <div className="instrument-card-dark mt-4 rounded-2xl p-5">
            {preservationStages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-3 border-b border-[var(--capsule-line-dark)] py-3 last:border-0">
                <span className="font-mono text-xs text-[var(--capsule-spectrum-indigo-bright)]">0{index + 1}</span>
                <span className="text-xs text-[var(--capsule-ash-dim)]">{stage === "preserved" ? "Preserve" : stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
              </div>
            ))}
          </div>
          {hasCapture && session.status !== "preserving" && (
            <button onClick={resetSession} className="device-control-button mt-4 w-full px-5 py-3 text-sm font-medium">
              New Capture
            </button>
          )}
        </motion.aside>
      </section>
    </main>
  );
}
