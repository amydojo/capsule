import type { Artifact } from "../types/artifact";
import { normalizeArtifactRecord } from "../utils/artifactRecord";
import ContinuityBar from "./ContinuityBar";

type MetadataTableProps = {
  artifact: Artifact;
  preservationState?: string;
};

export default function MetadataTable({ artifact, preservationState = artifact.preservationState }: MetadataTableProps) {
  const record = normalizeArtifactRecord(artifact);
  const extractionLabel = artifact.extraction
    ? artifact.extraction.method === "manual-object-field"
      ? `manual object field / ${Math.round(artifact.extraction.confidence * 100)}%`
      : artifact.extraction.method === "assisted-object-field"
        ? `assisted object field / ${Math.round(artifact.extraction.confidence * 100)}%`
      : artifact.extraction.method === "simulated-isolation"
        ? `simulated isolation / ${Math.round(artifact.extraction.confidence * 100)}%`
        : "field preserved"
    : undefined;

  const materialTags = record.observedFacts.materialTags.join(", ") || "not classified";
  const rows: Array<[string, string]> = [
    ["Classification", record.interpretiveLayer.artifactClass],
    ["Object Label", record.observedFacts.objectLabel],
    ...(record.identity.userGivenName ? ([["Object Name", record.identity.userGivenName]] as Array<[string, string]>) : []),
    ["Material", materialTags],
    ["Origin", record.source.origin || "not recorded"],
    ...(record.identity.collection ? ([["Collection", record.identity.collection]] as Array<[string, string]>) : []),
    ...(record.source.userNote ? ([["Why Keep It", record.source.userNote]] as Array<[string, string]>) : []),
    ["Source Evidence Date", artifact.capturePoint],
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
        <dt className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Continuity</dt>
        <dd><ContinuityBar value={artifact.continuityScore} /></dd>
      </div>
      <div className="grid gap-3 border-b border-[var(--capsule-line)] py-5 sm:grid-cols-[13rem_1fr]">
        <dt className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Preservation State</dt>
        <dd className="flex items-center gap-2 text-[0.95rem] text-[var(--capsule-graphite)]">
          <span className="h-2 w-2 rounded-full bg-[var(--capsule-mineral-olive)]" />
          {preservationState}
        </dd>
      </div>
      {extractionLabel && (
        <div className="grid gap-3 border-b border-[var(--capsule-line)] py-5 sm:grid-cols-[13rem_1fr]">
          <dt className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Object Field</dt>
          <dd className="text-[0.95rem] text-[var(--capsule-graphite)]">{extractionLabel}</dd>
        </div>
      )}
    </section>
  );
}
