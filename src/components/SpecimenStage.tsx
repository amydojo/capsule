import { motion } from "framer-motion";
import PressureTrace from "./PressureTrace";
import SpecimenNotebook from "./SpecimenNotebook";

type SpecimenStageProps = {
  mode?: "chamber" | "artifact" | "compact";
  showScanLine?: boolean;
  showMarkers?: boolean;
  imageDataUrl?: string;
  imageAlt?: string;
  showIsolationChip?: boolean;
};

export default function SpecimenStage({
  mode = "chamber",
  showScanLine = false,
  showMarkers = false,
  imageDataUrl,
  imageAlt = "Captured object specimen",
  showIsolationChip = false,
}: SpecimenStageProps) {
  const compact = mode === "compact";
  const stageHeight = compact
    ? "min-h-72 rounded-[1.35rem]"
    : mode === "artifact"
      ? "min-h-[40rem] rounded-[2.35rem] lg:min-h-[46rem]"
      : "min-h-[42rem] rounded-[2.75rem] lg:min-h-[52rem]";

  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden border border-[rgba(229,226,220,0.72)] bg-[rgba(255,255,255,0.72)] chamber-shadow ${stageHeight}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,1),transparent_24rem),radial-gradient(ellipse_at_50%_57%,rgba(47,126,247,0.07),transparent_20rem),radial-gradient(ellipse_at_50%_73%,rgba(23,25,28,0.065),transparent_34rem)]" aria-hidden="true" />
      <div className="quiet-grid absolute inset-0 opacity-[0.06]" aria-hidden="true" />
      <div className="absolute inset-3 rounded-[2.35rem] border border-white/85 bg-white/[0.07] shadow-[inset_0_0_70px_rgba(255,255,255,0.92),inset_0_-26px_54px_rgba(23,25,28,0.035)] sm:inset-6" aria-hidden="true" />
      <div className="absolute inset-8 rounded-[2rem] border border-[rgba(255,255,255,0.72)] shadow-[inset_0_0_0_1px_rgba(229,226,220,0.42),inset_0_18px_40px_rgba(255,255,255,0.58),inset_0_-30px_70px_rgba(23,25,28,0.045)]" aria-hidden="true" />
      <div className="absolute inset-x-[8%] top-[11%] h-[70%] rounded-[48%] border border-[rgba(229,226,220,0.56)] bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),inset_0_-30px_70px_rgba(23,25,28,0.04)]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 h-72 w-[36rem] max-w-[78%] -translate-x-1/2 -translate-y-[38%] rounded-[50%] bg-[var(--capsule-glow)] blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-[15%] h-px w-[78%] bg-[linear-gradient(90deg,transparent,rgba(23,25,28,0.2),transparent)]" />
      <PressureTrace compact={compact} strong={mode === "chamber"} />
      {showMarkers && (
        <>
          <div className="mono-label absolute left-7 top-7 text-[0.58rem] text-[var(--capsule-ash)] sm:left-10 sm:top-10">Pressure Trace</div>
          <div className="absolute right-7 top-8 h-2 w-2 rounded-full bg-[var(--capsule-blue)] shadow-[0_0_0_7px_var(--capsule-glow)] sm:right-10 sm:top-11" />
          <div className="mono-label absolute bottom-7 right-7 text-[0.58rem] text-[var(--capsule-ash)] sm:bottom-10 sm:right-10">Specimen Render</div>
        </>
      )}
      {showIsolationChip && imageDataUrl && (
        <div className="mono-label absolute bottom-7 left-7 z-30 rounded-full border border-[rgba(229,226,220,0.72)] bg-white/62 px-3 py-1.5 text-[0.55rem] text-[var(--capsule-ash)] sm:bottom-10 sm:left-10">
          Isolation: simulated
        </div>
      )}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: [0, -4, 0], scale: 1 }}
        transition={{ opacity: { duration: 0.9 }, scale: { duration: 0.9 }, y: { duration: 6.4, repeat: Infinity, ease: "easeInOut" } }}
      >
        {imageDataUrl ? (
          <div className="relative flex h-[18rem] w-[80vw] max-w-[34rem] items-center justify-center sm:h-[24rem]">
            <div className="absolute inset-x-10 bottom-5 h-10 rounded-[50%] bg-[rgba(23,25,28,0.18)] blur-3xl" />
            <img
              src={imageDataUrl}
              alt={imageAlt}
              className="relative max-h-full max-w-full rounded-xl object-contain shadow-[0_34px_70px_rgba(23,25,28,0.2)]"
            />
          </div>
        ) : (
          <SpecimenNotebook small={compact} refined={mode === "artifact"} />
        )}
      </motion.div>
      {showScanLine && (
        <motion.div
          className="scan-sheen absolute inset-y-[13%] z-20 w-32 -translate-x-1/2 blur-[1.5px]"
          initial={{ left: "18%", opacity: 0 }}
          animate={{ left: ["18%", "82%"], opacity: [0, 0.7, 0] }}
          transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.1 }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
