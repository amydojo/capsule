export type SettingsRowItem = {
  label: string;
  value?: string;
  onSelect?: () => void;
};

export type SettingsRowProps = {
  items?: SettingsRowItem[];
  className?: string;
};

const defaultItems: SettingsRowItem[] = [
  { label: "Account" },
  { label: "iCloud Sync", value: "On" },
  { label: "Haptics", value: "On" },
  { label: "Appearance", value: "System" },
];

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function SettingsRow({ items = defaultItems, className }: SettingsRowProps) {
  return (
    <div className={joinClasses("capsule-mode-archive rounded-[var(--capsule-radius-panel)] px-5", className)}>
      {items.map((item) => {
        const interactive = Boolean(item.onSelect);
        const row = (
          <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[rgba(216,207,192,0.72)] py-3 last:border-0">
            <span className="truncate text-sm text-[var(--capsule-black)]">{item.label}</span>
            <span className="truncate text-right text-sm text-[var(--capsule-muted)]">{item.value || (interactive ? "\u203A" : "")}</span>
          </div>
        );

        return interactive ? (
          <button key={item.label} type="button" onClick={item.onSelect} className="block w-full text-left">
            {row}
          </button>
        ) : (
          <div key={item.label}>{row}</div>
        );
      })}
    </div>
  );
}
