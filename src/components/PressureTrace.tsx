import { motion } from "framer-motion";

type PressureTraceProps = {
  compact?: boolean;
  strong?: boolean;
  tone?: "light" | "dark";
};

export default function PressureTrace({ compact = false, strong = false, tone = "light" }: PressureTraceProps) {
  const size = compact ? "h-52 w-72" : strong ? "h-[29rem] w-[44rem] max-w-[90%]" : "h-[25rem] w-[39rem] max-w-[88%]";
  const traceBorder = tone === "dark" ? "border-[rgba(101,112,255,0.24)]" : "border-[rgba(101,112,255,0.16)]";

  return (
    <>
      <motion.div
        aria-hidden="true"
        className={`pressure-ghost absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[43%] rounded-[46%] ${size}`}
        animate={{ opacity: [0.2, 0.36, 0.2], scale: [0.985, 1.02, 0.985] }}
        transition={{ duration: 8.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className={`contour-field absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[46%] rounded-[48%] ${size}`}
        animate={{ opacity: strong ? [0.5, 0.72, 0.5] : [0.34, 0.52, 0.34], scale: [0.985, 1.014, 0.985] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[45%] rounded-[45%] border ${traceBorder} ${
          compact ? "h-36 w-52" : "h-64 w-[27rem] max-w-[74%]"
        }`}
        animate={{ opacity: [0.22, 0.46, 0.22] }}
        transition={{ duration: 6.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
