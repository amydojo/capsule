import type { ArtifactDisplayRow } from "./artifactRecordDisplay";
import ArtifactRecordSection from "./ArtifactRecordSection";

export type ArtifactEvidenceGridProps = {
  label: string;
  rows: ArtifactDisplayRow[];
  imageSrc?: string | null;
  imageAlt: string;
};

export default function ArtifactEvidenceGrid({ label, rows, imageSrc, imageAlt }: ArtifactEvidenceGridProps) {
  return (
    <ArtifactRecordSection label={label}>
      <div className="artifact-record-evidence-grid">
        <div className="artifact-record-evidence-grid__thumb">
          {imageSrc ? <img src={imageSrc} alt={imageAlt} /> : <span className="h-8 w-10 rounded-sm border border-[var(--capsule-hairline)] bg-[var(--capsule-printed-bone)]" aria-hidden="true" />}
        </div>
        <dl className="artifact-record-rows">
          {rows.map((row) => (
            <div key={`${label}-${row.label}`} className="artifact-record-row">
              <dt className="artifact-record-row__label">{row.label}</dt>
              <dd className="artifact-record-row__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </ArtifactRecordSection>
  );
}
