type ArtifactActionsProps = {
  sealed: boolean;
  onSeal: () => void;
  onAddObservation: () => void;
  onViewTimeline: () => void;
};

export default function ArtifactActions({ sealed, onSeal, onAddObservation, onViewTimeline }: ArtifactActionsProps) {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-3 pt-7 sm:flex sm:flex-wrap">
      <button onClick={onAddObservation} className="secondary-button min-h-11 px-5 py-3 text-sm font-medium">
        Add Observation
      </button>
      <button onClick={onViewTimeline} className="secondary-button min-h-11 px-5 py-3 text-sm font-medium">
        View Timeline
      </button>
      <button
        onClick={onSeal}
        disabled={sealed}
        className="primary-button min-h-11 min-w-0 px-5 py-3 text-sm font-medium"
      >
        {sealed ? "Sealed" : "Seal Fossil"}
      </button>
    </div>
  );
}
