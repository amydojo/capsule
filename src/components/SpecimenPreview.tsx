import { motion } from "framer-motion";
import type { ExtractionResult } from "../types/extraction";
import CaptureFrame from "./CaptureFrame";
import ExtractionReadout from "./ExtractionReadout";

type SpecimenPreviewProps = {
  extraction: ExtractionResult;
  onContinue: () => void;
  onReselect?: () => void;
};

export default function SpecimenPreview({ extraction, onContinue, onReselect }: SpecimenPreviewProps) {
  return (
    <div className="space-y-5">
      <CaptureFrame label="SPECIMEN LOCKED" status="SOURCE RETAINED" mode="preview">
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 px-6 py-16 text-center text-white sm:px-10">
          <div>
            <p className="text-xl font-semibold">Object ready for preservation.</p>
            <p className="mt-2 text-sm leading-6 text-white/58">Source Capture retained as provenance.</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative flex max-h-[46dvh] w-full items-center justify-center"
          >
            <div className="absolute inset-x-[22%] bottom-2 h-10 rounded-[50%] bg-black/35 blur-3xl" />
            <img src={extraction.specimenImageDataUrl} alt="Locked specimen" className="relative max-h-[46dvh] max-w-full rounded-xl object-contain shadow-[0_34px_74px_rgba(0,0,0,0.34)]" />
          </motion.div>
          <div className="w-full max-w-3xl">
            <ExtractionReadout confidence={extraction.confidence} method={extraction.method} />
          </div>
        </div>
      </CaptureFrame>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <button type="button" onClick={onContinue} className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] shadow-[0_18px_42px_rgba(0,0,0,0.32)]">Continue to Meaning</button>
        {onReselect && <button type="button" onClick={onReselect} className="device-control-button px-7 py-3.5 text-sm font-medium">Adjust Object Field</button>}
      </div>
    </div>
  );
}
