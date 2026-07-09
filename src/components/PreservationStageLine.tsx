import { motion } from "framer-motion";

type PreservationStageLineProps = {
  activeIndex: number;
};

const stages = ["Source", "Field", "Facts", "Layer", "Review"];

export default function PreservationStageLine({ activeIndex }: PreservationStageLineProps) {
  return (
    <div className="mx-auto mt-5 w-full max-w-3xl px-1" aria-label="Preservation stage">
      <div className="grid grid-cols-5 items-center gap-2">
        {stages.map((stage, index) => {
          const active = index === activeIndex;
          const complete = index < activeIndex;
          const tone = active ? "text-[var(--capsule-coral)]" : complete ? "text-[var(--capsule-gold)]" : "text-[var(--capsule-ash-dim)]";
          const lineTone = complete ? "bg-[var(--capsule-gold)]" : active ? "bg-[var(--capsule-red)]" : "bg-[var(--capsule-line-dark)]";

          return (
            <div key={stage} className="relative flex flex-col items-center gap-2">
              {index < stages.length - 1 && (
                <div className={`absolute left-1/2 top-1.5 h-px w-full ${lineTone}`} aria-hidden="true" />
              )}
              <motion.span
                className={`relative z-10 h-3 w-3 rounded-full border border-[rgba(242,239,234,0.68)] ${active ? "bg-[var(--capsule-red)] shadow-[0_0_0_7px_rgba(152,57,49,0.18)]" : complete ? "bg-[var(--capsule-gold)]" : "bg-[var(--capsule-line-dark)]"}`}
                animate={active ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: "easeInOut" }}
              />
              <span className={`mono-label text-[0.55rem] sm:text-[0.6rem] ${tone}`}>{stage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
