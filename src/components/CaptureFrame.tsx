import type { ReactNode } from "react";

type CaptureFrameProps = {
  children: ReactNode;
  label?: string;
  status?: string;
  mode?: "live" | "preview" | "empty";
  className?: string;
};

export default function CaptureFrame({
  children,
  label = "OBJECT FIELD",
  status = "INTAKE READY",
  mode = "empty",
  className = "",
}: CaptureFrameProps) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-[2rem] border border-[var(--capsule-line-dark)] bg-[var(--capsule-panel-black)] shadow-[inset_0_1px_0_rgba(242,239,234,0.16),inset_0_-28px_70px_rgba(0,0,0,0.42),0_28px_80px_rgba(0,0,0,0.28)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(101,112,255,0.18),transparent_42%),linear-gradient(180deg,rgba(242,239,234,0.08),rgba(242,239,234,0.015))]" />
      {mode !== "live" && (
        <div className="contour-field absolute left-1/2 top-1/2 h-[66%] w-[86%] -translate-x-1/2 -translate-y-1/2 opacity-35" />
      )}
      <div className="absolute inset-4 rounded-[1.55rem] border border-white/15 shadow-[inset_0_0_48px_rgba(242,239,234,0.11)]" />
      <div className="absolute left-5 top-5 h-8 w-8 border-l border-t border-white/40" />
      <div className="absolute right-5 top-5 h-8 w-8 border-r border-t border-white/40" />
      <div className="absolute bottom-5 left-5 h-8 w-8 border-b border-l border-white/40" />
      <div className="absolute bottom-5 right-5 h-8 w-8 border-b border-r border-white/40" />
      <div className="pointer-events-none absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/14 bg-black/24 px-3 py-1.5 backdrop-blur">
        {mode === "live" && <span className="h-1.5 w-1.5 rounded-full bg-[var(--capsule-spectrum-indigo-bright)] shadow-[0_0_0_5px_var(--capsule-spectrum-indigo-soft)]" />}
        <span className="mono-label text-[0.56rem] text-white/86">{label}</span>
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-20 rounded-full border border-white/14 bg-black/24 px-3 py-1.5 backdrop-blur">
        <span className="mono-label text-[0.56rem] text-white/58">{status}</span>
      </div>
      <div className="relative z-10 flex min-h-[52dvh] items-center justify-center sm:min-h-[38rem]">{children}</div>
    </div>
  );
}
