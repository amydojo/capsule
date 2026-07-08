import ObjectCataloguePlate from "./ObjectCataloguePlate";

export type ArtifactRecordMeta = {
  label: string;
  value: string;
};

export type ArtifactRecordCardProps = {
  id?: string;
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  status?: string;
  continuity?: number;
  metadata?: ArtifactRecordMeta[];
  onOpen?: () => void;
  className?: string;
};

const defaultMetadata: ArtifactRecordMeta[] = [
  { label: "Captured", value: "Jul 02 2026" },
  { label: "State", value: "active" },
];

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function ArtifactRecordCard({
  id = "CAP-00380",
  title = "Beocord 1900",
  description = "Preserved object record with source evidence retained.",
  imageSrc,
  imageAlt,
  status = "active",
  continuity = 82,
  metadata = defaultMetadata,
  onOpen,
  className,
}: ArtifactRecordCardProps) {
  const clampedContinuity = Math.max(0, Math.min(100, continuity));
  const content = (
    <article className={joinClasses("capsule-surface-paper grid gap-5 p-4 sm:grid-cols-[14rem_1fr]", className)}>
      <ObjectCataloguePlate imageSrc={imageSrc} imageAlt={imageAlt || title} label={id} className="min-h-48" />
      <div className="flex min-w-0 flex-col justify-between gap-5">
        <div>
          <p className="mono-label text-[0.56rem] text-[var(--capsule-muted)]">{id}</p>
          <h3 className="mt-2 text-2xl font-medium leading-tight text-[var(--capsule-black)]">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--capsule-muted)]">{description}</p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {metadata.map((item) => (
            <div key={item.label}>
              <dt className="mono-label text-[0.54rem] text-[var(--capsule-muted)]">{item.label}</dt>
              <dd className="mt-1 text-sm text-[var(--capsule-black)]">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="mono-label text-[0.54rem] text-[var(--capsule-muted)]">Continuity</span>
            <span className="font-mono text-xs text-[var(--capsule-black)]">{clampedContinuity}%</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-[rgba(17,16,17,0.1)]">
            <div className="h-full rounded-full bg-[var(--capsule-red)]" style={{ width: `${clampedContinuity}%` }} />
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-[var(--capsule-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--capsule-green)]" aria-hidden="true" />
            {status}
          </p>
        </div>
      </div>
    </article>
  );

  if (!onOpen) return content;

  return (
    <button type="button" onClick={onOpen} className="block w-full text-left">
      {content}
    </button>
  );
}
