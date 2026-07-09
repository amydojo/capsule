export type ArtifactIdentityBlockProps = {
  title: string;
  preservedLabel: string;
  stateLabel: string;
};

export default function ArtifactIdentityBlock({ title, preservedLabel, stateLabel }: ArtifactIdentityBlockProps) {
  return (
    <section className="artifact-record-identity">
      <div className="artifact-record-title-row">
        <h1 className="artifact-record-title">{title}</h1>
        <span className="artifact-record-state">{stateLabel}</span>
      </div>
      <p className="artifact-record-subline">PRESERVED / {preservedLabel}</p>
    </section>
  );
}
