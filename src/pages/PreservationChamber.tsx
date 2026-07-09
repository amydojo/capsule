import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ExtractionReadout from "../components/ExtractionReadout";
import CapsuleArchiveSlip from "../components/system/CapsuleArchiveSlip";
import CapsuleBottomDock from "../components/system/CapsuleBottomDock";
import CapsuleObjectPlate from "../components/system/CapsuleObjectPlate";
import CapsulePhoneFrame from "../components/system/CapsulePhoneFrame";
import CapsuleScreenHeader from "../components/system/CapsuleScreenHeader";
import ProcessingOrb from "../components/preservation/ProcessingOrb";
import { ROUTES } from "../constants/navigation";
import { usePreservationSession } from "../context/PreservationSessionContext";
import { generateArtifact } from "../services/artifactApi";
import { processSpecimenImages } from "../services/specimenProcessing";
import type { PreservationStage } from "../types/artifact";
import type { CaptureInput } from "../types/capture";
import { getArtifactHeroImage } from "../utils/artifactImage";

const preservationStages: PreservationStage[] = ["captured", "isolated", "analyzed", "traced", "preserved"];

const statusText: Record<PreservationStage, string> = {
  captured: "Source received.",
  isolated: "Object field sealed.",
  analyzed: "Observed facts forming.",
  traced: "Interpretive layer restrained.",
  preserved: "Record ready for review.",
  sealed: "Artifact record filed.",
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

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
  const objectLabel = session.artifact?.commonName || activeInput?.objectName || "preserved object";
  const extraction = session.artifact?.extraction || activeInput?.extraction;
  const hasManualExtraction = extraction?.method === "manual-object-field" || Boolean(session.artifact?.objectBoundary || activeInput?.objectBoundary);
  const hasSourceRetained = Boolean((session.artifact?.sourceImageDataUrl && session.artifact?.specimenImageDataUrl) || (activeInput?.sourceImageDataUrl && activeInput?.specimenImageDataUrl));
  const extractionConfidence = extraction?.confidence || (hasManualExtraction ? 0.84 : 0.62);
  const isPreserving = session.status === "preserving";
  const isComplete = session.status === "complete" && Boolean(session.artifact);
  const hasCapture = Boolean(activeInput || session.artifact);

  const chamberTitle = useMemo(() => {
    if (session.status === "error") return "Preservation interrupted.";
    if (isComplete) return "Record ready.";
    if (isPreserving) return "Forming the record.";
    return "Preservation chamber.";
  }, [isComplete, isPreserving, session.status]);

  const stateCopy = useMemo(() => {
    if (session.status === "error") return "Could not complete the artifact record.";
    if (isComplete) return "Record ready for Artifact Review.";
    if (isPreserving) return statusText[session.activeStage];
    if (activeInput) return "Source evidence received. Preservation starting.";
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
        failPreservation(error instanceof Error ? error.message : "Preservation could not complete. A local artifact record can still be formed.");
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
      <CapsulePhoneFrame mode="preservation" footer={<CapsuleBottomDock mode="preservation" />}>
        <CapsuleScreenHeader
          mode="preservation"
          eyebrow="Preservation Chamber"
          title="No active preservation."
          subtitle="Present source evidence to begin, or return to the Vault."
          leading={{ label: "x", ariaLabel: "Return to Vault", onClick: () => navigate(ROUTES.vault) }}
        />
        <CapsuleArchiveSlip
          mode="preservation"
          eyebrow="CHAMBER STATE"
          title="Waiting for source evidence."
          rows={[
            ["Source", "not received"],
            ["Object field", "not sealed"],
            ["Record", "not formed"],
          ]}
          className="mt-8"
        />
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => navigate(ROUTES.capture)} className="h-10 rounded-full bg-[var(--capsule-cream)] px-5 text-[0.62rem] font-semibold text-[var(--capsule-black)]">
            Preserve Object
          </button>
          <button type="button" onClick={() => navigate(ROUTES.vault)} className="device-control-button px-5 py-2.5 text-[0.58rem] font-medium">
            Go to Vault
          </button>
        </div>
      </CapsulePhoneFrame>
    );
  }

  return (
    <CapsulePhoneFrame mode="preservation" footer={<CapsuleBottomDock mode="preservation" />}>
      <CapsuleScreenHeader
        mode="preservation"
        eyebrow={isComplete ? "Artifact Review Ready" : "Preservation Chamber"}
        title={chamberTitle}
        subtitle="Capsule is forming the artifact record from the selected object field."
        marker
        trailing={hasCapture && session.status !== "preserving" ? { label: "+", ariaLabel: "New source evidence", onClick: resetSession } : undefined}
      />

      <div className="mt-7">
        <ProcessingOrb label={session.error || stateCopy} progress={Math.round(session.progress || 0)} className="p-0" />
      </div>

      <div className="mt-5 grid grid-cols-5 items-start gap-2" aria-label="Preservation stage">
        {preservationStages.map((stage, index) => {
          const active = index === activeIndex;
          const complete = index < activeIndex || isComplete;

          return (
            <div key={stage} className="flex flex-col items-center gap-2">
              <span
                className={joinClasses(
                  "h-2.5 w-2.5 rounded-full border",
                  active ? "border-[var(--capsule-red)] bg-[var(--capsule-red)] shadow-[0_0_0_7px_rgba(152,57,49,0.16)]" : complete ? "border-[var(--capsule-gold)] bg-[var(--capsule-gold)]" : "border-white/14 bg-white/5",
                )}
                aria-hidden="true"
              />
              <span className={joinClasses("mono-label text-center text-[0.46rem]", active ? "text-[var(--capsule-coral)]" : complete ? "text-[var(--capsule-gold)]" : "text-[var(--capsule-linen-ash)]")}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {isComplete && session.artifact ? (
        <CapsuleObjectPlate
          mode="preservation"
          imageSrc={chamberImage}
          imageAlt={objectLabel}
          label="Review specimen"
          revealed
          className="mt-6"
        />
      ) : null}

      <CapsuleArchiveSlip
        mode="preservation"
        eyebrow="PRESERVATION STATE"
        title={session.status === "error" ? "Interrupted" : isComplete ? "Record ready" : isPreserving ? "Forming record" : "Source received"}
        rows={[
          ["Object", objectLabel],
          ["Origin", activeInput?.origin || session.artifact?.origin || "not recorded"],
          ["Source", hasSourceRetained ? "retained" : "pending"],
          ["Object field", hasManualExtraction ? "locked" : "simulated"],
        ]}
        className="mt-5"
      >
        <p className="mt-3 text-[0.68rem] leading-5 text-white/58">{session.error || stateCopy}</p>
      </CapsuleArchiveSlip>

      {hasManualExtraction ? (
        <div className="mt-4 rounded-[18px] border border-white/[0.08] bg-white/[0.04] p-3">
          <ExtractionReadout
            confidence={extractionConfidence}
            method={extraction?.method || "manual-object-field"}
            sourceRetained={hasSourceRetained}
            boundaryLocked
            compact
          />
        </div>
      ) : null}

      <div className="mt-5 grid gap-2">
        {activeInput && session.status === "intake" ? (
          <button type="button" disabled className="h-10 rounded-full bg-[var(--capsule-cream)] px-5 text-[0.62rem] font-semibold text-[var(--capsule-black)] opacity-80">
            Preparing chamber...
          </button>
        ) : null}
        {isPreserving ? (
          <button type="button" disabled className="h-10 rounded-full bg-[var(--capsule-cream)] px-5 text-[0.62rem] font-semibold text-[var(--capsule-black)] opacity-80">
            Forming record...
          </button>
        ) : null}
        {isComplete && session.artifact ? (
          <button type="button" onClick={() => navigate(ROUTES.review)} className="h-10 rounded-full bg-[var(--capsule-cream)] px-5 text-[0.62rem] font-semibold text-[var(--capsule-black)] shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
            Review Artifact Record
          </button>
        ) : null}
        {session.status === "error" && activeInput ? (
          <>
            <button type="button" onClick={retryPreservation} className="h-10 rounded-full bg-[var(--capsule-cream)] px-5 text-[0.62rem] font-semibold text-[var(--capsule-black)]">
              Retry Preservation
            </button>
            <button type="button" onClick={() => navigate(ROUTES.capture)} className="device-control-button px-5 py-2.5 text-[0.58rem] font-medium">
              Return to Preserve
            </button>
          </>
        ) : null}
      </div>
    </CapsulePhoneFrame>
  );
}
