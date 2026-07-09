import { useRef } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/navigation";
import type { Artifact, ArtifactRecord } from "../../types/artifact";
import type { RelatedArtifactSeed } from "../../utils/relatedArtifacts";
import CapsuleBottomDock from "../system/CapsuleBottomDock";
import CapsulePhoneFrame from "../system/CapsulePhoneFrame";
import {
  formatPreservedDate,
  getArtifactAccessionLabel,
  getArtifactDisplayTitle,
  getArtifactHeroImage,
  getArtifactPrimaryMetadata,
  getArtifactRecordSections,
} from "./artifactRecordDisplay";
import ArtifactEvidenceGrid from "./ArtifactEvidenceGrid";
import ArtifactIdentityBlock from "./ArtifactIdentityBlock";
import ArtifactMetadataRail from "./ArtifactMetadataRail";
import ArtifactProvenancePanel from "./ArtifactProvenancePanel";
import ArtifactRecordHero from "./ArtifactRecordHero";
import ArtifactRecordSection from "./ArtifactRecordSection";
import ArtifactRelatedPanel from "./ArtifactRelatedPanel";
import "./artifactRecord.css";

export type ArtifactRecordScreenProps = {
  artifact: Artifact;
  record: ArtifactRecord;
  relatedSeed: RelatedArtifactSeed | null;
  showObservationInput: boolean;
  observationText: string;
  onObservationTextChange: (value: string) => void;
  onToggleObservationInput: () => void;
  onAddObservation: () => void;
  onSeal: () => void;
};

const formatBytes = (bytes?: number) => {
  if (typeof bytes !== "number") return "not recorded";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
};

const getRenderLabel = (artifact: Artifact) => {
  if (artifact.render?.pristineStatus === "success" && artifact.pristineSpecimenDataUrl) return "Pristine specimen";
  if (artifact.render?.localRenderStatus === "success" && artifact.artifactRenderDataUrl) return "Preserved render";
  if (artifact.specimenImageDataUrl) return "Object field render";
  return undefined;
};

