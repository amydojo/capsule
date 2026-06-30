import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ScanChecklist from "../components/ScanChecklist";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { primaryArtifact } from "../data/artifacts";

type PreservationStatus = "idle" | "preserving" | "done";

type ChamberLocationState = {
  preserve?: boolean;
};

export default function PreservationChamber() {
  const [status, setStatus] = useState<PreservationStatus>("idle");
  const navigate = useNavigate();
  const location = useLocation();
  const autoStarted = useRef(false);

  const beginPreservation = () => {
    if (status !== "idle") return;
    setStatus("preserving");
    window.setTimeout(() => setStatus("done"), 1800);
  };

  useEffect(() => {
    const state = location.state as ChamberLocationState | null;
    if (state?.preserve && !autoStarted.current) {
      autoStarted.current = true;
      beginPreservation();
    }
  });

  const buttonText = status === "idle" ? "Begin Preservation" : status === "preserving" ? "Preserving..." : "Object Preserved";

  return (
    <main className="min-h-screen pb-10">
      <TopBar fossilId={primaryArtifact.id} />
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-10 pt-2 sm:px-8 lg:grid-cols-[16rem_1fr_17rem] lg:px-10">
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="order-2 lg:order-1 lg:pt-28"
        >
          <ScanChecklist />
          <div className="mt-4 rounded-2xl border border-[var(--capsule-line)] bg-white/46 p-5">
            <p className="mono-label text-[0.65rem] text-[var(--capsule-ash)]">Object</p>
            <p className="mt-2 text-sm font-medium text-[var(--capsule-graphite)]">{primaryArtifact.commonName}</p>
            <p className="mt-4 mono-label text-[0.65rem] text-[var(--capsule-ash)]">Origin</p>
            <p className="mt-2 text-sm text-[var(--capsule-ash)]">{primaryArtifact.origin}</p>
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="order-1 lg:order-2"
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">Preservation Chamber</p>
              <h1 className="mt-2 text-3xl font-semibold uppercase leading-none tracking-[0.04em] sm:text-5xl">
                Isolate the object
              </h1>
            </div>
            <span className="hidden rounded-full border border-[var(--capsule-line)] bg-white/60 px-3 py-1.5 font-mono text-xs text-[var(--capsule-ash)] sm:inline">
              {primaryArtifact.stage}
            </span>
          </div>
          <SpecimenStage showScanLine={status !== "done"} showMarkers />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={beginPreservation}
              disabled={status !== "idle"}
              className="rounded-full bg-[var(--capsule-graphite)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(23,25,24,0.18)] transition hover:translate-y-[-1px] disabled:cursor-default disabled:bg-[var(--capsule-blue)] disabled:hover:translate-y-0"
            >
              {buttonText}
            </button>
            <button
              onClick={() => navigate(`/artifact/${primaryArtifact.id}`)}
              className="rounded-full border border-[var(--capsule-line)] bg-white/70 px-6 py-3 text-sm font-medium text-[var(--capsule-graphite)] transition hover:border-[var(--capsule-ash)]"
            >
              Open Artifact
            </button>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="order-3 lg:pt-28"
        >
          <div className="rounded-2xl border border-[var(--capsule-line)] bg-white/62 p-5 shadow-[0_18px_50px_rgba(23,25,24,0.06)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--capsule-blue)] shadow-[0_0_0_5px_rgba(39,110,241,0.12)]" />
              <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">Preservation State</p>
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Analyzing</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--capsule-ash)]">Building continuity profile.</p>
            <div className="mt-7 flex items-end justify-between border-t border-[var(--capsule-line)] pt-5">
              <span className="mono-label text-[0.64rem] text-[var(--capsule-ash)]">Signal Strength</span>
              <span className="font-mono text-3xl text-[var(--capsule-blue)]">92%</span>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--capsule-line)] bg-white/42 p-5">
            {primaryArtifact.timeline.map((step) => (
              <div key={step.code} className="flex items-center gap-3 border-b border-[var(--capsule-line)] py-3 last:border-0">
                <span className="font-mono text-xs text-[var(--capsule-blue)]">{step.code}</span>
                <span className="text-sm text-[var(--capsule-ash)]">{step.label}</span>
              </div>
            ))}
          </div>
        </motion.aside>
      </section>
    </main>
  );
}
