import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ArtifactActions from "../components/ArtifactActions";
import BottomNav from "../components/BottomNav";
import MetadataTable from "../components/MetadataTable";
import PreservationField from "../components/PreservationField";
import RelatedObjectSeed from "../components/artifact/RelatedObjectSeed";
import SourceEvidenceSlip from "../components/artifact/SourceEvidenceSlip";
import TopBar from "../components/TopBar";
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
      <main className="capsule-mode-archive record-shell min-h-screen pb-[calc(env(safe-area-inset-bottom)+4rem)]">
        <TopBar fossilId={id || "CF-00000"} contextLabel="ARTIFACT RECORD" />
        <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
          <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">Opening artifact record.</p>
        </section>
      </main>
    );
  }

  if (!artifact) {
    return (
      <main className="capsule-mode-archive record-shell min-h-screen pb-[calc(env(safe-area-inset-bottom)+4rem)]">
        <TopBar fossilId={id || "CF-00000"} contextLabel="ARTIFACT RECORD" />
        <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
          <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">Artifact record not found.</p>
          <h1 className="mt-4 text-4xl font-semibold uppercase tracking-[0.04em]">No preserved object here</h1>
          <Link to={ROUTES.vault} className="primary-button mt-8 inline-flex px-6 py-3 text-sm font-medium">
            Return to Vault
          </Link>
        </section>
      </main>
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
    ...(artifactRecord.observedFacts.sceneContext ? ([["Scene context", artifactRecord.observedFacts.sceneContext]] as Array<[string, string]>) : []),
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
  const sourceEvidenceMetrics = [
    { label: "Original", value: artifactRecord.source.originalImageDataUrl ? "retained" : "not recorded" },
    { label: "Specimen", value: artifactRecord.source.specimenImageDataUrl ? "retained" : "not recorded" },
    { label: "Isolated", value: artifactRecord.source.isolatedSpecimenDataUrl ? "retained" : "not recorded" },
    { label: "Render", value: artifactRecord.source.artifactRenderDataUrl ? "retained" : "not recorded" },
    { label: "Boundary", value: artifactRecord.source.objectBoundary ? "recorded" : "not recorded" },
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
    <main className="capsule-mode-archive record-shell min-h-screen pb-[calc(env(safe-area-inset-bottom)+4rem)]">
      <TopBar fossilId={artifact.id} contextLabel="ARTIFACT RECORD" />
      <section className="mx-auto w-full max-w-[84rem] px-4 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[55rem] pb-7 pt-2 sm:pb-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--capsule-mineral-olive)] shadow-[0_0_0_6px_var(--capsule-mineral-olive-soft)]" />
            <span className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">ARTIFACT</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold uppercase tracking-[0.035em] sm:text-6xl">{recordTitle}</h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--capsule-ash)]">Preserved {artifact.capturePoint}</p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--capsule-ash)] sm:mt-6 sm:text-xl sm:leading-9">{artifactRecord.interpretiveLayer.continuityNote}</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <PreservationField mode="record" imageDataUrl={heroImage} imageAlt={recordTitle} motionSeed={artifact.render?.motionSeed} render={artifact.render} />
        </motion.div>
        <div className="mt-10 sm:mt-14">
          <ArtifactActions
            sealed={sealed}
            onSeal={() => void handleSeal()}
            onAddObservation={() => setShowObservationInput((value) => !value)}
            onViewTimeline={() => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
          <div className="mt-8">
            <MetadataTable artifact={artifact} />
          </div>
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
              <button onClick={() => void handleAddObservation()} className="primary-button mt-4 min-w-0 px-5 py-3 text-sm font-medium">
                Save Observation
              </button>
            </div>
          )}
        </div>

        <details className="mx-auto mt-14 max-w-4xl border-t border-[var(--capsule-line)] pt-8 sm:mt-20 sm:pt-10">
          <summary className="cursor-pointer mono-label text-[0.66rem] text-[var(--capsule-ash)]">Artifact Record</summary>
          <div className="mt-6 space-y-10">
            <section>
              <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Observed by Capsule</p>
              <dl className="mt-5 grid gap-3 text-sm leading-6 text-[var(--capsule-graphite)] sm:grid-cols-2">
                {observedRows.map(([label, value]) => (
                  <div key={label} className="border-b border-[rgba(229,226,220,0.62)] pb-3">
                    <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">{label}</dt>
                    <dd className="mt-1">{value}</dd>
                  </div>
                ))}
              </dl>
              {visibleDetails.length ? (
                <div className="mt-6">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">Shape and silhouette</p>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--capsule-graphite)]">
                    {visibleDetails.map((detail, index) => (
                      <li key={`${detail}-${index}`} className="border-b border-[rgba(229,226,220,0.62)] pb-3">{detail}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {marksAndWear.length ? (
                <div className="mt-6">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">Marks and wear</p>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--capsule-graphite)]">
                    {marksAndWear.map((detail, index) => (
                      <li key={`${detail}-${index}`} className="border-b border-[rgba(229,226,220,0.62)] pb-3">{detail}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section>
              <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">User Context</p>
              {userContextRows.length ? (
                <dl className="mt-5 grid gap-3 text-sm leading-6 text-[var(--capsule-graphite)] sm:grid-cols-2">
                  {userContextRows.map(([label, value]) => (
                    <div key={label} className="border-b border-[rgba(229,226,220,0.62)] pb-3">
                      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">{label}</dt>
                      <dd className="mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-5 text-sm leading-6 text-[var(--capsule-ash)]">No user context attached.</p>
              )}
            </section>

            <section>
              <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Inferred by Capsule</p>
              <div className="mt-5 grid gap-8 md:grid-cols-2">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">Continuity note</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--capsule-graphite)]">{artifactRecord.interpretiveLayer.continuityNote}</p>
                  {artifactRecord.interpretiveLayer.memoryHypothesis && (
                    <>
                      <p className="mt-6 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">Memory hypothesis</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--capsule-graphite)]">{artifactRecord.interpretiveLayer.memoryHypothesis}</p>
                    </>
                  )}
                  <p className="mt-6 text-xs leading-5 text-[var(--capsule-ash)]">
                    {artifactRecord.interpretiveLayer.doNotOverclaim ? "Interpretation marked cautious." : "Interpretation caution flag not set."}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">Pressure trace</p>
                  <dl className="mt-3 space-y-3 text-sm text-[var(--capsule-graphite)]">
                    {pressureTraceRows.map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[minmax(0,1fr)_4rem] gap-4 border-b border-[rgba(229,226,220,0.62)] pb-3">
                        <dt>{label}</dt>
                        <dd className="text-right font-mono text-xs text-[var(--capsule-ash)]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </section>

            <section>
              <p className="mono-label text-[0.66rem] text-[var(--capsule-ash)]">Model Provenance</p>
              {modelRows.length ? (
                <dl className="mt-5 grid gap-3 text-sm leading-6 text-[var(--capsule-graphite)] sm:grid-cols-2">
                  {modelRows.map(([label, value]) => (
                    <div key={label} className="border-b border-[rgba(229,226,220,0.62)] pb-3">
                      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">{label}</dt>
                      <dd className="mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-5 text-sm leading-6 text-[var(--capsule-ash)]">No model metadata recorded.</p>
              )}
              <dl className="mt-6 grid gap-3 text-sm leading-6 text-[var(--capsule-graphite)] sm:grid-cols-2">
                {confidenceRows.map(([label, value]) => (
                  <div key={label} className="border-b border-[rgba(229,226,220,0.62)] pb-3">
                    <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--capsule-ash)]">{label}</dt>
                    <dd className="mt-1 font-mono text-xs">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </details>

        {sourceEvidenceImage && (
          <div className="mx-auto mt-16 max-w-4xl">
            <SourceEvidenceSlip title="Source Evidence" sourceImageSrc={sourceEvidenceImage} sourceImageAlt={`${recordTitle} source evidence`} metrics={sourceEvidenceMetrics} />
          </div>
        )}

        <RelatedObjectSeed seed={relatedSeed} />

        <details ref={timelineRef} className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
          <summary className="cursor-pointer mono-label text-[0.66rem] text-[var(--capsule-ash)]">Artifact Timeline</summary>
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
        </details>

        <details className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
          <summary className="cursor-pointer mono-label text-[0.66rem] text-[var(--capsule-ash)]">Observations</summary>
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
        </details>

        {(artifact.ai || renderLabel) && (
          <details className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
            <summary className="cursor-pointer mono-label text-[0.66rem] text-[var(--capsule-ash)]">Render Metadata</summary>
            {renderLabel && (
              <p className="mt-6 font-mono text-xs text-[var(--capsule-ash)]">
                {renderLabel} / {artifact.render?.provider || "local"} / motion {artifact.render?.motionSeed || "unseeded"}
              </p>
            )}
            {artifact.ai && (
              <p className="mt-6 font-mono text-xs text-[var(--capsule-ash)]">
                {artifact.ai.provider} / {artifact.ai.model} / {artifact.ai.usedFallback ? "structured generator" : "vision"}
              </p>
            )}
          </details>
        )}

        {artifact.storage && (
          <details className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
            <summary className="cursor-pointer mono-label text-[0.66rem] text-[var(--capsule-ash)]">Storage Diagnostics</summary>
            <div className="mt-6 grid gap-3 font-mono text-xs leading-6 text-[var(--capsule-ash)] sm:grid-cols-2">
              <p>Method: {artifact.storage.method}</p>
              <p>Status: {artifact.storage.lastSaveStatus}</p>
              <p>Compression: {artifact.storage.compressionApplied ? "applied" : "not applied"}</p>
              <p>Local metadata: {formatBytes(artifact.storage.localStorageBytes)}</p>
              <p>IndexedDB images: {formatBytes(artifact.storage.indexedDbImageBytes)}</p>
              <p>Source: {formatBytes(artifact.storage.sourceStoredBytes)} stored</p>
              {artifact.storage.artifactRenderStoredBytes !== undefined && <p>Render: {formatBytes(artifact.storage.artifactRenderStoredBytes)}</p>}
              {artifact.storage.droppedImageFields?.length ? <p>Dropped: {artifact.storage.droppedImageFields.join(", ")}</p> : null}
              {artifact.storage.lastSaveReason && <p>Reason: {artifact.storage.lastSaveReason}</p>}
            </div>
          </details>
        )}

        <BottomNav />
      </section>
    </main>
  );
}
