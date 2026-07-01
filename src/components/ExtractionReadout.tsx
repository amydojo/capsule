import type { ExtractionMethod } from "../types/extraction";

type ExtractionReadoutProps = {
  confidence: number;
  method?: ExtractionMethod;
  sourceRetained?: boolean;
  boundaryLocked?: boolean;
  compact?: boolean;
};

const methodLabel = (method: ExtractionMethod = "manual-object-field") => {
  if (method === "manual-object-field") return "MANUAL";
  if (method === "assisted-object-field") return "ASSISTED";
  if (method === "simulated-isolation") return "SIMULATED";
  return "FALLBACK";
};

export default function ExtractionReadout({
  confidence,
  method = "manual-object-field",
  sourceRetained = true,
  boundaryLocked = true,
  compact = false,
}: ExtractionReadoutProps) {
  const stability = `${Math.round(confidence * 100)}%`;
  const rows = [
    ["FIELD STABILITY", stability],
    ["SOURCE", sourceRetained ? "RETAINED" : "PENDING"],
    ["BOUNDARY", boundaryLocked ? "LOCKED" : "SEARCHING"],
    ["ISOLATION", methodLabel(method)],
  ];

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/12 bg-white/[0.055] px-3 py-2.5 backdrop-blur">
          <p className="mono-label text-[0.52rem] text-white/42">{label}</p>
          <p className="mt-1 font-mono text-[0.76rem] text-white/82">{value}</p>
        </div>
      ))}
    </div>
  );
}
