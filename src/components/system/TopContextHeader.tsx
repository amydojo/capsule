import type { ReactNode } from "react";

export type TopContextHeaderMode = "archive" | "preservation";

export type TopContextHeaderAction = {
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export type TopContextHeaderProps = {
  title?: string;
  context?: string;
  objectId?: string;
  mode?: TopContextHeaderMode;
  showMarker?: boolean;
  action?: TopContextHeaderAction;
  leading?: ReactNode;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function TopContextHeader({
  title = "Vault",
  context = "Object archive",
  objectId,
  mode = "archive",
  showMarker = true,
  action,
  leading,
  className,
}: TopContextHeaderProps) {
  const preservation = mode === "preservation";
  const actionLabel = action?.label ?? "+";

  return (
    <header
      className={joinClasses(
        "flex w-full items-start justify-between gap-4 px-[var(--capsule-inset)] py-6 sm:px-[var(--capsule-inset-wide)]",
        preservation ? "capsule-mode-preservation" : "capsule-mode-archive",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {leading}
          <p className={joinClasses("mono-label truncate text-[0.58rem]", preservation ? "text-white" : "text-[var(--capsule-black)]")}>{title}</p>
          {showMarker && <span className="h-1 w-1 rounded-full bg-[var(--capsule-red)]" aria-hidden="true" />}
        </div>
        <p className={joinClasses("mt-3 truncate text-[0.72rem] font-medium", preservation ? "text-[var(--capsule-linen-ash)]" : "text-[var(--capsule-muted)]")}>
          {objectId || context}
        </p>
      </div>

      {action && (
        <button
          type="button"
          aria-label={action.ariaLabel || actionLabel}
          disabled={action.disabled || !action.onClick}
          onClick={action.onClick}
          className={joinClasses(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-lg leading-none transition",
            preservation
              ? "border-white/12 bg-white/[0.055] text-white hover:bg-white/10 disabled:text-white/38"
              : "border-black/10 bg-[var(--capsule-paper)] text-[var(--capsule-black)] hover:border-black/18 disabled:text-black/38",
          )}
        >
          {actionLabel}
        </button>
      )}
    </header>
  );
}
