import { Link } from "react-router-dom";
import { getArtifactRoute } from "../../constants/navigation";
import { getArtifactHeroImage } from "../../utils/artifactImage";
import { normalizeArtifactRecord } from "../../utils/artifactRecord";
import type { RelatedArtifactSeed } from "../../utils/relatedArtifacts";
import CapsuleObjectPlate from "../system/CapsuleObjectPlate";

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
      <section className="mt-8 border-t border-[rgba(17,16,17,0.1)] pt-5">
        <p className="mono-label text-[0.5rem] text-[var(--capsule-red)]">RELATED OBJECT SEED</p>
        <div className="capsule-surface-paper mt-3 p-4">
          <h2 className="text-[1.1rem] font-medium leading-tight text-[var(--capsule-black)]">This artifact begins a collection.</h2>
          <p className="mt-3 text-[0.68rem] leading-5 text-[var(--capsule-muted)]">
            Capsule will connect it when another local object shares material, origin, class, collection, text, or pressure.
          </p>
        </div>
      </section>
    );
  }

  const title = getArtifactTitle(seed);
  const heroImage = getArtifactHeroImage(seed.artifact);

  return (
    <section className="mt-8 border-t border-[rgba(17,16,17,0.1)] pt-5">
      <p className="mono-label text-[0.5rem] text-[var(--capsule-red)]">RELATED OBJECT SEED</p>
      <div className="capsule-surface-paper mt-3 grid gap-4 p-4">
        <CapsuleObjectPlate imageSrc={heroImage} imageAlt={`${title} related artifact`} label="Related object" className="min-h-[132px]" />
        <div className="min-w-0">
          <h2 className="text-[1.1rem] font-medium leading-tight text-[var(--capsule-black)]">Another object is nearby.</h2>
          <p className="mt-2 text-[0.72rem] font-medium text-[var(--capsule-black)]">{title}</p>
          <p className="mt-3 font-mono text-[0.58rem] text-[var(--capsule-muted)]">{seed.reason}</p>
          <Link to={getArtifactRoute(seed.artifact.id)} className="mt-5 flex h-9 items-center justify-center rounded-full border border-[rgba(17,16,17,0.1)] px-5 text-[0.58rem] font-medium text-[var(--capsule-muted)]">
            Open related artifact
          </Link>
        </div>
      </div>
    </section>
  );
}
