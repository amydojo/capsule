import type { ArtifactDisplayRow } from "./artifactRecordDisplay";

export type ArtifactMetadataRailProps = {
  rows: ArtifactDisplayRow[];
};

export default function ArtifactMetadataRail({ rows }: ArtifactMetadataRailProps) {
  if (!rows.length) return null;

  return (
    <dl className="artifact-record-rail">
      {rows.slice(0, 3).map((row) => (
        <div key={row.label} className="artifact-record-rail__cell">
          <dt className="artifact-record-rail__label">{row.label}</dt>
          <dd className="artifact-record-rail__value">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
