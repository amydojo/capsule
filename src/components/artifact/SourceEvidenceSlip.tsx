import ObjectCataloguePlate from "./ObjectCataloguePlate";

export type SourceEvidenceMetric = {
  label: string;
  value: string;
};

export type SourceEvidenceSlipProps = {
  title?: string;
  sourceImageSrc?: string;
  sourceImageAlt?: string;
  metrics?: SourceEvidenceMetric[];
  verified?: boolean;
  className?: string;
};

const defaultMetrics: SourceEvidenceMetric[] = [
  { label: "Captured", value: "Jul 02 2026" },
  { label: "Compression", value: "1600px / .82" },
  { label: "Storage", value: "indexeddb-v1" },
];

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function SourceEvidenceSlip({
  title = "Source retained as evidence",
  sourceImageSrc,
  sourceImageAlt = "Source evidence",
  metrics = defaultMetrics,
  verified = true,
  className,
}: SourceEvidenceSlipProps) {
  return (
    <section className={joinClasses("capsule-surface-paper overflow-hidden p-0", className)}>
      <header className="flex items-center justify-between gap-4 rounded-t-[inherit] border-b border-black/10 bg-[var(--capsule-paper)] px-5 py-3">
        <p className="mono-label text-[0.56rem] text-[var(--capsule-red)]">{title}</p>
        {verified && <span className="h-2 w-2 rounded-full bg-[var(--capsule-green)]" aria-label="Verified" />}
      </header>
      <div className="grid gap-5 p-5 sm:grid-cols-[12rem_1fr]">
        <ObjectCataloguePlate imageSrc={sourceImageSrc} imageAlt={sourceImageAlt} label="Source frame" className="min-h-44" />
        <dl className="grid content-start gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[rgba(17,16,17,0.08)] pb-3 last:border-0">
              <dt className="text-sm text-[var(--capsule-muted)]">{metric.label}</dt>
              <dd className="font-mono text-xs text-[var(--capsule-black)]">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
