import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RelatedObjectSeed from "../components/artifact/RelatedObjectSeed";
import CapsuleArchiveSlip from "../components/system/CapsuleArchiveSlip";
import CapsuleBottomDock from "../components/system/CapsuleBottomDock";
import CapsuleObjectPlate from "../components/system/CapsuleObjectPlate";
import CapsulePhoneFrame from "../components/system/CapsulePhoneFrame";
import CapsuleScreenHeader from "../components/system/CapsuleScreenHeader";
import { ROUTES } from "../constants/navigation";
import { addObservation, loadArtifacts, sealArtifact } from "../services/artifactStorage";
import type { Artifact } from "../types/artifact";
import { getArtifactHeroImage, getArtifactSourceImage } from "../utils/artifactImage";
import { normalizeArtifactRecord } from "../utils/artifactRecord";
import { findRelatedArtifactSeed } from "../utils/relatedArtifacts";

const polishVisibleDetail = (detail: string) => {
  const normalized = detail.toLowerCase();
  if (normalized.includes("uploaded") && normalized.includes("object image")) return "selected specimen region";
  if (normalized.includes("user-provided") && normalized.includes("object context")) return "selected specimen evidence retained";
  if (normalized.includes("mixed") && normalized.includes("material") && normalized.includes("inferred")) return "surface details pending closer analysis";
  return detail;
};

const formatBytes = (bytes?: number) => {
  if (typeof bytes !== "number") return "not recorded";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
};

const formatPercent = (value: number) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;

const formatFieldLabel = (value: string) =>
  value
    .replace(/\./g, " / ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatPressureLabel = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const CompactRows = ({ rows }: { rows: Array<[string, string]> }) => (
  <dl className="grid gap-2 text-[0.68rem] leading-5 text-[var(--capsule-black)]">
    {rows.map(([label, value]) => (
      <div key={label} className="grid grid-cols-[5.6rem_1fr] gap-3 border-b border-[rgba(17,16,17,0.08)] pb-2 last:border-0">
        <dt className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">{label}</dt>
        <dd>{value}</dd>
      </div>
    ))}
  </dl>
);

