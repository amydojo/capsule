export type DiagnosticsTone = "stable" | "warning" | "reveal";

export type DiagnosticsRow = {
  label: string;
  value: string;
  tone?: DiagnosticsTone;
};

export type DiagnosticsPanelProps = {
  title?: string;
  rows?: DiagnosticsRow[];
  className?: string;
};

const defaultRows: DiagnosticsRow[] = [
  { label: "Render pipeline", value: "artifactRenderDataUrl", tone: "reveal" },
  { label: "Isolation", value: "manual", tone: "stable" },
  { label: "Pristine", value: "unavailable", tone: "warning" },
  { label: "Storage", value: "indexeddb-v1", tone: "stable" },
];

const toneClasses: Record<DiagnosticsTone, string> = {
  stable: "bg-[var(--capsule-green)]",
  warning: "bg-[var(--capsule-red)]",
  reveal: "bg-[var(--capsule-gold)]",
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function DiagnosticsPanel({ title = "Diagnostics", rows = defaultRows, className }: DiagnosticsPanelProps) {
  return (
    <section className={joinClasses("capsule-surface-paper p-5", className)}>
      <p className="mono-label text-[0.58rem] text-[var(--capsule-red)]">{title}</p>
      <dl className="mt-5">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_minmax(6rem,auto)] items-center gap-4 border-b border-[rgba(216,207,192,0.75)] py-4 last:border-0">
            <dt className="flex min-w-0 items-center gap-3 text-sm text-[var(--capsule-black)]">
              <span className={joinClasses("h-1.5 w-1.5 shrink-0 rounded-full", toneClasses[row.tone ?? "stable"])} aria-hidden="true" />
              <span className="truncate">{row.label}</span>
            </dt>
            <dd className="truncate text-right font-mono text-xs text-[var(--capsule-muted)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
