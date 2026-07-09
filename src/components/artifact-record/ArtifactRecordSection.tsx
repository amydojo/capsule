import type { ReactNode } from "react";
import type { ArtifactDisplayRow } from "./artifactRecordDisplay";

export type ArtifactRecordSectionProps = {
  label: string;
  rows?: ArtifactDisplayRow[];
  children?: ReactNode;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function ArtifactRecordSection({ label, rows = [], children, className }: ArtifactRecordSectionProps) {
  if (!rows.length && !children) return null;

  return (
    <section className={joinClasses("artifact-record-section", className)}>
      <p className="artifact-record-section__label">{label}</p>
      {rows.length > 0 ? (
        <dl className="artifact-record-rows">
          {rows.map((row) => (
            <div key={`${label}-${row.label}`} className="artifact-record-row">
              <dt className="artifact-record-row__label">{row.label}</dt>
              <dd className="artifact-record-row__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </section>
  );
}
