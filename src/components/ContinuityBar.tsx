type ContinuityBarProps = {
  value: number;
  tone?: "light" | "dark";
};

export default function ContinuityBar({ value, tone = "light" }: ContinuityBarProps) {
  const inactiveTone = tone === "dark" ? "bg-[var(--capsule-line-dark)]" : "bg-[var(--capsule-paper-line)]";
  const textTone = tone === "dark" ? "text-[var(--capsule-bone)]" : "text-[var(--capsule-graphite)]";

  return (
    <div className="flex items-center gap-2" aria-label={`Continuity ${value} out of 100`}>
      <div className={`h-px flex-1 overflow-hidden rounded-full ${inactiveTone}`}>
        <div className="h-full rounded-full bg-[var(--capsule-spectrum-indigo-bright)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className={`font-mono text-xs ${textTone}`}>{value}/100</span>
    </div>
  );
}
