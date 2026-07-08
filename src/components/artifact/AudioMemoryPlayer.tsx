export type AudioMemoryPlayerProps = {
  title?: string;
  currentTime?: string;
  remainingTime?: string;
  progress?: number;
  isPlaying?: boolean;
  onToggle?: () => void;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function AudioMemoryPlayer({
  title = "Interview with\nJorgen Rasmussen\nLondon, 1971",
  currentTime = "12:34",
  remainingTime = "-28:16",
  progress = 42,
  isPlaying = true,
  onToggle,
  className,
}: AudioMemoryPlayerProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <section className={joinClasses("capsule-mode-preservation rounded-[var(--capsule-radius-panel)] p-6", className)}>
      <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-[18px] border border-white/10 bg-[var(--capsule-chapel)]">
        <div className="relative h-32 w-32 rounded-full border border-[rgba(171,170,166,0.14)]">
          {Array.from({ length: 28 }, (_, index) => (
            <span
              key={index}
              className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[rgba(171,170,166,0.42)]"
              style={{ transform: `rotate(${index * 12.86}deg) translateY(-4rem)` }}
              aria-hidden="true"
            />
          ))}
          <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[var(--capsule-red)]" />
        </div>
      </div>
      <h3 className="mt-6 whitespace-pre-line text-2xl font-medium leading-tight text-white">{title}</h3>
      <div className="mt-7">
        <div className="h-px rounded-full bg-[rgba(171,170,166,0.17)]">
          <div className="h-[3px] -translate-y-px rounded-full bg-[var(--capsule-red)]" style={{ width: `${clampedProgress}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between font-mono text-xs text-[var(--capsule-linen-ash)]">
          <span>{currentTime}</span>
          <span>{remainingTime}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/[0.055] text-2xl text-white"
        aria-label={isPlaying ? "Pause audio memory" : "Play audio memory"}
      >
        {isPlaying ? "II" : "Play"}
      </button>
    </section>
  );
}
