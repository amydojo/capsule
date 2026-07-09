import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import type { ArtifactRenderMetadata } from "../types/artifact";
import { createMotionSeed, getPressureTraceParams } from "../utils/motionSeed";
import SpecimenNotebook from "./SpecimenNotebook";

type PreservationFieldProps = {
  imageDataUrl?: string;
  imageAlt?: string;
  motionSeed?: string;
  mode?: "record" | "vault" | "rediscover" | "chamber";
  render?: ArtifactRenderMetadata;
};

const sizeClass: Record<NonNullable<PreservationFieldProps["mode"]>, string> = {
  record: "min-h-[30rem] rounded-[2rem] sm:min-h-[40rem] sm:rounded-[2.35rem] lg:min-h-[46rem]",
  vault: "min-h-72 rounded-[1.25rem]",
  rediscover: "min-h-[28rem] rounded-[2rem] sm:min-h-[38rem]",
  chamber: "min-h-[32rem] rounded-[2rem] sm:min-h-[42rem] sm:rounded-[2.75rem] lg:min-h-[52rem]",
};

const imageShellClass: Record<NonNullable<PreservationFieldProps["mode"]>, string> = {
  record: "h-[22rem] w-[82vw] max-w-[42rem] sm:h-[29rem] lg:h-[32rem]",
  vault: "h-56 w-full max-w-[18rem]",
  rediscover: "h-[21rem] w-[82vw] max-w-[38rem] sm:h-[27rem]",
  chamber: "h-[21rem] w-[82vw] max-w-[40rem] sm:h-[28rem] lg:h-[32rem]",
};

export default function PreservationField({
  imageDataUrl,
  imageAlt = "Preserved specimen",
  motionSeed,
  mode = "record",
  render,
}: PreservationFieldProps) {
  const reducedMotion = useReducedMotion();
  const seed = motionSeed || render?.motionSeed || createMotionSeed({ image: imageDataUrl?.slice(0, 160), mode });
  const params = useMemo(() => getPressureTraceParams(seed), [seed]);
  const dark = mode !== "record";
  const compact = mode === "vault";
  const renderedAsset = render?.method === "local-preserved-render" || render?.method === "openai-pristine-render";

  const traceBackground = dark
    ? `repeating-radial-gradient(ellipse at 50% 52%, rgba(96,112,123,0.18) 0 1px, transparent 1px ${params.lineSpacing}px), radial-gradient(ellipse at 50% 52%, rgba(96,112,123,${params.glowIntensity}), transparent 64%)`
    : `repeating-radial-gradient(ellipse at 50% 52%, rgba(67,81,90,0.13) 0 1px, transparent 1px ${params.lineSpacing}px), radial-gradient(ellipse at 50% 52%, rgba(96,112,123,${params.glowIntensity * 0.38}), transparent 64%)`;

  const traceAnimation = reducedMotion
    ? {}
    : {
        opacity: [params.opacity * 0.72, params.opacity, params.opacity * 0.72],
        x: [0, params.drift, 0],
        scale: [0.99, 1.015, 0.99],
      };

  const specimenAnimation = reducedMotion
    ? {}
    : {
        y: [0, -params.hoverAmount, 0],
      };

  const shadowAnimation = reducedMotion
    ? {}
    : {
        opacity: [0.22, 0.34, 0.22],
        scaleX: [0.96, 1.04, 0.96],
      };

  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden border ${
        dark
          ? "border-[var(--capsule-line-dark)] bg-[var(--capsule-abyss-black)] chamber-shadow-dark"
          : "border-[rgba(221,216,206,0.74)] bg-[rgba(250,248,242,0.78)] chamber-shadow"
      } ${sizeClass[mode]}`}
    >
      <div
        className={
          dark
            ? "absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(242,239,234,0.1),transparent_18rem),radial-gradient(ellipse_at_50%_56%,rgba(96,112,123,0.12),transparent_25rem),radial-gradient(ellipse_at_50%_82%,rgba(0,0,0,0.76),transparent_34rem)]"
            : "absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.98),transparent_24rem),radial-gradient(ellipse_at_50%_57%,rgba(96,112,123,0.07),transparent_21rem),radial-gradient(ellipse_at_50%_78%,rgba(23,25,28,0.055),transparent_34rem)]"
        }
        aria-hidden="true"
      />
      <div className={`quiet-grid absolute inset-0 ${dark ? "opacity-[0.04]" : "opacity-[0.06]"}`} aria-hidden="true" />
      <div
        aria-hidden="true"
        className={`absolute left-1/2 top-1/2 ${compact ? "h-44 w-64" : "h-[25rem] w-[40rem] max-w-[88%]"}`}
        style={{ transform: `translate(calc(-50% + ${params.drift}px), -47%) scale(${params.ringRadius})` }}
      >
        <motion.div
          className="h-full w-full rounded-[48%] blur-[0.2px]"
          style={{
            background: traceBackground,
            maskImage: "radial-gradient(ellipse at center, black 0%, black 58%, transparent 80%)",
          }}
          animate={traceAnimation}
          transition={{ duration: params.traceDuration, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div
        aria-hidden="true"
        className={`absolute left-1/2 top-1/2 ${compact ? "h-20 w-52" : "h-24 w-[32rem] max-w-[72%]"}`}
        style={{ transform: compact ? "translate(-50%, 95%)" : "translate(-50%, 170%)" }}
      >
        <motion.div
          className={`h-full w-full rounded-[50%] ${dark ? "bg-black/36" : "bg-[rgba(23,25,28,0.11)]"} blur-3xl`}
          animate={shadowAnimation}
          transition={{ duration: params.shadowDuration, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0, y: 8, scale: 0.985 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...specimenAnimation,
        }}
        transition={{
          opacity: { duration: 0.8 },
          scale: { duration: 0.8 },
          y: { duration: params.hoverDuration, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        {imageDataUrl ? (
          <div className={`relative flex items-center justify-center ${imageShellClass[mode]}`}>
            <img
              src={imageDataUrl}
              alt={imageAlt}
              className={`relative max-h-full max-w-full object-contain ${
                renderedAsset ? "" : "rounded-xl"
              } ${dark ? "shadow-[0_36px_82px_rgba(0,0,0,0.56)]" : "shadow-[0_34px_70px_rgba(23,25,28,0.18)]"}`}
            />
          </div>
        ) : (
          <SpecimenNotebook small={compact} refined={mode === "record" || mode === "rediscover"} />
        )}
      </motion.div>
      <div
        className={`pointer-events-none absolute inset-4 rounded-[1.5rem] border ${
          dark ? "border-white/[0.08] shadow-[inset_0_0_70px_rgba(242,239,234,0.055)]" : "border-white/70 shadow-[inset_0_18px_40px_rgba(255,255,255,0.52)]"
        } sm:inset-6`}
        aria-hidden="true"
      />
    </div>
  );
}
