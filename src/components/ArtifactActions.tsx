type ArtifactActionsProps = {
  sealed: boolean;
  onSeal: () => void;
};

export default function ArtifactActions({ sealed, onSeal }: ArtifactActionsProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-wrap gap-3 pt-6">
      <button className="rounded-full border border-[var(--capsule-line)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--capsule-graphite)] transition hover:border-[var(--capsule-ash)]">
        Add Observation
      </button>
      <button className="rounded-full border border-[var(--capsule-line)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--capsule-graphite)] transition hover:border-[var(--capsule-ash)]">
        View Timeline
      </button>
      <button
        onClick={onSeal}
        className="rounded-full bg-[var(--capsule-graphite)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(23,25,24,0.16)] transition hover:translate-y-[-1px]"
      >
        {sealed ? "Sealed" : "Seal Fossil"}
      </button>
    </div>
  );
}
