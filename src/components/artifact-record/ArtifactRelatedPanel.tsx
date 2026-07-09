import { Link } from "react-router-dom";
import { getArtifactRoute } from "../../constants/navigation";
import { normalizeArtifactRecord } from "../../utils/artifactRecord";
import type { RelatedArtifactSeed } from "../../utils/relatedArtifacts";
import CapsuleObjectPlate from "../system/CapsuleObjectPlate";
import {
  getArtifactAccessionLabel,
  getArtifactDisplayTitle,
  getArtifactHeroImage,
} from "./artifactRecordDisplay";
import ArtifactRecordSection from "./ArtifactRecordSection";

export type ArtifactRelatedPanelProps = {
  seed: RelatedArtifactSeed | null;
};

export default function ArtifactRelatedPanel({ seed }: ArtifactRelatedPanelProps) {
  if (!seed) {
    return (
      <ArtifactRecordSection label="RELATED OBJECT SEED">
        <div className="artifact-record-related">
          <CapsuleObjectPlate label="Local archive" className="artifact-record-related__plate" />
          <div>
            <h2 className="artifact-record-related__title">This artifact begins a collection.</h2>
            <p className="artifact-record-related__meta">Waiting for shared material, origin, class, collection, text, or pressure.</p>
          </div>
        </div>
      </ArtifactRecordSection>
    );
  }

  const record = normalizeArtifactRecord(seed.artifact);
  const title = getArtifactDisplayTitle(seed.artifact, record);
  const accession = getArtifactAccessionLabel(seed.artifact);
  const heroImage = getArtifactHeroImage(seed.artifact, record);

  return (
    <ArtifactRecordSection label="RELATED OBJECT SEED">
      <div className="artifact-record-related">
        <CapsuleObjectPlate
          imageSrc={heroImage || undefined}
          imageAlt={`${title} related artifact`}
          label={accession}
          className="artifact-record-related__plate"
        />
        <div>
          <h2 className="artifact-record-related__title">Another object is nearby.</h2>
          <p className="artifact-record-related__meta">{title}</p>
          <p className="artifact-record-related__meta">{seed.reason}</p>
          <Link to={getArtifactRoute(seed.artifact.id)} className="artifact-record-action mt-3">
            Open related artifact
          </Link>
        </div>
      </div>
    </ArtifactRecordSection>
  );
}
