type ContinuityBarProps = {
  value: number;
  segments?: number;
  tone?: "light" | "dark";
};

export default function ContinuityBar({ value, segments = 12, tone = "light" }: ContinuityBarProps) {
  const activeSegments = Math.round((value / 100) * segments);
  const inactiveTone = tone === "dark" ? "bg-[var(--capsule-line-dark)]" : "bg-[var(--capsule-paper-line)]";
  const textTone = tone === "dark" ? "text-[var(--capsule-bone)]" : "text-[var(--capsule-graphite)]";

  return (
    <div className="flex items-center gap-2" aria-label={`Continuity Score ${value} out of 100`}>
      <div className="grid flex-1 grid-cols-12 gap-1">
        {Array.from({ length: segments }).map((_, index) => (
          <span
            key={index}
            className={`h-2 rounded-full ${index < activeSegments ? "bg-[var(--capsule-spectrum-indigo-bright)]" : inactiveTone}`}
          />
        ))}
      </div>
      <span className={`font-mono text-xs ${textTone}`}>{value}/100</span>
    </div>
  );
}
