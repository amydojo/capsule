import type { CSSProperties } from "react";
import ChamberFailureState from "./ChamberFailureState";
import ChamberStateStack from "./ChamberStateStack";
import ChamberStatusHeader from "./ChamberStatusHeader";
import type { ChamberState, ChamberStateId } from "./chamberStateMachine";
import "./chamber.css";

export type ChamberDiagnosticRow = {
  label: string;
  value: string;
};

export type ChamberInstrumentProps = {
  states: ChamberState[];
  activeStateId: ChamberStateId;
  displayProgress: number;
  statusLine: string;
  isReady: boolean;
  isFailed: boolean;
  hasCapture: boolean;
  isPreserving: boolean;
  objectLabel: string;
  sourceImageSrc?: string;
  sourceImageAlt?: string;
  diagnostics: ChamberDiagnosticRow[];
  error?: string;
  reducedMotion?: boolean;
  showNewSource?: boolean;
  onReview: () => void;
  onRetry: () => void;
  onBackToCapture: () => void;
  onReturnToVault: () => void;
  onNewSource: () => void;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

const tickMarks = Array.from({ length: 48 }, (_, index) => index);

const formatStep = (index: number) => `${String(index + 1).padStart(2, "0")} / 06`;

export default function ChamberInstrument({
  states,
  activeStateId,
  displayProgress,
  statusLine,
  isReady,
  isFailed,
  hasCapture,
  isPreserving,
  objectLabel,
  sourceImageSrc,
  sourceImageAlt = "Source evidence",
  diagnostics,
  error,
  reducedMotion = false,
  showNewSource = false,
  onReview,
  onRetry,
  onBackToCapture,
  onReturnToVault,
  onNewSource,
}: ChamberInstrumentProps) {
  const activeState = states.find((state) => state.id === activeStateId) || states[0];
  const progressStyle = {
    "--chamber-progress": displayProgress,
    "--chamber-signal": isReady ? "var(--capsule-gold)" : isFailed ? "var(--capsule-coral)" : "var(--capsule-red)",
  } as CSSProperties;

  return (
    <section
      className={joinClasses(
        "chamber-instrument",
        isReady && "chamber-instrument--ready",
        isFailed && "chamber-instrument--failed",
        reducedMotion && "chamber-instrument--reduced-motion",
      )}
    >
      <ChamberStatusHeader
        objectLabel={objectLabel}
        statusLine={statusLine}
        isReady={isReady}
        isFailed={isFailed}
        onReturnToVault={onReturnToVault}
        onNewSource={onNewSource}
        showNewSource={showNewSource}
      />

      <div className="chamber-console">
        <section className="chamber-dial-zone" aria-label="Preservation chamber instrument">
          <div className="chamber-dial" style={progressStyle}>
            <svg className="chamber-dial__svg" viewBox="0 0 280 280" aria-hidden="true">
              <circle className="chamber-ring chamber-ring--outer" cx="140" cy="140" r="124" />
              <circle className="chamber-ring chamber-ring--calibration" cx="140" cy="140" r="92" />
              <circle className="chamber-ring chamber-ring--inner" cx="140" cy="140" r="54" />
              <circle className="chamber-progress-ring" cx="140" cy="140" r="112" pathLength="100" />
              <line className="chamber-axis" x1="30" y1="140" x2="250" y2="140" />
              <line className="chamber-axis" x1="140" y1="30" x2="140" y2="250" />
              <g className="chamber-ticks">
                {tickMarks.map((tick) => {
                  const major = tick % 4 === 0;
                  return (
                    <line
                      key={tick}
                      className={major ? "chamber-tick chamber-tick--major" : "chamber-tick"}
                      x1="140"
                      y1={major ? "14" : "19"}
                      x2="140"
                      y2={major ? "29" : "25"}
                      transform={`rotate(${tick * 7.5} 140 140)`}
                    />
                  );
                })}
              </g>
              <g className="chamber-sweep">
                <line x1="140" y1="42" x2="140" y2="92" />
              </g>
              <circle className="chamber-core" cx="140" cy="140" r="16" />
              <circle className="chamber-core chamber-core--inner" cx="140" cy="140" r="5" />
            </svg>

            <div className="chamber-evidence-aperture" aria-hidden="true">
              {sourceImageSrc ? (
                <img src={sourceImageSrc} alt="" />
              ) : (
                <span className="chamber-evidence-aperture__empty" />
              )}
            </div>
          </div>

          <div className="chamber-active-state" aria-live="polite">
            <p>{formatStep(activeState.stageIndex)}</p>
            <h2>{hasCapture ? activeState.label : "SOURCE EVIDENCE REQUIRED"}</h2>
            <span>{hasCapture ? activeState.description : "Present source evidence to begin, or return to the Vault."}</span>
          </div>

          <div className="chamber-readiness" data-state={isReady ? "ready" : isFailed ? "failed" : "active"}>
            <span aria-hidden="true" />
            <p>{statusLine}</p>
          </div>
        </section>

        <aside className="chamber-register" aria-label="Preservation chamber state register">
          <ChamberStateStack states={states} activeStateId={activeStateId} />
          <dl className="chamber-diagnostics" aria-label="Source evidence diagnostics">
            {diagnostics.map((row) => (
              <div key={row.label} className="chamber-diagnostics__row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      {isFailed ? (
        <ChamberFailureState error={error} onRetry={onRetry} onBackToCapture={onBackToCapture} />
      ) : (
        <div className="chamber-action-area">
          {!hasCapture ? (
            <div className="chamber-action-grid">
              <button type="button" onClick={onBackToCapture} className="chamber-action chamber-action--primary">
                Preserve Object
              </button>
              <button type="button" onClick={onReturnToVault} className="chamber-action">
                Go to Vault
              </button>
            </div>
          ) : isReady ? (
            <button type="button" onClick={onReview} className="chamber-action chamber-action--primary">
              Review Artifact Record
            </button>
          ) : (
            <button type="button" disabled className="chamber-action chamber-action--primary chamber-action--disabled">
              {isPreserving ? "Record Forming" : "Chamber Preparing"}
            </button>
          )}
        </div>
      )}

      {sourceImageSrc ? <span className="chamber-sr-only">{sourceImageAlt}</span> : null}
    </section>
  );
}
