import { motion } from "framer-motion";

type PressureTraceProps = {
  compact?: boolean;
};

export default function PressureTrace({ compact = false }: PressureTraceProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={`contour-field absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[48%] ${
        compact ? "h-44 w-60" : "h-72 w-[27rem] max-w-[82%]"
      }`}
      animate={{ opacity: [0.34, 0.58, 0.34], scale: [0.985, 1.015, 0.985] }}
      transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
