import { Link } from "react-router-dom";
import { ROUTES } from "../constants/navigation";

type ArtifactActionsProps = {
  sealed: boolean;
  onSeal: () => void;
  onAddObservation: () => void;
  onViewTimeline: () => void;
};

export default function ArtifactActions({ sealed, onSeal, onAddObservation, onViewTimeline }: ArtifactActionsProps) {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-3 border-y border-[var(--capsule-line)] py-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <nav aria-label="Artifact navigation" className="grid gap-3 sm:flex sm:flex-wrap">
        <Link to={ROUTES.vault} className="primary-button inline-flex min-h-11 min-w-0 items-center justify-center px-5 py-3 text-sm font-medium">
          Back to Vault
        </Link>
        <Link to={ROUTES.capture} className="secondary-button inline-flex min-h-11 items-center justify-center px-5 py-3 text-sm font-medium">
          Capture Another
        </Link>
        {!sealed && (
          <button onClick={onSeal} className="secondary-button min-h-11 px-5 py-3 text-sm font-medium">
            Seal Fossil
          </button>
        )}
      </nav>
      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <button onClick={onAddObservation} className="secondary-button min-h-11 px-5 py-3 text-sm font-medium">
          Add Observation
        </button>
        <button onClick={onViewTimeline} className="secondary-button min-h-11 px-5 py-3 text-sm font-medium">
          View Timeline
        </button>
      </div>
    </div>
  );
}