export default function ArtifactRecordScreen({
  artifact,
  record,
  relatedSeed,
  showObservationInput,
  observationText,
  onObservationTextChange,
  onToggleObservationInput,
  onAddObservation,
  onSeal,
}: ArtifactRecordScreenProps) {
  const timelineRef = useRef<HTMLDetailsElement>(null);
  const sealed = artifact.preservationState === "sealed";
  const title = getArtifactDisplayTitle(artifact, record);
  const accessionLabel = getArtifactAccessionLabel(artifact);
  const heroImage = getArtifactHeroImage(artifact, record);
  const preservedLabel = formatPreservedDate(record.identity.createdAt || artifact.createdAt || artifact.capturePoint);
  const metadataRows = getArtifactPrimaryMetadata(artifact, record);
  const sections = getArtifactRecordSections(artifact, record);
  const userContextSection = sections.find((section) => section.id === "user-context");
  const observedSection = sections.find((section) => section.id === "observed");
  const inferredSection = sections.find((section) => section.id === "inferred");
  const sourceSection = sections.find((section) => section.id === "source");
  const modelSection = sections.find((section) => section.id === "model");
  const sourceEvidenceImage = record.source.originalImageDataUrl || artifact.sourceImageDataUrl || record.source.specimenImageDataUrl || artifact.specimenImageDataUrl || null;
  const renderLabel = getRenderLabel(artifact);

  return (
    <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
      <div className="artifact-record-screen">
        <div className="artifact-record-topbar">
          <Link to={ROUTES.vault} className="artifact-record-icon-button" aria-label="Return to Vault">
            &lt;
          </Link>
          <p className="artifact-record-accession">ARTIFACT RECORD / {accessionLabel}</p>
          <span className="artifact-record-icon-button" aria-hidden="true">...</span>
        </div>

        <ArtifactRecordHero accessionLabel={accessionLabel} imageSrc={heroImage} imageAlt={`${title} preserved object`} revealed={sealed} />
        <ArtifactIdentityBlock title={title} preservedLabel={preservedLabel} stateLabel={artifact.preservationState} />
        <ArtifactMetadataRail rows={metadataRows} />

        <div className="artifact-record-action-grid" aria-label="Artifact actions">
          <Link to={ROUTES.vault} className="artifact-record-action artifact-record-action-primary">
            Back to Vault
          </Link>
          <Link to={ROUTES.capture} className="artifact-record-action">
            Preserve Another
          </Link>
          {!sealed ? (
            <button type="button" onClick={onSeal} className="artifact-record-action">
              Seal Record
            </button>
          ) : null}
          <button type="button" onClick={onToggleObservationInput} className="artifact-record-action">
            Add Observation
          </button>
          <button type="button" onClick={() => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="artifact-record-action">
            View Timeline
          </button>
        </div>

        {showObservationInput ? (
          <section className="artifact-record-observation">
            <label className="artifact-record-section__label" htmlFor="artifact-record-observation">
              OBSERVATION
            </label>
            <textarea
              id="artifact-record-observation"
              value={observationText}
              onChange={(event) => onObservationTextChange(event.target.value)}
              placeholder="Add a precise note about this artifact..."
            />
            <button type="button" onClick={onAddObservation} className="artifact-record-action artifact-record-action-primary mt-3 w-full">
              Save Observation
            </button>
          </section>
        ) : null}

        <div className="artifact-record-divider" />

        {userContextSection ? <ArtifactRecordSection label={userContextSection.label} rows={userContextSection.rows} /> : null}
        {observedSection ? <ArtifactRecordSection label={observedSection.label} rows={observedSection.rows} /> : null}
        {inferredSection ? <ArtifactRecordSection label={inferredSection.label} rows={inferredSection.rows} /> : null}
        {sourceSection ? (
          <ArtifactEvidenceGrid
            label={sourceSection.label}
            rows={sourceSection.rows}
            imageSrc={sourceEvidenceImage}
            imageAlt={`${title} source evidence`}
          />
        ) : null}
        {modelSection ? <ArtifactProvenancePanel label={modelSection.label} rows={modelSection.rows} /> : null}
        <ArtifactRelatedPanel seed={relatedSeed} />

        <details ref={timelineRef} className="artifact-record-detail">
          <summary>Artifact Timeline</summary>
          <div className="artifact-record-rows">
            {artifact.timeline.map((event) => (
              <div key={event.id} className="artifact-record-row">
                <dt className="artifact-record-row__label">{new Date(event.date).toLocaleString()}</dt>
                <dd className="artifact-record-row__value">
                  <strong className="font-medium">{event.label}</strong>
                  <span className="mt-1 block text-[var(--capsule-muted)]">{event.description}</span>
                </dd>
              </div>
            ))}
          </div>
        </details>

        <details className="artifact-record-detail">
          <summary>Observations</summary>
          {artifact.observations.length ? (
            <div className="artifact-record-rows">
              {artifact.observations.map((observation) => (
                <div key={observation.id} className="artifact-record-row">
                  <dt className="artifact-record-row__label">{new Date(observation.createdAt).toLocaleString()}</dt>
                  <dd className="artifact-record-row__value">{observation.text}</dd>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[0.68rem] text-[var(--capsule-muted)]">No observations added.</p>
          )}
        </details>

        {(artifact.ai || renderLabel) ? (
          <details className="artifact-record-detail">
            <summary>Render Metadata</summary>
            {renderLabel ? (
              <p className="mt-4 font-mono text-[0.58rem] leading-5 text-[var(--capsule-muted)]">
                {renderLabel} / {artifact.render?.provider || "local"} / motion {artifact.render?.motionSeed || "unseeded"}
              </p>
            ) : null}
            {artifact.ai ? (
              <p className="mt-4 font-mono text-[0.58rem] leading-5 text-[var(--capsule-muted)]">
                {artifact.ai.provider} / {artifact.ai.model} / {artifact.ai.usedFallback ? "structured generator" : "vision"}
              </p>
            ) : null}
          </details>
        ) : null}

        {artifact.storage ? (
          <details className="artifact-record-detail">
            <summary>Storage Diagnostics</summary>
            <div className="mt-4 grid gap-2 font-mono text-[0.58rem] leading-5 text-[var(--capsule-muted)]">
              <p>Method: {artifact.storage.method}</p>
              <p>Status: {artifact.storage.lastSaveStatus}</p>
              <p>Compression: {artifact.storage.compressionApplied ? "applied" : "not applied"}</p>
              <p>Local metadata: {formatBytes(artifact.storage.localStorageBytes)}</p>
              <p>IndexedDB images: {formatBytes(artifact.storage.indexedDbImageBytes)}</p>
              <p>Source: {formatBytes(artifact.storage.sourceStoredBytes)} stored</p>
              {artifact.storage.artifactRenderStoredBytes !== undefined ? <p>Render: {formatBytes(artifact.storage.artifactRenderStoredBytes)}</p> : null}
              {artifact.storage.droppedImageFields?.length ? <p>Dropped: {artifact.storage.droppedImageFields.join(", ")}</p> : null}
              {artifact.storage.lastSaveReason ? <p>Reason: {artifact.storage.lastSaveReason}</p> : null}
            </div>
          </details>
        ) : null}
      </div>
    </CapsulePhoneFrame>
  );
}
