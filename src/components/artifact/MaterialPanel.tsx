export type MaterialSwatch = {
  name: string;
  value: string;
  color: string;
};

export type MaterialPanelProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  swatches?: MaterialSwatch[];
  className?: string;
};

const defaultSwatches: MaterialSwatch[] = [
  { name: "Black", value: "#111011", color: "var(--capsule-black)" },
  { name: "Red", value: "#983931", color: "var(--capsule-red)" },
  { name: "Gold", value: "#DCBC91", color: "var(--capsule-gold)" },
  { name: "Aura", value: "#43515A", color: "var(--capsule-blue-gray)" },
];

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function MaterialPanel({
  title = "Aluminum",
  subtitle = "Anodized",
  description = "Brushed aluminum chassis with bead blasted surface treatment.",
  swatches = defaultSwatches,
  className,
}: MaterialPanelProps) {
  return (
    <section className={joinClasses("capsule-surface-paper overflow-hidden", className)}>
      <div className="grid h-36 grid-cols-4 border-b border-black/10">
        {swatches.map((swatch) => (
          <div key={swatch.name} className="border-r border-white/20 last:border-r-0" style={{ background: swatch.color }} aria-label={`${swatch.name} ${swatch.value}`} />
        ))}
      </div>
      <div className="p-5">
        <p className="mono-label text-[0.56rem] text-[var(--capsule-muted)]">{subtitle}</p>
        <h3 className="mt-2 text-2xl font-medium text-[var(--capsule-black)]">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--capsule-muted)]">{description}</p>
      </div>
    </section>
  );
}
