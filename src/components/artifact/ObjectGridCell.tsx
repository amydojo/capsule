export type ObjectGridCellProps = {
  id?: string;
  title?: string;
  imageSrc?: string;
  imageAlt?: string;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

function ObjectGlyph() {
  return (
    <div className="relative h-14 w-16" aria-hidden="true">
      <span className="absolute bottom-1 left-2 h-2 w-12 rounded-[50%] bg-black/12" />
      <span className="absolute bottom-4 left-1 h-6 w-14 rounded-sm border border-black/10 bg-[var(--capsule-printed-bone)]" />
      <span className="absolute bottom-6 left-3 h-3 w-4 rounded-[2px] bg-[var(--capsule-cream)]" />
      <span className="absolute bottom-6 left-8 h-3 w-3 rounded-[2px] bg-[rgba(171,170,166,0.45)]" />
      <span className="absolute bottom-5 right-2 h-4 w-4 rounded-[2px] bg-[rgba(17,16,17,0.86)]" />
    </div>
  );
}

export default function ObjectGridCell({
  id = "CAP-00380",
  title = "Beocord 1900",
  imageSrc,
  imageAlt,
  selected = false,
  onSelect,
  className,
}: ObjectGridCellProps) {
  const content = (
    <article className={joinClasses("min-w-0", className)}>
      <div className={joinClasses("flex aspect-[56/61] items-center justify-center rounded-[10px] border bg-[var(--capsule-paper)]", selected ? "border-[var(--capsule-red)]" : "border-black/[0.045]")}>
        {imageSrc ? <img src={imageSrc} alt={imageAlt || title} className="max-h-[80%] max-w-[82%] object-contain" /> : <ObjectGlyph />}
      </div>
      <p className="mt-3 truncate font-mono text-[0.62rem] text-[var(--capsule-muted)]">{id}</p>
      <h3 className="mt-1 truncate text-sm font-medium text-[var(--capsule-black)]">{title}</h3>
    </article>
  );

  if (!onSelect) return content;

  return (
    <button type="button" onClick={onSelect} className="block min-w-0 text-left">
      {content}
    </button>
  );
}
