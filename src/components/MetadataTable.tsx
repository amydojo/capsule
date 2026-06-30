import type { Artifact } from "../types/artifact";
import ContinuityBar from "./ContinuityBar";

type MetadataTableProps = {
  artifact: Artifact;
  preservationState?: string;
};

export default function MetadataTable({ artifact, preservationState = artifact.preservationState }: MetadataTableProps) {
  const rows = [
    ["Classification", artifact.classification],
    ["Capture Point", artifact.capturePoint],
    ["Origin", artifact.origin],
    ["Material", artifact.material.join(", ")],
    ["Condition", artifact.condition],
  ];

  return (
    <section className="mx-auto w-full max-w-4xl border-t border-[var(--capsule-line)]">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-3 border-b border-[var(--capsule-line)] py-5 sm:grid-cols-[13rem_1fr]">
          <dt className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">{label}</dt>
          <dd className="text-[0.95rem] text-[var(--capsule-graphite)]">{value}</dd>
        </div>
      ))}
      <div className="grid gap-3 border-b border-[var(--capsule-line)] py-5 sm:grid-cols-[13rem_1fr]">
        <dt className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Continuity Score</dt>
        <dd><ContinuityBar value={artifact.continuityScore} /></dd>
      </div>
      <div className="grid gap-3 border-b border-[var(--capsule-line)] py-5 sm:grid-cols-[13rem_1fr]">
        <dt className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Preservation State</dt>
        <dd className="flex items-center gap-2 text-[0.95rem] text-[var(--capsule-graphite)]">
          <span className="h-2 w-2 rounded-full bg-[var(--capsule-blue)]" />
          {preservationState}
        </dd>
      </div>
    </section>
  );
}
