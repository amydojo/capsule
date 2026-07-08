import { motion } from "framer-motion";
import type { NormalizedBoundary } from "../types/extraction";

type ObjectFieldFrameProps = {
  sourceImageDataUrl: string;
  boundary: NormalizedBoundary;
  onImageLoad: (size: { width: number; height: number }) => void;
};

export default function ObjectFieldFrame({ sourceImageDataUrl, boundary, onImageLoad }: ObjectFieldFrameProps) {
  const selectionStyle = {
    left: `${boundary.x * 100}%`,
    top: `${boundary.y * 100}%`,
    width: `${boundary.width * 100}%`,
    height: `${boundary.height * 100}%`,
  };

  return (
    <div className="relative flex w-full max-w-4xl justify-center overflow-hidden rounded-[1.35rem] border border-white/16 bg-black/28 p-2 shadow-[inset_0_0_52px_rgba(0,0,0,0.34)]">
      <div className="relative inline-block max-h-[52dvh] max-w-full">
        <img
          src={sourceImageDataUrl}
          alt="Source Capture for Object Field Lock"
          onLoad={(event) => onImageLoad({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
          className="block max-h-[52dvh] max-w-full select-none rounded-2xl object-contain opacity-90"
          draggable={false}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_38%,rgba(0,0,0,0.56)_80%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          aria-hidden="true"
        />
        <motion.div
          className="absolute overflow-hidden border border-[var(--capsule-spectrum-indigo-bright)] bg-white/[0.035] shadow-[0_0_0_9999px_rgba(0,0,0,0.36),inset_0_0_42px_rgba(101,112,255,0.16),0_0_38px_rgba(101,112,255,0.22)]"
          style={selectionStyle}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <span className="absolute -left-px -top-px h-7 w-7 border-l-2 border-t-2 border-[var(--capsule-spectrum-indigo-bright)]" />
          <span className="absolute -right-px -top-px h-7 w-7 border-r-2 border-t-2 border-[var(--capsule-spectrum-indigo-bright)]" />
          <span className="absolute -bottom-px -left-px h-7 w-7 border-b-2 border-l-2 border-[var(--capsule-spectrum-indigo-bright)]" />
          <span className="absolute -bottom-px -right-px h-7 w-7 border-b-2 border-r-2 border-[var(--capsule-spectrum-indigo-bright)]" />
          <motion.span
            className="absolute inset-y-0 w-16 bg-[linear-gradient(90deg,transparent,rgba(101,112,255,0.24),transparent)] blur-[1px]"
            initial={{ left: "-24%", opacity: 0 }}
            animate={{ left: ["-24%", "110%"], opacity: [0, 0.8, 0] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
            aria-hidden="true"
          />
          <span className="mono-label absolute left-3 top-3 rounded-full border border-white/18 bg-black/40 px-2.5 py-1 text-[0.52rem] text-white/78 backdrop-blur">OBJECT FIELD</span>
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--capsule-mineral-olive)] shadow-[0_0_0_6px_var(--capsule-mineral-olive-soft)]" aria-hidden="true" />
        </motion.div>
      </div>
    </div>
  );
}
