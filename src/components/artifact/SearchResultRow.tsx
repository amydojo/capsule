export type SearchResult = {
  label: string;
  meta: string;
};

export type SearchResultRowProps = {
  eyebrow?: string;
  results?: SearchResult[];
  onSelect?: (result: SearchResult) => void;
  className?: string;
};

const defaultResults: SearchResult[] = [
  { label: "Audio recordings", meta: "12 objects" },
  { label: "Design objects", meta: "34 objects" },
  { label: "Documents", meta: "8 objects" },
];

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function SearchResultRow({ eyebrow = "Suggested", results = defaultResults, onSelect, className }: SearchResultRowProps) {
  return (
    <section className={joinClasses("capsule-mode-archive rounded-[var(--capsule-radius-panel)] p-5", className)}>
      <p className="mono-label text-[0.56rem] text-[var(--capsule-muted)]">{eyebrow}</p>
      <div className="mt-5 grid gap-1">
        {results.map((result) => (
          <button
            key={result.label}
            type="button"
            onClick={() => onSelect?.(result)}
            className="grid min-h-12 grid-cols-[2rem_minmax(0,1fr)_1rem] items-center gap-4 rounded-xl text-left transition hover:bg-[var(--capsule-paper)]"
          >
            <span className="h-8 w-8 rounded-full bg-[var(--capsule-paper)]" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--capsule-black)]">{result.label}</span>
              <span className="block truncate text-xs text-[var(--capsule-muted)]">{result.meta}</span>
            </span>
            <span className="text-lg text-[var(--capsule-muted)]" aria-hidden="true">
              &rsaquo;
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
