import type { ChamberState, ChamberStateId, ChamberSemanticStatus } from "./chamberStateMachine";

export type ChamberStateStackProps = {
  states: ChamberState[];
  activeStateId: ChamberStateId;
  className?: string;
};

const statusCopy: Record<ChamberSemanticStatus, string> = {
  pending: "pending",
  active: "active",
  complete: "complete",
  ready: "ready",
  failed: "interrupted",
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

const formatStep = (index: number) => String(index + 1).padStart(2, "0");

export default function ChamberStateStack({ states, activeStateId, className }: ChamberStateStackProps) {
  return (
    <ol className={joinClasses("chamber-state-stack", className)} aria-label="Preservation chamber state sequence">
      {states.map((state) => {
        const active = state.id === activeStateId;

        return (
          <li
            key={state.id}
            className="chamber-state-row"
            data-status={state.semanticStatus}
            aria-current={active ? "step" : undefined}
          >
            <span className="chamber-state-row__marker" aria-hidden="true" />
            <div className="chamber-state-row__copy">
              <p className="chamber-state-row__step">{formatStep(state.stageIndex)}</p>
              <h3>{state.label}</h3>
              <p>{state.description}</p>
            </div>
            <span className="chamber-state-row__status">{statusCopy[state.semanticStatus]}</span>
          </li>
        );
      })}
    </ol>
  );
}
