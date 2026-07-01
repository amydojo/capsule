import { Link } from "react-router-dom";

type TopBarProps = {
  fossilId?: string;
  tone?: "light" | "dark";
  contextLabel?: string;
};

export default function TopBar({ fossilId = "CF-00381", tone = "light", contextLabel = "Object Continuity System" }: TopBarProps) {
  const dark = tone === "dark";

  return (
    <header className="mx-auto flex w-full max-w-[92rem] items-center justify-between px-4 py-5 sm:px-8 lg:px-10">
      <Link to="/chamber" className="group flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3" aria-label="Capsule Preservation Chamber">
        <span className={`text-[1.08rem] font-semibold uppercase tracking-[0.28em] ${dark ? "text-[var(--capsule-bone)]" : "text-[var(--capsule-graphite)]"}`}>
          Capsule
        </span>
        <span className={`text-[0.62rem] font-medium sm:text-xs ${dark ? "text-[var(--capsule-ash-dim)]" : "text-[var(--capsule-ash)]"}`}>{contextLabel}</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className={`mono-label rounded-full border px-3.5 py-1.5 text-[0.6rem] shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${dark ? "border-[var(--capsule-line-dark)] bg-white/[0.055] text-[var(--capsule-ash-dim)]" : "border-[var(--capsule-line-light)] bg-white/54 text-[var(--capsule-graphite)]"}`}>
          {fossilId}
        </span>
        <button
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${dark ? "border-[var(--capsule-line-dark)] bg-white/[0.055] text-[var(--capsule-ash-dim)] hover:border-[rgba(242,239,234,0.22)] hover:text-[var(--capsule-bone)]" : "border-[var(--capsule-line-light)] bg-white/54 text-[var(--capsule-ash)] hover:border-[rgba(23,25,28,0.18)] hover:text-[var(--capsule-graphite)]"}`}
          aria-label="Open Capsule menu"
        >
          <span className="mb-1 text-xl leading-none">...</span>
        </button>
      </div>
    </header>
  );
}
