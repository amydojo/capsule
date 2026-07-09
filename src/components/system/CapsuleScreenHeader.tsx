import type { ReactNode } from "react";

export type CapsuleScreenHeaderMode = "archive" | "preservation";

export type CapsuleScreenHeaderAction = {
  label: ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  href?: string;
};

export type CapsuleScreenHeaderProps = {
  mode?: CapsuleScreenHeaderMode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  centered?: boolean;
  marker?: boolean;
  leading?: CapsuleScreenHeaderAction;
  trailing?: CapsuleScreenHeaderAction;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

function HeaderAction({ action, preservation }: { action?: CapsuleScreenHeaderAction; preservation: boolean }) {
  if (!action) return <span className="h-7 w-7 shrink-0" aria-hidden="true" />;

  const className = joinClasses(
    "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm leading-none transition",
    preservation
      ? "border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
      : "border-black/10 bg-[var(--capsule-paper)] text-[var(--capsule-black)] hover:border-black/20",
  );

  if (action.href) {
    return (
      <a href={action.href} aria-label={action.ariaLabel} className={className}>
        {action.label}
      </a>
    );
  }

  return (
    <button type="button" aria-label={action.ariaLabel} onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export default function CapsuleScreenHeader({
  mode = "archive",
  eyebrow,
  title,
  subtitle,
  centered = false,
  marker = true,
  leading,
  trailing,
  className,
}: CapsuleScreenHeaderProps) {
  const preservation = mode === "preservation";

  return (
    <header className={joinClasses("pt-3", className)}>
      <div className={joinClasses("flex items-start gap-3", centered ? "justify-between" : "justify-between")}>
        <HeaderAction action={leading} preservation={preservation} />
        <div className={joinClasses("min-w-0 flex-1", centered ? "text-center" : "text-left")}>
          {eyebrow && (
            <p className={joinClasses("mono-label text-[0.44rem] leading-none tracking-[0.16em]", preservation ? "text-white" : "text-[var(--capsule-black)]")}>
              {eyebrow}
              {marker && <span className="ml-2 inline-block h-1 w-1 rounded-full bg-[var(--capsule-red)] align-middle" aria-hidden="true" />}
            </p>
          )}
          {title && <h1 className={joinClasses("mt-4 text-[1.8rem] font-medium leading-[0.98] tracking-normal", preservation ? "text-white" : "text-[var(--capsule-black)]")}>{title}</h1>}
          {subtitle && <p className={joinClasses("mt-2 text-[0.62rem] leading-4", preservation ? "text-[var(--capsule-linen-ash)]" : "text-[var(--capsule-muted)]")}>{subtitle}</p>}
        </div>
        <HeaderAction action={trailing} preservation={preservation} />
      </div>
    </header>
  );
}
