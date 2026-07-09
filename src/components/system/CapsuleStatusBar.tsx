export type CapsuleStatusBarMode = "archive" | "preservation";

export type CapsuleStatusBarProps = {
  mode?: CapsuleStatusBarMode;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function CapsuleStatusBar({ mode = "archive", className }: CapsuleStatusBarProps) {
  const preservation = mode === "preservation";

  return (
    <div
      className={joinClasses(
        "capsule-status-bar flex h-10 shrink-0 items-center justify-between px-[22px] pt-2 text-[0.56rem] font-semibold tracking-[0.01em]",
        preservation ? "text-white" : "text-[var(--capsule-black)]",
        className,
      )}
      aria-hidden="true"
    >
      <span>9:41</span>
      <span className="flex items-center gap-2">
        <span className={joinClasses("h-1 w-5 rounded-full", preservation ? "bg-white/72" : "bg-[var(--capsule-black)]/72")} />
        <span className={joinClasses("h-2 w-3 rounded-sm border", preservation ? "border-white/64" : "border-[var(--capsule-black)]/64")} />
      </span>
    </div>
  );
}
