import type { ReactNode } from "react";

export type CapsuleArchiveSlipRowObject = {
  label: string;
  value: ReactNode;
};

export type CapsuleArchiveSlipRow = CapsuleArchiveSlipRowObject | readonly [string, ReactNode];

export type CapsuleArchiveSlipMode = "archive" | "preservation";

export type CapsuleArchiveSlipProps = {
  eyebrow?: string;
  title?: string;
  rows?: CapsuleArchiveSlipRow[];
  mode?: CapsuleArchiveSlipMode;
  children?: ReactNode;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function CapsuleArchiveSlip({ eyebrow, title, rows = [], mode = "archive", children, className }: CapsuleArchiveSlipProps) {
  const preservation = mode === "preservation";

  return (
    <section
      className={joinClasses(
        "rounded-[var(--capsule-radius-panel)] border p-4",
        preservation ? "border-white/10 bg-white/[0.045] text-white" : "border-[rgba(17,16,17,0.08)] bg-[var(--capsule-paper)] text-[var(--capsule-black)]",
        className,
      )}
    >
      {eyebrow && <p className={joinClasses("mono-label text-[0.48rem] leading-none", preservation ? "text-[var(--capsule-linen-ash)]" : "text-[var(--capsule-red)]")}>{eyebrow}</p>}
      {title && <h2 className={joinClasses("mt-3 text-[1.08rem] font-medium leading-tight", preservation ? "text-white" : "text-[var(--capsule-black)]")}>{title}</h2>}
      {rows.length > 0 && (
        <dl className="mt-4">
          {rows.map((row) => {
            const label = "label" in row ? row.label : row[0];
            const value = "value" in row ? row.value : row[1];

            return (
              <div key={label} className={joinClasses("grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b py-2.5 last:border-b-0", preservation ? "border-white/10" : "border-[rgba(17,16,17,0.08)]")}>
                <dt className={joinClasses("mono-label text-[0.46rem]", preservation ? "text-[var(--capsule-linen-ash)]" : "text-[var(--capsule-muted)]")}>{label}</dt>
                <dd className={joinClasses("capsule-archive-slip__value max-w-[8.5rem] truncate text-right font-mono text-[0.58rem]", preservation ? "text-white" : "text-[var(--capsule-black)]")}>{value}</dd>
              </div>
            );
          })}
        </dl>
      )}
      {children}
    </section>
  );
}
