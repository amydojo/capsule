import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import SpecimenNotebook from "../components/SpecimenNotebook";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { primaryArtifact } from "../data/artifacts";
import { addObservation, getArtifacts, markRediscovered } from "../services/artifactStorage";
import type { Artifact } from "../types/artifact";

const pickRediscoveryArtifact = () => {
  const stored = getArtifacts();
  const active = stored
    .filter((artifact) => artifact.preservationState === "active")
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return active[0] || stored[0] || primaryArtifact;
};

const daysSince = (date: string) => {
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.round((Date.now() - parsed) / 86_400_000));
};

export default function Rediscover() {
  const navigate = useNavigate();
  const [artifact, setArtifact] = useState<Artifact>(() => pickRediscoveryArtifact());
  const isStored = Boolean(getArtifacts().find((item) => item.id === artifact.id));

  const handleRediscover = () => {
    if (!isStored) return;
    const updated = markRediscovered(artifact.id);
    if (updated) setArtifact(updated);
  };

  const handleObservation = () => {
    if (!isStored) return;
    const text = window.prompt("Add a precise observation for this resurfaced artifact:");
    if (!text) return;
    const updated = addObservation(artifact.id, text);
    if (updated) setArtifact(updated);
  };

  return (
    <main className="min-h-screen pb-12">
      <TopBar fossilId={artifact.id} />
      <section className="mx-auto w-full max-w-[72rem] px-5 sm:px-8 lg:px-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--capsule-blue)] shadow-[0_0_0_6px_var(--capsule-glow)]" />
            <span className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">RESURFACED</span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[0.01em] sm:text-5xl">{artifact.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--capsule-ash)]">{artifact.essence}</p>
        </div>

        <SpecimenStage mode="artifact" imageDataUrl={artifact.imageDataUrl} imageAlt={artifact.title} showIsolationChip={Boolean(artifact.imageDataUrl)} />

        <div className="mx-auto mt-9 flex max-w-4xl flex-col items-center gap-2 text-center">
          <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">FOSSIL ID {artifact.id}</p>
          <p className="text-2xl font-semibold text-[var(--capsule-graphite)]">Captured {daysSince(artifact.createdAt)} days ago</p>
        </div>

        <section className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
          <div className="border-t border-[var(--capsule-line)] pt-5">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">THEN</p>
            <div className="mt-5 flex min-h-40 items-center justify-center rounded-2xl border border-[rgba(229,226,220,0.7)] bg-white/48">
              {artifact.thumbnailDataUrl || artifact.imageDataUrl ? (
                <img src={artifact.thumbnailDataUrl || artifact.imageDataUrl} alt={`${artifact.title} captured`} className="max-h-36 max-w-full rounded-xl object-contain" />
              ) : (
                <SpecimenNotebook small />
              )}
            </div>
            <p className="mt-4 text-sm text-[var(--capsule-ash)]">Captured</p>
            <p className="font-mono text-sm text-[var(--capsule-graphite)]">{artifact.capturePoint}</p>
          </div>
          <div className="border-t border-[var(--capsule-line)] pt-5">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">NOW</p>
            <div className="mt-5 flex min-h-40 items-center justify-center rounded-2xl border border-[rgba(47,126,247,0.2)] bg-white/54">
              {artifact.imageDataUrl ? (
                <img src={artifact.imageDataUrl} alt={`${artifact.title} specimen`} className="max-h-36 max-w-full rounded-xl object-contain" />
              ) : (
                <SpecimenNotebook small refined />
              )}
            </div>
            <p className="mt-4 text-sm text-[var(--capsule-ash)]">Specimen</p>
            <p className="font-mono text-sm text-[var(--capsule-graphite)]">{new Date().toLocaleDateString()}</p>
          </div>
        </section>

        <div className="mx-auto mt-7 flex max-w-4xl flex-wrap gap-3">
          <button
            onClick={() => (isStored ? navigate(`/artifact/${artifact.id}`) : navigate("/archive"))}
            className="primary-button px-5 py-3 text-sm font-medium"
          >
            Open Artifact
          </button>
          <button onClick={handleObservation} disabled={!isStored} className="secondary-button px-5 py-3 text-sm font-medium">Add Observation</button>
          <button onClick={handleRediscover} disabled={!isStored} className="secondary-button px-5 py-3 text-sm font-medium">Mark Rediscovered</button>
        </div>
        <BottomNav />
      </section>
    </main>
  );
}
