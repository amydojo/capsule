import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CapsuleArchiveSlip from "../components/system/CapsuleArchiveSlip";
import CapsuleBottomDock from "../components/system/CapsuleBottomDock";
import CapsuleObjectPlate from "../components/system/CapsuleObjectPlate";
import CapsulePhoneFrame from "../components/system/CapsulePhoneFrame";
import CapsuleScreenHeader from "../components/system/CapsuleScreenHeader";
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
    <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
      <CapsuleScreenHeader
        eyebrow="Rediscover"
        title="A nearby object returns."
        subtitle="Capsule resurfaces one preserved object from the local archive."
        marker
      />

      <CapsuleObjectPlate imageSrc={heroImage} imageAlt={artifact.title} label={artifact.id} revealed className="mt-6" />
      {hasObjectFieldPending(artifact) ? <p className="mt-3 text-center mono-label text-[0.5rem] text-[var(--capsule-muted)]">Object field pending.</p> : null}

      <CapsuleArchiveSlip
        eyebrow="RESURFACED OBJECT"
        title={artifact.title}
        rows={[
          ["Capsule ID", artifact.id],
          ["Filed", `${daysSince(artifact.createdAt)} days ago`],
          ["State", artifact.preservationState],
          ["Origin", artifact.origin || "not recorded"],
        ]}
        className="mt-5"
      >
        <p className="mt-3 text-[0.72rem] leading-5 text-[var(--capsule-muted)]">{artifact.essence}</p>
      </CapsuleArchiveSlip>

      <section className="capsule-surface-paper mt-4 p-4">
        <p className="mono-label text-[0.5rem] text-[var(--capsule-red)]">SOURCE THEN / OBJECT NOW</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="flex aspect-square items-center justify-center rounded-[14px] border border-[rgba(17,16,17,0.08)] bg-[var(--capsule-paper)] p-2">
              {sourceImage ? (
                <img src={sourceImage} alt={`${artifact.title} captured source`} className="max-h-full max-w-full rounded-[10px] object-contain" />
              ) : (
                <span className="h-10 w-12 rounded-sm border border-black/10 bg-[var(--capsule-printed-bone)]" aria-hidden="true" />
              )}
            </div>
            <p className="mt-2 mono-label text-[0.46rem] text-[var(--capsule-muted)]">Source evidence</p>
          </div>
          <div>
            <div className="flex aspect-square items-center justify-center rounded-[14px] border border-[rgba(17,16,17,0.08)] bg-[var(--capsule-paper)] p-2">
              {heroImage ? (
                <img src={heroImage} alt={`${artifact.title} specimen`} className="max-h-full max-w-full rounded-[10px] object-contain" />
              ) : (
                <span className="h-10 w-12 rounded-sm border border-black/10 bg-[var(--capsule-printed-bone)]" aria-hidden="true" />
              )}
            </div>
            <p className="mt-2 mono-label text-[0.46rem] text-[var(--capsule-muted)]">Preserved object</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={() => (isStored ? navigate(getArtifactRoute(artifact.id)) : navigate(ROUTES.vault))}
          className="h-10 rounded-full bg-[var(--capsule-black)] px-5 text-[0.62rem] font-semibold text-white"
        >
          Open Artifact Record
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void handleObservation()} disabled={!isStored} className="h-9 rounded-full border border-[rgba(17,16,17,0.1)] px-4 text-[0.56rem] font-medium text-[var(--capsule-muted)] disabled:opacity-45">
            Add Observation
          </button>
          <button type="button" onClick={() => void handleRediscover()} disabled={!isStored} className="h-9 rounded-full border border-[rgba(17,16,17,0.1)] px-4 text-[0.56rem] font-medium text-[var(--capsule-muted)] disabled:opacity-45">
            Mark Rediscovered
          </button>
        </div>
      </div>
    </CapsulePhoneFrame>
  );
}
