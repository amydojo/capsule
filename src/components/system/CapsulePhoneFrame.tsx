import type { ReactNode } from "react";
import CapsuleStatusBar from "./CapsuleStatusBar";

export type CapsulePhoneFrameMode = "archive" | "preservation";
export type CapsulePhoneFrameVariant = "runtime" | "preview";

export type CapsulePhoneFrameProps = {
  mode?: CapsulePhoneFrameMode;
  variant?: CapsulePhoneFrameVariant;
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
  variant = "runtime",
  children,
  footer,
  showStatusBar,
  className,
  screenClassName,
  contentClassName,
}: CapsulePhoneFrameProps) {
  const preservation = mode === "preservation";
  const shouldShowStatusBar = showStatusBar ?? (variant === "preview");

  return (
    <main
      className={joinClasses(
        "capsule-app-shell",
        preservation ? "capsule-mode-preservation" : "capsule-mode-archive",
        className,
      )}
    >
      <div
        className={joinClasses(
          "capsule-phone-frame",
          `capsule-phone-frame--${mode}`,
          `capsule-phone-frame--${variant}`,
          screenClassName,
        )}
      >
        <div className="capsule-phone-frame__backdrop" aria-hidden="true" />
        <div className="capsule-phone-frame__chrome">
          {shouldShowStatusBar && <CapsuleStatusBar mode={mode} />}
          <div className={joinClasses("capsule-phone-frame__content", contentClassName)}>{children}</div>
          {footer && (
            <div className="capsule-phone-frame__footer">
              <div className="capsule-phone-frame__footer-inner">{footer}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