export default function ArtifactView() {
  const { id } = useParams();
  const timelineRef = useRef<HTMLDetailsElement>(null);
  const [artifact, setArtifact] = useState<Artifact | undefined>();
  const [allArtifacts, setAllArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [showObservationInput, setShowObservationInput] = useState(false);
  const [observationText, setObservationText] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(Boolean(id));
    if (!id) {
      setArtifact(undefined);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void loadArtifacts().then((loadedArtifacts) => {
      if (cancelled) return;
      const loadedArtifact = loadedArtifacts.find((item) => item.id === id);
      setAllArtifacts(loadedArtifacts);
      setArtifact(loadedArtifact);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
        <CapsuleScreenHeader eyebrow="Artifact Record" title="Opening record." subtitle={id || "CAP-00000"} />
        <CapsuleArchiveSlip
          eyebrow="RECORD STATE"
          title="Retrieving preserved object."
          rows={[
            ["Capsule ID", id || "not recorded"],
            ["Vault", "reading"],
          ]}
          className="mt-8"
        />
      </CapsulePhoneFrame>
    );
  }

  if (!artifact) {
    return (
      <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
        <CapsuleScreenHeader eyebrow="Artifact Record" title="No preserved object here." subtitle={id || "CAP-00000"} />
        <CapsuleArchiveSlip
          eyebrow="RECORD STATE"
          title="Artifact record not found."
          rows={[
            ["Capsule ID", id || "not recorded"],
            ["Vault", "no match"],
          ]}
          className="mt-8"
        />
        <Link to={ROUTES.vault} className="mt-5 flex h-10 items-center justify-center rounded-full bg-[var(--capsule-black)] px-5 text-[0.62rem] font-semibold text-white">
          Return to Vault
        </Link>
      </CapsulePhoneFrame>
    );
  }

  const sealed = artifact.preservationState === "sealed";
  const artifactRecord = normalizeArtifactRecord(artifact);
  const recordTitle = artifactRecord.identity.userGivenName || artifactRecord.identity.systemArtifactName;
  const heroImage = getArtifactHeroImage(artifact);
  const sourceImage = getArtifactSourceImage(artifact);
  const provenanceImage = sourceImage && sourceImage !== heroImage ? sourceImage : undefined;
  const visibleDetails = artifactRecord.observedFacts.shapeAndSilhouette.map(polishVisibleDetail);
  const marksAndWear = artifactRecord.observedFacts.marksAndWear.map(polishVisibleDetail);
  const observedRows: Array<[string, string]> = [
    ["Object label", artifactRecord.observedFacts.objectLabel],
    ["Materials", artifactRecord.observedFacts.materialTags.join(", ") || "not classified"],
    ...(artifactRecord.observedFacts.colors.length ? ([["Colors", artifactRecord.observedFacts.colors.join(", ")]] as Array<[string, string]>) : []),
    ...(artifactRecord.observedFacts.visibleText.length ? ([["Visible text", artifactRecord.observedFacts.visibleText.join(", ")]] as Array<[string, string]>) : []),
    ...(artifactRecord.observedFacts.sceneContext ? ([["Scene", artifactRecord.observedFacts.sceneContext]] as Array<[string, string]>) : []),
  ];
  const userContextRows: Array<[string, string]> = [
    ...(artifactRecord.identity.userGivenName ? ([["Object name", artifactRecord.identity.userGivenName]] as Array<[string, string]>) : []),
    ...(artifactRecord.source.userNote ? ([["Why keep it", artifactRecord.source.userNote]] as Array<[string, string]>) : []),
    ...(artifactRecord.source.origin ? ([["Origin", artifactRecord.source.origin]] as Array<[string, string]>) : []),
    ...(artifactRecord.identity.collection ? ([["Collection", artifactRecord.identity.collection]] as Array<[string, string]>) : []),
  ];
  const pressureTraceRows = Object.entries(artifactRecord.interpretiveLayer.pressureTrace).map(
    ([label, value]) => [formatPressureLabel(label), formatPercent(value)] as [string, string],
  );
  const confidenceRows = Object.entries(artifactRecord.modelProvenance.confidenceByField).map(
    ([label, value]) => [formatFieldLabel(label), formatPercent(value)] as [string, string],
  );
  const modelRows: Array<[string, string]> = [
    ...(artifactRecord.modelProvenance.visionModel ? ([["Vision model", artifactRecord.modelProvenance.visionModel]] as Array<[string, string]>) : []),
    ...(artifactRecord.modelProvenance.detectorModel ? ([["Detector model", artifactRecord.modelProvenance.detectorModel]] as Array<[string, string]>) : []),
    ...(artifactRecord.modelProvenance.segmentationModel ? ([["Segmentation model", artifactRecord.modelProvenance.segmentationModel]] as Array<[string, string]>) : []),
    ...(artifactRecord.modelProvenance.depthModel ? ([["Depth model", artifactRecord.modelProvenance.depthModel]] as Array<[string, string]>) : []),
    ...(artifactRecord.modelProvenance.embeddingModel ? ([["Embedding model", artifactRecord.modelProvenance.embeddingModel]] as Array<[string, string]>) : []),
    ...(artifact.ai ? ([[artifact.ai.usedFallback ? "Generator" : "Provider", `${artifact.ai.provider} / ${artifact.ai.model}`]] as Array<[string, string]>) : []),
  ];
  const sourceEvidenceImage = artifactRecord.source.originalImageDataUrl || provenanceImage;
  const sourceEvidenceRows: Array<[string, string]> = [
    ["Original", artifactRecord.source.originalImageDataUrl ? "retained" : "not recorded"],
    ["Specimen", artifactRecord.source.specimenImageDataUrl ? "retained" : "not recorded"],
    ["Isolated", artifactRecord.source.isolatedSpecimenDataUrl ? "retained" : "not recorded"],
    ["Render", artifactRecord.source.artifactRenderDataUrl ? "retained" : "not recorded"],
    ["Boundary", artifactRecord.source.objectBoundary ? "recorded" : "not recorded"],
  ];
  const relatedSeed = findRelatedArtifactSeed(artifact, allArtifacts);
  const renderLabel =
    artifact.render?.pristineStatus === "success" && artifact.pristineSpecimenDataUrl
      ? "Pristine specimen"
      : artifact.render?.localRenderStatus === "success" && artifact.artifactRenderDataUrl
        ? "Preserved render"
        : artifact.specimenImageDataUrl
          ? "Object field render"
          : undefined;

  const handleSeal = async () => {
    const updated = await sealArtifact(artifact.id);
    if (updated) {
      setArtifact(updated);
      setAllArtifacts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    }
  };

  const handleAddObservation = async () => {
    const updated = await addObservation(artifact.id, observationText);
    if (updated) {
      setArtifact(updated);
      setAllArtifacts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setObservationText("");
      setShowObservationInput(false);
    }
  };

  return (
    <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
      <CapsuleScreenHeader
        eyebrow="Artifact Record"
        title={recordTitle}
        subtitle={`Preserved ${artifact.capturePoint}`}
        marker={sealed}
      />

      <CapsuleObjectPlate
        imageSrc={heroImage}
        imageAlt={recordTitle}
        label={artifact.id}
        revealed={sealed}
        className="mt-5"
      />

      <CapsuleArchiveSlip
        eyebrow="OBJECT IDENTITY"
        title={artifactRecord.interpretiveLayer.artifactClass}
        rows={[
          ["Capsule ID", artifact.id],
          ["Origin", artifactRecord.source.origin || "not recorded"],
          ["Collection", artifactRecord.identity.collection || "not recorded"],
          ["State", artifact.preservationState],
        ]}
        className="mt-4"
      >
        <p className="mt-3 text-[0.72rem] leading-5 text-[var(--capsule-muted)]">{artifactRecord.interpretiveLayer.continuityNote}</p>
      </CapsuleArchiveSlip>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to={ROUTES.vault} className="flex h-9 items-center justify-center rounded-full bg-[var(--capsule-black)] px-4 text-[0.56rem] font-semibold text-white">
          Back to Vault
        </Link>
        <Link to={ROUTES.capture} className="flex h-9 items-center justify-center rounded-full border border-[rgba(17,16,17,0.1)] px-4 text-[0.56rem] font-medium text-[var(--capsule-muted)]">
          Preserve Another
        </Link>
        {!sealed ? (
          <button type="button" onClick={() => void handleSeal()} className="h-9 rounded-full border border-[rgba(17,16,17,0.1)] px-4 text-[0.56rem] font-medium text-[var(--capsule-muted)]">
            Seal Record
          </button>
        ) : null}
        <button type="button" onClick={() => setShowObservationInput((value) => !value)} className="h-9 rounded-full border border-[rgba(17,16,17,0.1)] px-4 text-[0.56rem] font-medium text-[var(--capsule-muted)]">
          Add Observation
        </button>
        <button type="button" onClick={() => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="col-span-2 h-9 rounded-full border border-[rgba(17,16,17,0.1)] px-4 text-[0.56rem] font-medium text-[var(--capsule-muted)]">
          View Timeline
        </button>
      </div>

      {showObservationInput ? (
        <section className="capsule-surface-paper mt-4 p-4">
          <label className="mono-label text-[0.5rem] text-[var(--capsule-red)]">OBSERVATION</label>
          <textarea
            value={observationText}
            onChange={(event) => setObservationText(event.target.value)}
            rows={3}
            placeholder="Add a precise note about this artifact..."
            className="mt-3 w-full resize-none border-b border-[rgba(17,16,17,0.1)] bg-transparent text-[0.72rem] leading-5 text-[var(--capsule-black)] outline-none placeholder:text-[var(--capsule-muted)]"
          />
          <button type="button" onClick={() => void handleAddObservation()} className="mt-4 h-9 w-full rounded-full bg-[var(--capsule-black)] px-5 text-[0.58rem] font-semibold text-white">
            Save Observation
          </button>
        </section>
      ) : null}

      <section className="capsule-surface-paper mt-4 p-4">
        <p className="mono-label text-[0.5rem] text-[var(--capsule-red)]">OBSERVED BY CAPSULE</p>
        <div className="mt-4">
          <CompactRows rows={observedRows} />
        </div>
        {visibleDetails.length ? (
          <div className="mt-4">
            <p className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">Shape and silhouette</p>
            <ul className="mt-2 space-y-2 text-[0.68rem] leading-5 text-[var(--capsule-black)]">
              {visibleDetails.map((detail, index) => (
                <li key={`${detail}-${index}`} className="border-b border-[rgba(17,16,17,0.08)] pb-2">{detail}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {marksAndWear.length ? (
          <div className="mt-4">
            <p className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">Marks and wear</p>
            <ul className="mt-2 space-y-2 text-[0.68rem] leading-5 text-[var(--capsule-black)]">
              {marksAndWear.map((detail, index) => (
                <li key={`${detail}-${index}`} className="border-b border-[rgba(17,16,17,0.08)] pb-2">{detail}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <CapsuleArchiveSlip
        eyebrow="USER CONTEXT"
        title={userContextRows.length ? "Attached provenance" : "No user context attached."}
        rows={userContextRows.length ? userContextRows : [["Context", "not recorded"]]}
        className="mt-4"
      />

      <section className="capsule-surface-paper mt-4 p-4">
        <p className="mono-label text-[0.5rem] text-[var(--capsule-red)]">INFERRED BY CAPSULE</p>
        <p className="mt-3 text-[0.72rem] leading-5 text-[var(--capsule-black)]">{artifactRecord.interpretiveLayer.continuityNote}</p>
        {artifactRecord.interpretiveLayer.memoryHypothesis ? (
          <p className="mt-3 border-t border-[rgba(17,16,17,0.08)] pt-3 text-[0.68rem] leading-5 text-[var(--capsule-muted)]">{artifactRecord.interpretiveLayer.memoryHypothesis}</p>
        ) : null}
        <div className="mt-4">
          <CompactRows rows={pressureTraceRows} />
        </div>
        <p className="mt-3 text-[0.64rem] leading-5 text-[var(--capsule-muted)]">
          {artifactRecord.interpretiveLayer.doNotOverclaim ? "Interpretation marked cautious." : "Interpretation caution flag not set."}
        </p>
      </section>

      {sourceEvidenceImage ? (
        <CapsuleObjectPlate
          imageSrc={sourceEvidenceImage}
          imageAlt={`${recordTitle} source evidence`}
          label="Source evidence"
          className="mt-4"
        />
      ) : null}

      <CapsuleArchiveSlip eyebrow="SOURCE EVIDENCE" title="Retained source references" rows={sourceEvidenceRows} className="mt-4" />

      <CapsuleArchiveSlip
        eyebrow="MODEL PROVENANCE"
        title="Record systems"
        rows={modelRows.length ? modelRows : [["Model metadata", "not recorded"]]}
        className="mt-4"
      >
        {confidenceRows.length ? (
          <div className="mt-4">
            <CompactRows rows={confidenceRows} />
          </div>
        ) : null}
      </CapsuleArchiveSlip>

      <RelatedObjectSeed seed={relatedSeed} />

      <details ref={timelineRef} className="mt-8 border-t border-[rgba(17,16,17,0.1)] pt-5">
        <summary className="cursor-pointer mono-label text-[0.5rem] text-[var(--capsule-muted)]">ARTIFACT TIMELINE</summary>
        <div className="mt-4 space-y-4">
          {artifact.timeline.map((event) => (
            <div key={event.id} className="border-b border-[rgba(17,16,17,0.08)] pb-4">
              <p className="font-mono text-[0.58rem] text-[var(--capsule-muted)]">{new Date(event.date).toLocaleString()}</p>
              <p className="mt-2 text-[0.72rem] font-semibold text-[var(--capsule-black)]">{event.label}</p>
              <p className="mt-1 text-[0.68rem] leading-5 text-[var(--capsule-muted)]">{event.description}</p>
            </div>
          ))}
        </div>
      </details>

      <details className="mt-8 border-t border-[rgba(17,16,17,0.1)] pt-5">
        <summary className="cursor-pointer mono-label text-[0.5rem] text-[var(--capsule-muted)]">OBSERVATIONS</summary>
        {artifact.observations.length ? (
          <div className="mt-4 space-y-3">
            {artifact.observations.map((observation) => (
              <div key={observation.id} className="rounded-[14px] border border-[rgba(17,16,17,0.08)] bg-[var(--capsule-paper)] p-3">
                <p className="text-[0.68rem] leading-5 text-[var(--capsule-black)]">{observation.text}</p>
                <p className="mt-2 font-mono text-[0.56rem] text-[var(--capsule-muted)]">{new Date(observation.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[0.68rem] text-[var(--capsule-muted)]">No observations added.</p>
        )}
      </details>

      {(artifact.ai || renderLabel) ? (
        <details className="mt-8 border-t border-[rgba(17,16,17,0.1)] pt-5">
          <summary className="cursor-pointer mono-label text-[0.5rem] text-[var(--capsule-muted)]">RENDER METADATA</summary>
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
        <details className="mt-8 border-t border-[rgba(17,16,17,0.1)] pt-5">
          <summary className="cursor-pointer mono-label text-[0.5rem] text-[var(--capsule-muted)]">STORAGE DIAGNOSTICS</summary>
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
    </CapsulePhoneFrame>
  );
}
