import type { ReactNode } from "react";

export type CapsuleObjectPlateMode = "archive" | "preservation";

export type CapsuleObjectPlateProps = {
  mode?: CapsuleObjectPlateMode;
  imageSrc?: string;
  imageAlt?: string;
  label?: string;
  revealed?: boolean;
  children?: ReactNode;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

function DefaultObjectGlyph() {
  return (
    <div className="relative h-16 w-36" aria-hidden="true">
      <span className="absolute bottom-0 left-3 h-3 w-28 rounded-[50%] bg-black/12 blur-sm" />
      <span className="absolute bottom-4 left-0 h-10 w-36 rounded-[4px] border border-black/10 bg-[var(--capsule-printed-bone)] shadow-[0_12px_28px_rgba(17,16,17,0.12)]" />
      <span className="absolute bottom-6 left-3 h-5 w-10 rounded-[3px] bg-[var(--capsule-cream)]" />
      <span className="absolute bottom-6 left-16 h-5 w-7 rounded-[3px] bg-[rgba(171,170,166,0.48)]" />
      <span className="absolute bottom-5 right-3 h-7 w-9 rounded-[3px] bg-[rgba(17,16,17,0.86)]">
        <span className="absolute left-1.5 top-1.5 h-4 w-0.5 rounded-full bg-[rgba(244,240,231,0.58)]" />
        <span className="absolute left-3 top-1.5 h-4 w-0.5 rounded-full bg-[rgba(244,240,231,0.58)]" />
        <span className="absolute left-[1.15rem] top-1.5 h-4 w-0.5 rounded-full bg-[rgba(244,240,231,0.58)]" />
        <span className="absolute left-6 top-1.5 h-4 w-0.5 rounded-full bg-[rgba(244,240,231,0.58)]" />
      </span>
    </div>
  );
}

export default function CapsuleObjectPlate({
  mode = "archive",
  imageSrc,
  imageAlt = "Preserved object",
  label,
  revealed = false,
  children,
  className,
}: CapsuleObjectPlateProps) {
  const preservation = mode === "preservation";

  return (
    <figure
      className={joinClasses(
        "relative isolate overflow-hidden rounded-[18px] border p-3",
        preservation ? "border-white/10 bg-[rgba(17,16,17,0.72)]" : "border-[rgba(17,16,17,0.08)] bg-[var(--capsule-paper)]",
        className,
      )}
    >
      <div className={joinClasses("absolute inset-x-6 top-7 h-28 rounded-[50%] blur-2xl", preservation ? "bg-[rgba(96,112,123,0.13)]" : "bg-white/56")} aria-hidden="true" />
      {label && <p className={joinClasses("relative mono-label text-[0.44rem]", preservation ? "text-[var(--capsule-linen-ash)]" : "text-[var(--capsule-muted)]")}>{label}</p>}
      <div className="relative grid min-h-[116px] place-items-center">
        <span className={joinClasses("absolute bottom-5 h-3 w-28 rounded-[50%] blur-sm", preservation ? "bg-white/8" : "bg-black/10")} aria-hidden="true" />
        {imageSrc ? <img src={imageSrc} alt={imageAlt} className="relative max-h-[128px] max-w-full object-contain drop-shadow-[0_18px_24px_rgba(17,16,17,0.2)]" /> : <DefaultObjectGlyph />}
        {revealed && <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[var(--capsule-gold)] shadow-[0_0_0_5px_rgba(220,188,145,0.16)]" aria-hidden="true" />}
      </div>
      {children && <figcaption className="relative mt-2">{children}</figcaption>}
    </figure>
  );
}
