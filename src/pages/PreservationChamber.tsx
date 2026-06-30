import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PreservationStageLine from "../components/PreservationStageLine";
import ScanChecklist from "../components/ScanChecklist";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { usePreservationSession } from "../context/PreservationSessionContext";
import { primaryArtifact } from "../data/artifacts";
import { generateArtifact } from "../services/artifactApi";
import type { PreservationStage } from "../types/artifact";
import type { CaptureInput } from "../types/capture";

const preservationStages: PreservationStage[] = ["captured", "isolated", "analyzed", "traced", "preserved"];

const statusText: Record<PreservationStage, string> = {
  captured: "Stabilizing object field...",
  isolated: "Isolating specimen from environment...",
  analyzed: "Reading material evidence...",
  traced: "Forming Pressure Trace...",
  preserved: "Building continuity profile...",
  sealed: "Artifact sealed.",
};

const sampleNotebookDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#f7f6f2"/><g transform="translate(170 92) rotate(-4 150 150)"><rect x="22" y="22" width="288" height="300" rx="18" fill="#eadfce" stroke="#252525" stroke-opacity=".22"/><rect x="42" y="42" width="288" height="300" rx="18" fill="#f4eadb" stroke="#252525" stroke-opacity=".22"/><line x1="112" y1="42" x2="112" y2="342" stroke="#252525" stroke-opacity=".18"/><line x1="152" y1="112" x2="282" y2="112" stroke="#252525" stroke-opacity=".16"/><line x1="152" y1="152" x2="266" y2="152" stroke="#252525" stroke-opacity=".13"/><line x1="152" y1="192" x2="248" y2="192" stroke="#252525" stroke-opacity=".1"/><rect x="320" y="78" width="16" height="222" rx="8" fill="#17191c" fill-opacity=".86"/></g></svg>`,
)}`;

const createDemoInput = (): CaptureInput => ({
  imageDataUrl: sampleNotebookDataUrl,
  objectName: "field notebook",
  whyNow: "The first working Capsule prototype is becoming real.",
  futureMemory: "The first page where Capsule stopped being theoretical.",
  origin: "desk / afternoon / glendora, ca",
  capturePoint: "Jun 30, 2026, 1:42 PM",
});

export default function PreservationChamber() {
  const navigate = useNavigate();
  const {
    session,
    startCapture,
    beginPreservation,
    setStageProgress,
    completePreservation,
    failPreservation,
    resetSession,
  } = usePreservationSession();
  const runRef = useRef<string | null>(null);
  const autoTimerRef = useRef<number | undefined>(undefined);
  const stageTimersRef = useRef<number[]>([]);

  const activeIndex = Math.max(0, preservationStages.indexOf(session.activeStage));
  const activeInput = session.input;
  const chamberImage = session.artifact?.imageDataUrl || activeInput?.imageDataUrl || "";
  const objectLabel = session.artifact?.commonName || activeInput?.objectName || primaryArtifact.commonName;
  const isPreserving = session.status === "preserving";
  const isComplete = session.status === "complete" && Boolean(session.artifact);
  const hasCapture = Boolean(activeInput || session.artifact);
  const checklistStatus = session.status === "complete" ? "done" : isPreserving ? "preserving" : "idle";

  const chamberTitle = useMemo(() => {
    if (session.status === "error") return "Preservation Interrupted";
    if (isComplete) return "Object Preserved";
    if (isPreserving) return "Preserving Object";
    return "Begin Preservation";
  }, [isComplete, isPreserving, session.status]);

  const stateCopy = useMemo(() => {
    if (session.status === "error") return "Could not complete artifact generation.";
    if (isComplete) return "Continuity profile stabilized.";
    if (isPreserving) return statusText[session.activeStage];
    if (activeInput) return "Object intake received. Chamber ready.";
    return "Capture an object to begin preservation.";
  }, [activeInput, isComplete, isPreserving, session.activeStage, session.status]);

  const runPreservation = useCallback(
    async (input: CaptureInput, sessionId: string) => {
      if (runRef.current === sessionId) return;
      runRef.current = sessionId;
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
        const artifactPromise = generateArtifact(input);
        const [artifact] = await Promise.all([artifactPromise, minDuration]);
        stageTimers.forEach((timer) => window.clearTimeout(timer));
        stageTimersRef.current = [];
        setStageProgress("preserved", 100);
        completePreservation(artifact);
      } catch {
        stageTimers.forEach((timer) => window.clearTimeout(timer));
        stageTimersRef.current = [];
        runRef.current = null;
        failPreservation("Preservation could not complete. A local artifact can still be generated.");
      }
    },
    [beginPreservation, completePreservation, failPreservation, setStageProgress],
  );

  useEffect(() => {
    if (!activeInput || session.status !== "intake") return;
    if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    autoTimerRef.current = window.setTimeout(() => {
      void runPreservation(activeInput, session.id);
    }, 600);

    return () => {
      if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    };
  }, [activeInput, runPreservation, session.id, session.status]);

  useEffect(() => {
    return () => {
      stageTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const beginDemo = () => {
    const demoInput = createDemoInput();
    const next = startCapture(demoInput);
    window.setTimeout(() => {
      void runPreservation(demoInput, next.id);
    }, 250);
  };

  return (
    <main className="min-h-screen pb-12">
      <TopBar fossilId={session.artifact?.id || primaryArtifact.id} />
      <section className="mx-auto grid w-full max-w-[92rem] gap-5 px-5 pb-10 pt-1 sm:px-8 lg:grid-cols-[14rem_minmax(0,1fr)_15rem] lg:px-10">
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="order-2 lg:order-1 lg:pt-36"
        >
          <ScanChecklist status={checklistStatus} />
          <div className="instrument-panel mt-4 rounded-2xl p-5">
            <p className="mono-label text-[0.6rem] text-[var(--capsule-ash)]">Object</p>
            <p className="mt-3 text-sm font-medium text-[var(--capsule-graphite)]">{objectLabel}</p>
            <p className="mt-5 mono-label text-[0.6rem] text-[var(--capsule-ash)]">Origin</p>
            <p className="mt-3 text-xs leading-5 text-[var(--capsule-ash)]">{activeInput?.origin || session.artifact?.origin || primaryArtifact.origin}</p>
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
              <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">PRESERVATION CHAMBER</p>
              <h1 className="mt-2 text-3xl font-semibold uppercase leading-none tracking-[0.04em] sm:text-5xl">{chamberTitle}</h1>
            </div>
            <span className="hidden rounded-full border border-[rgba(229,226,220,0.8)] bg-white/50 px-3 py-1.5 font-mono text-[0.68rem] text-[var(--capsule-ash)] sm:inline">
              {isComplete ? "Specimen Render" : isPreserving ? session.activeStage : "intake"}
            </span>
          </div>
          <SpecimenStage showScanLine={isPreserving} showMarkers imageDataUrl={chamberImage} imageAlt={objectLabel} showIsolationChip={Boolean(chamberImage)} />
          <PreservationStageLine activeIndex={activeIndex} />
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {!hasCapture && (
              <>
                <button onClick={() => navigate("/capture")} className="primary-button px-7 py-3.5 text-sm font-semibold">
                  Capture Object
                </button>
                <button onClick={beginDemo} className="secondary-button px-7 py-3.5 text-sm font-medium">
                  Begin Demo Preservation
                </button>
              </>
            )}
            {activeInput && session.status === "intake" && (
              <button onClick={() => void runPreservation(activeInput, session.id)} className="primary-button px-7 py-3.5 text-sm font-semibold">
                Begin Preservation
              </button>
            )}
            {isPreserving && <button disabled className="primary-button px-7 py-3.5 text-sm font-semibold opacity-95">Preserving Object...</button>}
            {isComplete && session.artifact && (
              <button onClick={() => navigate(`/artifact/${session.artifact?.id}`)} className="primary-button px-7 py-3.5 text-sm font-semibold">
                Open Artifact
              </button>
            )}
            {session.status === "error" && activeInput && (
              <>
                <button onClick={() => void runPreservation(activeInput, session.id)} className="primary-button px-7 py-3.5 text-sm font-semibold">
                  Retry Preservation
                </button>
                <button onClick={() => navigate("/capture")} className="secondary-button px-7 py-3.5 text-sm font-medium">
                  Return to Capture Point
                </button>
              </>
            )}
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="order-3 lg:pt-36"
        >
          <div className="instrument-panel rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--capsule-blue)] shadow-[0_0_0_6px_var(--capsule-glow)]" />
              <p className="mono-label text-[0.6rem] text-[var(--capsule-ash)]">Preservation State</p>
            </div>
            <h2 className="mt-5 text-xl font-semibold">{session.status === "error" ? "Interrupted" : isComplete ? "Object Preserved" : isPreserving ? "Preserving Object" : "Ready"}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--capsule-ash)]">{session.error || stateCopy}</p>
            <div className="mt-8 flex items-end justify-between border-t border-[rgba(229,226,220,0.72)] pt-5">
              <span className="mono-label text-[0.58rem] text-[var(--capsule-ash)]">Signal Strength</span>
              <span className="font-mono text-2xl text-[var(--capsule-graphite)]">{Math.round(session.progress || 0)}%</span>
            </div>
          </div>
          <div className="instrument-panel mt-4 rounded-2xl p-5">
            {preservationStages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-3 border-b border-[rgba(229,226,220,0.62)] py-3 last:border-0">
                <span className="font-mono text-xs text-[var(--capsule-blue)]">0{index + 1}</span>
                <span className="text-xs text-[var(--capsule-ash)]">{stage === "preserved" ? "Preserve" : stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
              </div>
            ))}
          </div>
          {hasCapture && session.status !== "preserving" && (
            <button onClick={resetSession} className="secondary-button mt-4 w-full px-5 py-3 text-sm font-medium">
              New Capture
            </button>
          )}
        </motion.aside>
      </section>
    </main>
  );
}
