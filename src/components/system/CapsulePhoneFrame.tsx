import type { ReactNode } from "react";
import CapsuleStatusBar from "./CapsuleStatusBar";

export type CapsulePhoneFrameMode = "archive" | "preservation";

export type CapsulePhoneFrameProps = {
  mode?: CapsulePhoneFrameMode;
  children: ReactNode;
  footer?: ReactNode;
  showStatusBar?: boolean;
  className?: string;
  screenClassName?: string;
  contentClassName?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function CapsulePhoneFrame({
  mode = "archive",
  children,
  footer,
  showStatusBar = true,
  className,
  screenClassName,
  contentClassName,
}: CapsulePhoneFrameProps) {
  const preservation = mode === "preservation";

  return (
    <main
      className={joinClasses(
        "min-h-[100dvh] overflow-x-hidden px-3 py-3 sm:grid sm:place-items-center sm:py-8",
        preservation ? "capsule-mode-preservation" : "capsule-mode-archive",
        className,
      )}
    >
      <div
        className={joinClasses(
          "relative mx-auto flex h-[min(var(--capsule-phone-height),calc(100dvh-1.5rem))] min-h-[560px] w-full max-w-[var(--capsule-phone-width)] flex-col overflow-hidden rounded-[var(--capsule-radius-phone)] border shadow-[0_24px_80px_rgba(17,16,17,0.18)] sm:h-[var(--capsule-phone-height)]",
          preservation
            ? "border-white/10 bg-[var(--capsule-black)] text-white"
            : "border-[rgba(17,16,17,0.08)] bg-[var(--capsule-cream)] text-[var(--capsule-black)]",
          screenClassName,
        )}
      >
        <div
          className={joinClasses(
            "pointer-events-none absolute inset-0",
            preservation
              ? "bg-[radial-gradient(ellipse_at_50%_20%,rgba(96,112,123,0.18),transparent_14rem),linear-gradient(180deg,rgba(30,26,24,0.9),rgba(17,16,17,1)_54%)]"
              : "bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,255,255,0.78),transparent_13rem),linear-gradient(180deg,rgba(244,240,231,0.96),rgba(238,232,221,0.78))]",
          )}
          aria-hidden="true"
        />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {showStatusBar && <CapsuleStatusBar mode={mode} />}
          <div className={joinClasses("min-h-0 flex-1 overflow-y-auto px-[var(--capsule-inset)] pb-4", contentClassName)}>{children}</div>
          {footer && <div className="relative z-20 shrink-0 px-[var(--capsule-inset)] pb-5 pt-2">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
