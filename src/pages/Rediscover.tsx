import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import PreservationField from "../components/PreservationField";
import SpecimenNotebook from "../components/SpecimenNotebook";
import TopBar from "../components/TopBar";
import { getArtifactRoute, ROUTES } from "../constants/navigation";
import { primaryArtifact } from "../data/artifacts";
import { addObservation, loadArtifacts, markRediscovered } from "../services/artifactStorage";
import type { Artifact } from "../types/artifact";
import { getArtifactHeroImage, getArtifactSourceImage, hasObjectFieldPending } from "../utils/artifactImage";

const pickRediscoveryArtifact = (stored: Artifact[]) => {
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
  const [storedArtifacts, setStoredArtifacts] = useState<Artifact[]>([]);
  const [artifact, setArtifact] = useState<Artifact>(primaryArtifact);
  const isStored = Boolean(storedArtifacts.find((item) => item.id === artifact.id));
  const heroImage = getArtifactHeroImage(artifact);
  const sourceImage = getArtifactSourceImage(artifact);

  useEffect(() => {
    let cancelled = false;
    void loadArtifacts().then((artifacts) => {
      if (cancelled) return;
      setStoredArtifacts(artifacts);
      setArtifact(pickRediscoveryArtifact(artifacts));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRediscover = async () => {
    if (!isStored) return;
    const updated = await markRediscovered(artifact.id);
    if (updated) {
      setArtifact(updated);
      setStoredArtifacts((artifacts) => [updated, ...artifacts.filter((item) => item.id !== updated.id)]);
    }
  };

  const handleObservation = async () => {
    if (!isStored) return;
    const text = window.prompt("Add a precise archive observation for this resurfaced artifact:");
    if (!text) return;
    const updated = await addObservation(artifact.id, text);
    if (updated) {
      setArtifact(updated);
      setStoredArtifacts((artifacts) => [updated, ...artifacts.filter((item) => item.id !== updated.id)]);
    }
  };

  return (
    <main className="instrument-shell min-h-[100dvh] overflow-x-hidden pb-12">
      <TopBar fossilId={artifact.id} tone="dark" />
      <section className="mx-auto w-full max-w-[72rem] px-5 sm:px-8 lg:px-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--capsule-mineral-olive)] shadow-[0_0_0_6px_var(--capsule-mineral-olive-soft)]" />
            <span className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">REDISCOVER</span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[0.01em] text-[var(--capsule-bone)] sm:text-5xl">{artifact.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--capsule-ash-dim)]">{artifact.essence}</p>
        </div>

        <PreservationField mode="rediscover" imageDataUrl={heroImage} imageAlt={artifact.title} motionSeed={artifact.render?.motionSeed} render={artifact.render} />
        {hasObjectFieldPending(artifact) && <p className="mt-4 text-center mono-label text-[0.62rem] text-[var(--capsule-ash-dim)]">Object field pending.</p>}

        <div className="mx-auto mt-9 flex max-w-4xl flex-col items-center gap-2 text-center">
          <p className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">CAPSULE ID {artifact.id}</p>
          <p className="text-2xl font-semibold text-[var(--capsule-bone)]">Filed {daysSince(artifact.createdAt)} days ago</p>
        </div>

        <section className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
          <div className="border-t border-[var(--capsule-line-dark)] pt-5">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">THEN</p>
            <div className="mt-5 flex min-h-40 items-center justify-center rounded-2xl border border-[var(--capsule-line-dark)] bg-white/[0.045]">
              {sourceImage ? (
                <img src={sourceImage} alt={`${artifact.title} captured`} className="max-h-36 max-w-full rounded-xl object-contain" />
              ) : (
                <SpecimenNotebook small />
              )}
            </div>
            <p className="mt-4 text-sm text-[var(--capsule-ash-dim)]">Source evidence</p>
            <p className="font-mono text-sm text-[var(--capsule-bone)]">{artifact.capturePoint}</p>
          </div>
          <div className="border-t border-[var(--capsule-line-dark)] pt-5">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">NOW</p>
            <div className="mt-5">
              {heroImage ? (
                <PreservationField mode="vault" imageDataUrl={heroImage} imageAlt={`${artifact.title} specimen`} motionSeed={artifact.render?.motionSeed} render={artifact.render} />
              ) : (
                <div className="flex min-h-40 items-center justify-center rounded-2xl border border-[var(--capsule-line-dark)] bg-white/[0.055]">
                  <SpecimenNotebook small refined />
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-[var(--capsule-ash-dim)]">Specimen</p>
            <p className="font-mono text-sm text-[var(--capsule-bone)]">{new Date().toLocaleDateString()}</p>
          </div>
        </section>

        <div className="mx-auto mt-7 flex max-w-4xl flex-wrap gap-3">
          <button
            onClick={() => (isStored ? navigate(getArtifactRoute(artifact.id)) : navigate(ROUTES.vault))}
            className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-5 py-3 text-sm font-medium text-[var(--capsule-graphite-black)]"
          >
            Open Artifact Record
          </button>
          <button onClick={() => void handleObservation()} disabled={!isStored} className="device-control-button px-5 py-3 text-sm font-medium">Add Observation</button>
          <button onClick={() => void handleRediscover()} disabled={!isStored} className="device-control-button px-5 py-3 text-sm font-medium">Mark Rediscovered</button>
        </div>
        <BottomNav tone="dark" />
      </section>
    </main>
  );
}
