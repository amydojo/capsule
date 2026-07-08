export type TimelineItem = {
  year: string;
  label: string;
  highlight?: boolean;
};

export type TimelineItemStackProps = {
  items?: TimelineItem[];
  className?: string;
};

const defaultItems: TimelineItem[] = [
  { year: "1971", label: "Designed by Peter Bang & Olufsen" },
  { year: "1973", label: "Featured in Stern Magazine" },
  { year: "2025", label: "Preserved in Capsule", highlight: true },
];

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function TimelineItemStack({ items = defaultItems, className }: TimelineItemStackProps) {
  return (
    <ol className={joinClasses("relative space-y-8 pl-12", className)}>
      <span className="absolute left-4 top-2 h-[calc(100%-1rem)] w-px bg-[rgba(17,16,17,0.3)]" aria-hidden="true" />
      {items.map((item) => (
        <li key={`${item.year}-${item.label}`} className="relative">
          <span className={joinClasses("absolute -left-[2.15rem] top-1 h-2 w-2 rounded-full", item.highlight ? "bg-[var(--capsule-red)]" : "bg-[var(--capsule-black)]")} aria-hidden="true" />
          <p className="font-mono text-xs text-[var(--capsule-black)]">{item.year}</p>
          <p className="mt-2 max-w-44 whitespace-pre-line text-sm leading-5 text-[var(--capsule-black)]">{item.label}</p>
        </li>
      ))}
    </ol>
  );
}
