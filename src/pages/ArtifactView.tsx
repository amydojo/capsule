import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArtifactActions from "../components/ArtifactActions";
import MetadataTable from "../components/MetadataTable";
import SourceCapturePreview from "../components/SourceCapturePreview";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { addObservation, getArtifactById, sealArtifact } from "../services/artifactStorage";
import type { Artifact } from "../types/artifact";
import { getSpecimenImageDataUrl } from "../utils/artifactImage";

const polishVisibleDetail = (detail: string) => {
  const normalized = detail.toLowerCase();
  if (normalized.includes("uploaded") && normalized.includes("object image")) return "selected specimen region";
  if (normalized.includes("user-provided") && normalized.includes("object context")) return "user context preserved with specimen";
  if (normalized.includes("mixed") && normalized.includes("material") && normalized.includes("inferred")) return "material unresolved from source capture";
  return detail;
};

export default function ArtifactView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLElement>(null);
  const [artifact, setArtifact] = useState<Artifact | undefined>(() => (id ? getArtifactById(id) : undefined));
  const [showObservationInput, setShowObservationInput] = useState(false);
  const [observationText, setObservationText] = useState("");

  useEffect(() => {
    setArtifact(id ? getArtifactById(id) : undefined);
  }, [id]);

  if (!artifact) {
    return (
      <main className="record-shell min-h-screen pb-16">
        <TopBar fossilId={id || "CF-00000"} contextLabel="OBJECT RECORD" />
        <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
          <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">Artifact not found.</p>
          <h1 className="mt-4 text-4xl font-semibold uppercase tracking-[0.04em]">No preserved object here</h1>
          <button onClick={() => navigate("/archive")} className="primary-button mt-8 px-6 py-3 text-sm font-medium">
            Return to Archive
          </button>
        </section>
      </main>
    );
  }

  const sealed = artifact.preservationState === "sealed";
  const specimenImage = getSpecimenImageDataUrl(artifact);
  const sourceImage = artifact.sourceImageDataUrl && artifact.sourceImageDataUrl !== specimenImage ? artifact.sourceImageDataUrl : undefined;
  const isolationLabel = artifact.extraction?.method === "manual-object-field" ? "Isolation: manual" : "Isolation: simulated";
  const visibleDetails = artifact.visibleDetails.map(polishVisibleDetail);

  const handleSeal = () => {
    const updated = sealArtifact(artifact.id);
    if (updated) setArtifact(updated);
  };

  const handleAddObservation = () => {
    const updated = addObservation(artifact.id, observationText);
    if (updated) {
      setArtifact(updated);
      setObservationText("");
      setShowObservationInput(false);
    }
  };

  return (
    <main className="record-shell min-h-screen pb-16">
      <TopBar fossilId={artifact.id} contextLabel="OBJECT RECORD" />
      <section className="mx-auto w-full max-w-[84rem] px-4 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[55rem] pb-7 pt-2 sm:pb-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--capsule-mineral-olive)] shadow-[0_0_0_6px_var(--capsule-mineral-olive-soft)]" />
            <span className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">ARTIFACT</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold uppercase tracking-[0.035em] sm:text-6xl">{artifact.title}</h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--capsule-ash)]">Preserved {artifact.capturePoint}</p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--capsule-ash)] sm:mt-6 sm:text-xl sm:leading-9">{artifact.essence}</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <SpecimenStage mode="artifact" tone="light" imageDataUrl={specimenImage} imageAlt={artifact.title} showIsolationChip={Boolean(specimenImage)} isolationLabel={isolationLabel} />
        </motion.div>
        <div className="mt-10 sm:mt-14">
          <MetadataTable artifact={artifact} />
          <ArtifactActions
            sealed={sealed}
            onSeal={handleSeal}
            onAddObservation={() => setShowObservationInput((value) => !value)}
            onViewTimeline={() => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
          {showObservationInput && (
            <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-[var(--capsule-line)] bg-white/54 p-5">
              <label className="mono-label text-[0.64rem] text-[var(--capsule-ash)]">Observation</label>
              <textarea
                value={observationText}
                onChange={(event) => setObservationText(event.target.value)}
                rows={3}
                placeholder="Add a precise note about this artifact..."
                className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-[var(--capsule-graphite)] outline-none placeholder:text-[var(--capsule-ash)]"
              />
              <button onClick={handleAddObservation} className="primary-button mt-4 min-w-0 px-5 py-3 text-sm font-medium">
                Save Observation
              </button>
            </div>
          )}
        </div>

        <section className="mx-auto mt-14 grid max-w-4xl gap-8 border-t border-[var(--capsule-line)] pt-8 sm:mt-20 sm:pt-10 md:grid-cols-2">
          <div>
            <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Visible Details</p>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--capsule-graphite)]">
              {visibleDetails.map((detail, index) => (
                <li key={`${detail}-${index}`} className="border-b border-[rgba(229,226,220,0.62)] pb-3">{detail}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Continuity Note</p>
            <p className="mt-5 text-sm leading-7 text-[var(--capsule-graphite)]">{artifact.emotionalHypothesis}</p>
            {artifact.ai && (
              <p className="mt-6 font-mono text-xs text-[var(--capsule-ash)]">
                {artifact.ai.provider} / {artifact.ai.model} / {artifact.ai.usedFallback ? "fallback" : "vision"}
              </p>
            )}
          </div>
        </section>

        {sourceImage && <SourceCapturePreview sourceImageDataUrl={sourceImage} title={artifact.title} />}

        <section ref={timelineRef} className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
          <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Artifact Timeline</p>
          <div className="mt-6 space-y-5">
            {artifact.timeline.map((event) => (
              <div key={event.id} className="grid gap-2 border-b border-[rgba(229,226,220,0.68)] pb-5 sm:grid-cols-[10rem_1fr]">
                <p className="font-mono text-xs text-[var(--capsule-ash)]">{new Date(event.date).toLocaleString()}</p>
                <div>
                  <p className="text-sm font-semibold text-[var(--capsule-graphite)]">{event.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--capsule-ash)]">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
          <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Observations</p>
          {artifact.observations.length ? (
            <div className="mt-6 space-y-4">
              {artifact.observations.map((observation) => (
                <div key={observation.id} className="rounded-2xl border border-[rgba(229,226,220,0.7)] bg-white/46 p-5">
                  <p className="text-sm leading-6 text-[var(--capsule-graphite)]">{observation.text}</p>
                  <p className="mt-3 font-mono text-xs text-[var(--capsule-ash)]">{new Date(observation.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--capsule-ash)]">No observations added.</p>
          )}
        </section>
      </section>
    </main>
  );
}
