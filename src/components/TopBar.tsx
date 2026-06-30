import { Link } from "react-router-dom";

type TopBarProps = {
  fossilId?: string;
};

export default function TopBar({ fossilId = "CF-00381" }: TopBarProps) {
  return (
    <header className="mx-auto flex w-full max-w-[92rem] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
      <Link to="/chamber" className="group flex items-baseline gap-3" aria-label="Capsule Preservation Chamber">
        <span className="text-[1.16rem] font-bold uppercase tracking-[0.22em] text-[var(--capsule-graphite)]">
          Capsule
        </span>
        <span className="hidden text-xs font-medium text-[var(--capsule-ash)] sm:inline">Object Continuity System</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="mono-label rounded-full border border-[rgba(229,226,220,0.82)] bg-white/54 px-3.5 py-1.5 text-[0.66rem] text-[var(--capsule-graphite)] shadow-[0_8px_24px_rgba(23,25,28,0.035)]">
          {fossilId}
        </span>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(229,226,220,0.82)] bg-white/54 text-[var(--capsule-ash)] transition hover:border-[rgba(23,25,28,0.18)] hover:text-[var(--capsule-graphite)]"
          aria-label="Open Capsule menu"
        >
          <span className="mb-1 text-xl leading-none">...</span>
        </button>
      </div>
    </header>
  );
}
