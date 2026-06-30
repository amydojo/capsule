type ContinuityBarProps = {
  value: number;
  segments?: number;
};

export default function ContinuityBar({ value, segments = 12 }: ContinuityBarProps) {
  const activeSegments = Math.round((value / 100) * segments);

  return (
    <div className="flex items-center gap-2" aria-label={`Continuity Score ${value} out of 100`}>
      <div className="grid flex-1 grid-cols-12 gap-1">
        {Array.from({ length: segments }).map((_, index) => (
          <span
            key={index}
            className={`h-2 rounded-full ${index < activeSegments ? "bg-[var(--capsule-blue)]" : "bg-[var(--capsule-line)]"}`}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-[var(--capsule-graphite)]">{value}/100</span>
    </div>
  );
}
