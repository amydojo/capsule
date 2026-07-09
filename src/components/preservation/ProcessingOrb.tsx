export type ProcessingOrbProps = {
  label?: string;
  progress?: number;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function ProcessingOrb({ label = "Observed facts forming", progress = 72, className }: ProcessingOrbProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <section className={joinClasses("capsule-mode-preservation rounded-[var(--capsule-radius-panel)] p-6 text-center", className)}>
      <p className="mono-label text-[0.58rem] text-[var(--capsule-linen-ash)]">Preservation chamber</p>
      <h3 className="mt-3 text-2xl font-medium text-white">{label}</h3>
      <div className="relative mx-auto mt-7 grid h-52 w-52 place-items-center rounded-[18px] border border-white/[0.08] bg-[var(--capsule-black)]">
        <div className="relative h-32 w-32 rounded-full border border-[rgba(171,170,166,0.12)]">
          {Array.from({ length: 36 }, (_, index) => (
            <span
              key={index}
              className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[rgba(171,170,166,0.42)]"
              style={{ transform: `rotate(${index * 10}deg) translateY(-4.15rem)` }}
              aria-hidden="true"
            />
          ))}
          <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[var(--capsule-red)]" />
          <span className="absolute left-1/2 top-1/2 h-px w-32 -translate-x-1/2 bg-[rgba(171,170,166,0.17)]" />
          <span className="absolute left-1/2 top-1/2 h-32 w-px -translate-y-1/2 bg-[rgba(171,170,166,0.17)]" />
        </div>
      </div>
      <p className="mt-6 font-mono text-sm text-white">{clampedProgress}%</p>
      <div className="mx-auto mt-3 h-1 max-w-40 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[var(--capsule-red)]" style={{ width: `${clampedProgress}%` }} />
      </div>
    </section>
  );
}
