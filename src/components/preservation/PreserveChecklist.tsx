export type PreserveChecklistStatus = "complete" | "progress" | "pending";

export type PreserveChecklistItem = {
  label: string;
  status: PreserveChecklistStatus;
};

export type PreserveChecklistProps = {
  title?: string;
  objectName?: string;
  items?: PreserveChecklistItem[];
  className?: string;
};

const defaultItems: PreserveChecklistItem[] = [
  { label: "Shape", status: "complete" },
  { label: "Materials", status: "complete" },
  { label: "Details", status: "complete" },
  { label: "Context", status: "progress" },
  { label: "Audio signature", status: "pending" },
];

const statusCopy: Record<PreserveChecklistStatus, string> = {
  complete: "Complete",
  progress: "In progress",
  pending: "Pending",
};

const statusTone: Record<PreserveChecklistStatus, string> = {
  complete: "border-[var(--capsule-green)] bg-[var(--capsule-green)]",
  progress: "border-[var(--capsule-coral)] bg-[var(--capsule-coral)]",
  pending: "border-white/18 bg-transparent",
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function PreserveChecklist({ title = "Preserve", objectName = "Beocord 1900", items = defaultItems, className }: PreserveChecklistProps) {
  return (
    <section className={joinClasses("capsule-mode-preservation rounded-[var(--capsule-radius-panel)] p-6", className)}>
      <p className="mono-label text-[0.58rem] text-white">{title}</p>
      <h3 className="mt-3 text-2xl font-medium text-white">{objectName}</h3>
      <ul className="mt-6">
        {items.map((item) => (
          <li key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-white/[0.08] py-4 last:border-0">
            <span className="flex min-w-0 items-center gap-3 text-sm text-white">
              <span className={joinClasses("h-3 w-3 shrink-0 rounded-full border", statusTone[item.status])} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </span>
            <span className={joinClasses("font-mono text-xs", item.status === "pending" ? "text-[var(--capsule-linen-ash)]" : "text-white")}>{statusCopy[item.status]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
