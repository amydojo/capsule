import { Link } from "react-router-dom";
import { getArtifactRoute } from "../../constants/navigation";
import { getArtifactHeroImage } from "../../utils/artifactImage";
import { normalizeArtifactRecord } from "../../utils/artifactRecord";
import type { RelatedArtifactSeed } from "../../utils/relatedArtifacts";

export type RelatedObjectSeedProps = {
  seed: RelatedArtifactSeed | null;
};

const getArtifactTitle = (seed: RelatedArtifactSeed) => {
  const record = normalizeArtifactRecord(seed.artifact);
  return record.identity.userGivenName || record.identity.systemArtifactName || seed.artifact.objectName || seed.artifact.title || "Untitled artifact";
};

export default function RelatedObjectSeed({ seed }: RelatedObjectSeedProps) {
  if (!seed) {
    return (
      <section className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
        <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">RELATED OBJECT SEED</p>
        <div className="capsule-surface-paper mt-5 p-5">
          <h2 className="text-2xl font-medium text-[var(--capsule-black)]">This artifact begins a collection.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--capsule-muted)]">
            Capsule will connect it when another local object shares material, origin, class, collection, text, or pressure.
          </p>
        </div>
      </section>
    );
  }

  const title = getArtifactTitle(seed);
  const heroImage = getArtifactHeroImage(seed.artifact);

  return (
    <section className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
      <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">RELATED OBJECT SEED</p>
      <div className="capsule-surface-paper mt-5 grid gap-5 p-5 sm:grid-cols-[7rem_1fr] sm:items-center">
        <div className="flex aspect-square items-center justify-center rounded-[10px] border border-black/[0.045] bg-[var(--capsule-paper)]">
          {heroImage ? (
            <img src={heroImage} alt={`${title} related artifact`} className="max-h-[82%] max-w-[82%] object-contain" />
          ) : (
            <span className="h-10 w-12 rounded-sm border border-black/10 bg-[var(--capsule-printed-bone)]" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-medium text-[var(--capsule-black)]">Another object is nearby.</h2>
          <p className="mt-2 text-sm font-medium text-[var(--capsule-black)]">{title}</p>
          <p className="mt-3 font-mono text-xs text-[var(--capsule-muted)]">{seed.reason}</p>
          <Link to={getArtifactRoute(seed.artifact.id)} className="secondary-button mt-5 inline-flex min-h-10 items-center justify-center px-5 py-2.5 text-sm font-medium">
            Open related artifact
          </Link>
        </div>
      </div>
    </section>
  );
}
