import type { ReactNode } from "react";

export type ObjectCataloguePlateMode = "archive" | "preservation";

export type ObjectCataloguePlateProps = {
  mode?: ObjectCataloguePlateMode;
  label?: string;
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
  revealed?: boolean;
  children?: ReactNode;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

function CatalogueObjectIllustration({ dark }: { dark: boolean }) {
  return (
    <div className="relative h-20 w-48" aria-hidden="true">
      <div className={joinClasses("absolute bottom-0 left-5 h-4 w-40 rounded-[50%] blur-sm", dark ? "bg-white/10" : "bg-black/10")} />
      <div className="absolute bottom-5 left-2 h-12 w-44 rounded-md border border-black/10 bg-[var(--capsule-printed-bone)] shadow-[0_16px_38px_rgba(17,16,17,0.12)]">
        <div className="absolute left-3 top-3 h-6 w-12 rounded-[3px] border border-black/10 bg-[var(--capsule-cream)]" />
        <div className="absolute left-[4.55rem] top-3 h-6 w-9 rounded-[3px] bg-[rgba(171,170,166,0.45)]" />
        <div className="absolute right-3 top-2 h-8 w-12 rounded-[3px] bg-[rgba(17,16,17,0.86)]">
          <span className="absolute left-2 top-1.5 h-5 w-1 rounded-full bg-[rgba(244,240,231,0.55)]" />
          <span className="absolute left-4 top-1.5 h-5 w-1 rounded-full bg-[rgba(244,240,231,0.55)]" />
          <span className="absolute left-6 top-1.5 h-5 w-1 rounded-full bg-[rgba(244,240,231,0.55)]" />
          <span className="absolute left-8 top-1.5 h-5 w-1 rounded-full bg-[rgba(244,240,231,0.55)]" />
        </div>
        <div className="absolute bottom-2 left-4 h-1 w-32 rounded-full bg-black/16" />
        <div className="absolute left-5 top-5 h-1.5 w-6 rounded-full bg-black/18" />
        <div className="absolute left-[5.55rem] top-[1.15rem] h-3 w-3 rounded-full bg-black/45" />
      </div>
    </div>
  );
}

export default function ObjectCataloguePlate({
  mode = "archive",
  label = "Catalogue plate",
  title,
  subtitle,
  imageSrc,
  imageAlt = "Preserved object",
  revealed = false,
  children,
  className,
}: ObjectCataloguePlateProps) {
  const preservation = mode === "preservation";

  return (
    <figure
      className={joinClasses(
        "relative isolate overflow-hidden rounded-[var(--capsule-radius-panel)] p-5",
        preservation ? "capsule-surface-black" : "capsule-surface-paper",
        className,
      )}
    >
      <div
        className={joinClasses(
          "absolute left-1/2 top-1/2 h-28 w-64 -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-2xl",
          preservation ? "bg-[rgba(67,81,90,0.11)]" : "bg-[rgba(171,170,166,0.1)]",
        )}
        aria-hidden="true"
      />
      <div className="relative flex min-h-40 items-center justify-center">
        <div className={joinClasses("absolute bottom-5 h-4 w-36 rounded-[50%]", preservation ? "bg-white/[0.055]" : "bg-black/10")} aria-hidden="true" />
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt} className="relative max-h-36 max-w-full object-contain drop-shadow-[0_18px_28px_rgba(17,16,17,0.22)]" />
        ) : (
          <CatalogueObjectIllustration dark={preservation} />
        )}
        {revealed && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[var(--capsule-gold)] shadow-[0_0_0_6px_rgba(220,188,145,0.16)]" aria-hidden="true" />}
      </div>
      <figcaption className="relative mt-4">
        <p className={joinClasses("mono-label text-[0.56rem]", preservation ? "text-[var(--capsule-linen-ash)]" : "text-[var(--capsule-muted)]")}>{label}</p>
        {title && <p className={joinClasses("mt-2 text-lg font-medium", preservation ? "text-white" : "text-[var(--capsule-black)]")}>{title}</p>}
        {subtitle && <p className={joinClasses("mt-1 text-sm leading-5", preservation ? "text-[var(--capsule-linen-ash)]" : "text-[var(--capsule-muted)]")}>{subtitle}</p>}
        {children}
      </figcaption>
    </figure>
  );
}
