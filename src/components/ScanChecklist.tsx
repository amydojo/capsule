type ScanChecklistProps = {
  compact?: boolean;
  status?: "idle" | "preserving" | "done";
};

type ScanStatus = NonNullable<ScanChecklistProps["status"]>;

const scanItems: Array<{ label: string; values: Record<ScanStatus, number>; text: Record<ScanStatus, string> }> = [
  { label: "Geometry", values: { idle: 68, preserving: 100, done: 100 }, text: { idle: "68%", preserving: "100%", done: "100%" } },
  { label: "Material", values: { idle: 34, preserving: 82, done: 100 }, text: { idle: "34%", preserving: "82%", done: "100%" } },
  { label: "Wear", values: { idle: 12, preserving: 64, done: 86 }, text: { idle: "queued", preserving: "64%", done: "86%" } },
  { label: "Pressure Trace", values: { idle: 18, preserving: 72, done: 92 }, text: { idle: "dormant", preserving: "forming", done: "formed" } },
  { label: "Continuity Mapping", values: { idle: 8, preserving: 66, done: 92 }, text: { idle: "queued", preserving: "66%", done: "92%" } },
];

export default function ScanChecklist({ compact = false, status = "idle" }: ScanChecklistProps) {
  return (
    <div className={`instrument-panel rounded-2xl p-5 ${compact ? "w-full" : ""}`}>
      <p className="mono-label mb-5 text-[0.62rem] text-[var(--capsule-ash)]">Scan Checklist</p>
      <div className="space-y-4">
        {scanItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-[var(--capsule-ash)]">{item.label}</span>
              <span className="font-mono text-[0.68rem] text-[var(--capsule-graphite)]">{item.text[status]}</span>
            </div>
            <div className="h-px w-full bg-[rgba(229,226,220,0.8)]">
              <div
                className="h-px bg-[var(--capsule-blue)] transition-all duration-700 ease-out"
                style={{ width: `${item.values[status]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
