import { Link } from "react-router-dom";

type TopBarProps = {
  fossilId?: string;
};

export default function TopBar({ fossilId = "CF-00381" }: TopBarProps) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <Link to="/chamber" className="group flex items-baseline gap-3" aria-label="Capsule Preservation Chamber">
        <span className="text-[1.05rem] font-semibold uppercase tracking-[0.18em] text-[var(--capsule-graphite)]">
          Capsule
        </span>
        <span className="hidden text-xs text-[var(--capsule-ash)] sm:inline">Object Continuity System</span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="mono-label rounded-full border border-[var(--capsule-line)] bg-white/50 px-3 py-1.5 text-[0.68rem] text-[var(--capsule-graphite)]">
          {fossilId}
        </span>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--capsule-line)] bg-white/50 text-[var(--capsule-ash)] transition hover:border-[var(--capsule-ash)] hover:text-[var(--capsule-graphite)]"
          aria-label="Open Capsule menu"
        >
          <span className="mb-1 text-xl leading-none">...</span>
        </button>
      </div>
    </header>
  );
}
