import { motion } from "framer-motion";
import PressureTrace from "./PressureTrace";
import SpecimenNotebook from "./SpecimenNotebook";

type SpecimenStageProps = {
  mode?: "chamber" | "artifact" | "compact";
  showScanLine?: boolean;
  showMarkers?: boolean;
};

export default function SpecimenStage({
  mode = "chamber",
  showScanLine = false,
  showMarkers = false,
}: SpecimenStageProps) {
  const compact = mode === "compact";

  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden border border-[var(--capsule-line)] bg-[rgba(255,255,255,0.62)] chamber-shadow ${
        compact
          ? "min-h-56 rounded-2xl"
          : mode === "artifact"
            ? "min-h-[28rem] rounded-[2rem]"
            : "min-h-[32rem] rounded-[2.35rem] lg:min-h-[39rem]"
      }`}
    >
      <div className="quiet-grid absolute inset-0 opacity-45" aria-hidden="true" />
      <div className="absolute inset-6 rounded-[2rem] border border-white/80 shadow-[inset_0_0_60px_rgba(255,255,255,0.75)]" aria-hidden="true" />
      <PressureTrace compact={compact} />
      <div className="absolute bottom-[18%] h-px w-[70%] bg-[linear-gradient(90deg,transparent,rgba(23,25,24,0.16),transparent)]" />
      {showMarkers && (
        <>
          <div className="mono-label absolute left-7 top-7 text-[0.62rem] text-[var(--capsule-ash)]">Pressure Trace</div>
          <div className="absolute right-7 top-8 h-2 w-2 rounded-full bg-[var(--capsule-blue)] shadow-[0_0_0_5px_rgba(39,110,241,0.12)]" />
          <div className="mono-label absolute bottom-7 right-7 text-[0.62rem] text-[var(--capsule-ash)]">Specimen Render</div>
        </>
      )}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: [0, -4, 0], scale: 1 }}
        transition={{ opacity: { duration: 0.8 }, scale: { duration: 0.8 }, y: { duration: 5.8, repeat: Infinity, ease: "easeInOut" } }}
      >
        <SpecimenNotebook small={compact} refined={mode === "artifact"} />
      </motion.div>
      {showScanLine && (
        <motion.div
          className="scan-sheen absolute inset-y-14 z-20 w-28 -translate-x-1/2 blur-[1px]"
          initial={{ left: "18%", opacity: 0 }}
          animate={{ left: ["18%", "82%"], opacity: [0, 0.85, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
