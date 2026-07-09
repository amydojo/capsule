import type { ArtifactDisplayRow } from "./artifactRecordDisplay";
import ArtifactRecordSection from "./ArtifactRecordSection";

export type ArtifactProvenancePanelProps = {
  label: string;
  rows: ArtifactDisplayRow[];
};

export default function ArtifactProvenancePanel({ label, rows }: ArtifactProvenancePanelProps) {
  return <ArtifactRecordSection label={label} rows={rows} />;
}
