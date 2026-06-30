type ScanChecklistProps = {
  compact?: boolean;
};

const scanItems = [
  ["Geometry", "100%"],
  ["Material", "100%"],
  ["Wear", "86%"],
  ["Pressure Trace", "forming"],
  ["Continuity Mapping", "92%"],
];

export default function ScanChecklist({ compact = false }: ScanChecklistProps) {
  return (
    <div className={`rounded-2xl border border-[var(--capsule-line)] bg-white/62 p-5 shadow-[0_18px_50px_rgba(23,25,24,0.06)] ${compact ? "w-full" : ""}`}>
      <p className="mono-label mb-4 text-[0.68rem] text-[var(--capsule-ash)]">Scan Checklist</p>
      <div className="space-y-3">
        {scanItems.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-[var(--capsule-ash)]">{label}</span>
            <span className="font-mono text-xs text-[var(--capsule-graphite)]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
