import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import SourceEvidenceSlip from "../components/artifact/SourceEvidenceSlip";
import TopContextHeader from "../components/system/TopContextHeader";
import { getArtifactRoute, ROUTES } from "../constants/navigation";
import { usePreservationSession } from "../context/PreservationSessionContext";
import { saveArtifact } from "../services/artifactStorage";
import type { Artifact } from "../types/artifact";
import { getArtifactHeroImage, getArtifactSourceImage } from "../utils/artifactImage";
import { normalizeArtifactRecord } from "../utils/artifactRecord";

type ReviewFields = {
  objectName: string;
  materialTags: string;
  artifactClass: string;
  continuityNote: string;
  origin: string;
  collection: string;
};

type ReviewFieldName = keyof ReviewFields;

type ReviewTextFieldProps = {
  label: string;
  name: ReviewFieldName;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  onChange: (name: ReviewFieldName, value: string) => void;
};

const emptyReviewFields: ReviewFields = {
  objectName: "",
  materialTags: "",
  artifactClass: "",
  continuityNote: "",
  origin: "",
  collection: "",
};

const trimOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

const splitTags = (value: string) => value.split(",").map(trimOptional).filter((tag): tag is string => Boolean(tag));

const formatPercent = (value: number) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;

const formatLabel = (value: string) =>
  value
    .replace(/\./g, " / ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const toReviewFields = (artifact: Artifact): ReviewFields => {
  const record = normalizeArtifactRecord(artifact);
  return {
    objectName: record.identity.userGivenName || artifact.objectName || "",
    materialTags: record.observedFacts.materialTags.join(", "),
    artifactClass: record.interpretiveLayer.artifactClass,
    continuityNote: record.interpretiveLayer.continuityNote,
    origin: record.source.origin || artifact.origin || "",
    collection: record.identity.collection || artifact.collection || "",
  };
};

const applyReviewEdits = (artifact: Artifact, fields: ReviewFields): Artifact => {
  const currentRecord = normalizeArtifactRecord(artifact);
  const objectName = trimOptional(fields.objectName);
  const origin = trimOptional(fields.origin) || "field capture";
  const collection = trimOptional(fields.collection);
  const materialTags = splitTags(fields.materialTags);
  const safeMaterialTags = materialTags.length ? materialTags : currentRecord.observedFacts.materialTags.length ? currentRecord.observedFacts.materialTags : ["unknown material"];
  const artifactClass = trimOptional(fields.artifactClass) || currentRecord.interpretiveLayer.artifactClass;
  const continuityNote = trimOptional(fields.continuityNote) || currentRecord.interpretiveLayer.continuityNote;

  const draft: Artifact = {
    ...artifact,
    title: objectName || artifact.title,
    commonName: objectName?.toLowerCase() || artifact.commonName,
    objectName,
    origin,
    collection,
    material: safeMaterialTags,
    classification: artifactClass,
    essence: continuityNote,
    record: {
      ...currentRecord,
      identity: {
        ...currentRecord.identity,
        userGivenName: objectName,
        collection,
      },
      source: {
        ...currentRecord.source,
        origin,
      },
      observedFacts: {
        ...currentRecord.observedFacts,
        materialTags: safeMaterialTags,
      },
      interpretiveLayer: {
        ...currentRecord.interpretiveLayer,
        artifactClass,
        continuityNote,
      },
    },
  };

  return {
    ...draft,
    record: normalizeArtifactRecord(draft),
  };
};

function ReviewTextField({ label, name, value, placeholder, multiline = false, onChange }: ReviewTextFieldProps) {
  const baseClass =
    "mt-2 w-full rounded-xl border border-[var(--capsule-hairline)] bg-[rgba(244,240,231,0.68)] px-3 py-2.5 text-sm leading-6 text-[var(--capsule-black)] outline-none transition placeholder:text-[var(--capsule-muted)] focus:border-[var(--capsule-red)]";
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(name, event.target.value);

  return (
    <label className="block">
      <span className="mono-label text-[0.58rem] text-[var(--capsule-muted)]">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={handleChange} rows={3} placeholder={placeholder} className={`${baseClass} resize-none`} />
      ) : (
        <input value={value} onChange={handleChange} placeholder={placeholder} className={baseClass} />
      )}
    </label>
  );
}

function ReadoutRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-3 text-sm leading-6 text-[var(--capsule-black)] sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="border-b border-[rgba(216,207,192,0.72)] pb-3">
          <dt className="mono-label text-[0.56rem] text-[var(--capsule-muted)]">{label}</dt>
          <dd className="mt-1">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ArtifactReview() {
  const navigate = useNavigate();
  const { session, resetSession } = usePreservationSession();
  const pendingArtifact = session.status === "complete" ? session.artifact : undefined;
  const record = useMemo(() => (pendingArtifact ? normalizeArtifactRecord(pendingArtifact) : undefined), [pendingArtifact]);
  const [fields, setFields] = useState<ReviewFields>(emptyReviewFields);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pendingArtifact) return;
    setFields(toReviewFields(pendingArtifact));
    setError("");
  }, [pendingArtifact]);

  const updateField = (name: ReviewFieldName, value: string) => {
    setFields((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const discardReview = () => {
    resetSession();
    navigate(ROUTES.capture);
  };

  const saveReview = async () => {
    if (!pendingArtifact) return;
    setIsSaving(true);
    setError("");

    try {
      const reviewedArtifact = applyReviewEdits(pendingArtifact, fields);
      const savedArtifact = await saveArtifact(reviewedArtifact);
      resetSession();
      navigate(getArtifactRoute(savedArtifact.id));
    } catch {
      setError("Capsule could not file this review. Try again before leaving this screen.");
      setIsSaving(false);
    }
  };

  if (!pendingArtifact || !record) {
    return (
      <main className="capsule-mode-archive min-h-screen pb-[calc(env(safe-area-inset-bottom)+4rem)]">
        <TopContextHeader title="ARTIFACT REVIEW" context="Pending record" objectId="No pending artifact" />
        <section className="mx-auto flex min-h-[62vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
          <p className="mono-label text-[0.68rem] text-[var(--capsule-muted)]">ARTIFACT REVIEW</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[0.01em] text-[var(--capsule-black)] sm:text-5xl">No artifact is waiting for review.</h1>
          <button type="button" onClick={() => navigate(ROUTES.capture)} className="primary-button mt-8 inline-flex px-6 py-3 text-sm font-medium">
            Return to Preserve
          </button>
        </section>
        <BottomNav />
      </main>
    );
  }

  const heroImage = getArtifactHeroImage(pendingArtifact);
  const sourceImage = getArtifactSourceImage(pendingArtifact);
  const previewImage = heroImage || sourceImage;
  const observedRows: Array<[string, string]> = [
    ["Object label", record.observedFacts.objectLabel],
    ...(record.observedFacts.visibleText.length ? ([["Visible text", record.observedFacts.visibleText.join(", ")]] as Array<[string, string]>) : []),
    ...(record.observedFacts.shapeAndSilhouette.length ? ([["Shape / silhouette", record.observedFacts.shapeAndSilhouette.join(", ")]] as Array<[string, string]>) : []),
    ...(record.observedFacts.marksAndWear.length ? ([["Marks and wear", record.observedFacts.marksAndWear.join(", ")]] as Array<[string, string]>) : []),
  ];
  const confidenceRows = Object.entries(record.modelProvenance.confidenceByField).map(
    ([label, value]) => [formatLabel(label), formatPercent(value)] as [string, string],
  );
  const pressureTraceRows = Object.entries(record.interpretiveLayer.pressureTrace).map(
    ([label, value]) => [formatLabel(label), formatPercent(value)] as [string, string],
  );
  const modelRows: Array<[string, string]> = [
    ...(record.modelProvenance.visionModel ? ([["Vision model", record.modelProvenance.visionModel]] as Array<[string, string]>) : []),
    ...(pendingArtifact.ai ? ([[pendingArtifact.ai.usedFallback ? "Generator" : "Provider", `${pendingArtifact.ai.provider} / ${pendingArtifact.ai.model}`]] as Array<[string, string]>) : []),
  ];

  return (
    <main className="capsule-mode-archive min-h-screen pb-[calc(env(safe-area-inset-bottom)+5rem)]">
      <TopContextHeader title="ARTIFACT REVIEW" context="Before Vault save" objectId={record.identity.capsuleId} />
      <section className="mx-auto w-full max-w-[76rem] px-4 pb-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl pb-8 pt-2">
          <p className="mono-label text-[0.68rem] text-[var(--capsule-red)]">ARTIFACT REVIEW</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0.01em] text-[var(--capsule-black)] sm:text-5xl">Check the record before it enters the Vault.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--capsule-muted)] sm:text-base">
            Capsule separated what it saw from what it inferred. Make small corrections before saving.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-6">
            {previewImage && (
              <SourceEvidenceSlip
                title="SOURCE PREVIEW"
                sourceImageSrc={previewImage}
                sourceImageAlt={`${record.identity.systemArtifactName} source preview`}
                metrics={[
                  { label: "Specimen", value: record.source.specimenImageDataUrl ? "retained" : "not recorded" },
                  { label: "Render", value: record.source.artifactRenderDataUrl ? "retained" : "not recorded" },
                  { label: "Original", value: record.source.originalImageDataUrl ? "retained" : "not recorded" },
                ]}
              />
            )}

            <section className="capsule-surface-paper p-5">
              <p className="mono-label text-[0.58rem] text-[var(--capsule-red)]">OBSERVED BY CAPSULE</p>
              <div className="mt-5 space-y-5">
                <ReviewTextField label="Material tags" name="materialTags" value={fields.materialTags} placeholder="paper, ink, fabric" onChange={updateField} />
                <ReadoutRows rows={observedRows} />
                {confidenceRows.length ? (
                  <div>
                    <p className="mono-label text-[0.56rem] text-[var(--capsule-muted)]">Confidence</p>
                    <div className="mt-3">
                      <ReadoutRows rows={confidenceRows} />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="capsule-surface-paper p-5">
              <p className="mono-label text-[0.58rem] text-[var(--capsule-red)]">USER CONTEXT</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ReviewTextField label="Object name" name="objectName" value={fields.objectName} placeholder="what should Capsule call this?" onChange={updateField} />
                <ReviewTextField label="Origin" name="origin" value={fields.origin} placeholder="desk, car, kitchen" onChange={updateField} />
                <ReviewTextField label="Collection" name="collection" value={fields.collection} placeholder="desk objects, printed matter" onChange={updateField} />
                {record.source.userNote && (
                  <div className="border-b border-[rgba(216,207,192,0.72)] pb-3">
                    <p className="mono-label text-[0.56rem] text-[var(--capsule-muted)]">Why keep it</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--capsule-black)]">{record.source.userNote}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="capsule-surface-paper p-5">
              <p className="mono-label text-[0.58rem] text-[var(--capsule-red)]">INFERRED BY CAPSULE</p>
              <div className="mt-5 space-y-5">
                <ReviewTextField label="Artifact class" name="artifactClass" value={fields.artifactClass} placeholder="continuity artifact" onChange={updateField} />
                <ReviewTextField label="Continuity note" name="continuityNote" value={fields.continuityNote} placeholder="a short continuity note" multiline onChange={updateField} />
                {record.interpretiveLayer.memoryHypothesis && (
                  <div className="border-b border-[rgba(216,207,192,0.72)] pb-3">
                    <p className="mono-label text-[0.56rem] text-[var(--capsule-muted)]">Memory hypothesis</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--capsule-black)]">{record.interpretiveLayer.memoryHypothesis}</p>
                  </div>
                )}
                <div>
                  <p className="mono-label text-[0.56rem] text-[var(--capsule-muted)]">Pressure trace</p>
                  <div className="mt-3">
                    <ReadoutRows rows={pressureTraceRows} />
                  </div>
                </div>
                <p className="text-xs leading-5 text-[var(--capsule-muted)]">
                  {record.interpretiveLayer.doNotOverclaim ? "Interpretation is marked cautious." : "Interpretation caution flag is not set."}
                </p>
              </div>
            </section>

            <section className="capsule-surface-paper p-5">
              <p className="mono-label text-[0.58rem] text-[var(--capsule-red)]">MODEL PROVENANCE</p>
              <div className="mt-5">
                <ReadoutRows rows={modelRows.length ? modelRows : [["Model metadata", "not recorded"]]} />
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="capsule-surface-paper p-5">
              <p className="mono-label text-[0.58rem] text-[var(--capsule-red)]">SAVE ACTIONS</p>
              <p className="mt-4 text-sm leading-6 text-[var(--capsule-muted)]">Saving files this corrected artifact record in the Vault.</p>
              {error && <p className="mt-4 text-sm leading-6 text-[var(--capsule-red)]">{error}</p>}
              <div className="mt-6 grid gap-3">
                <button type="button" disabled={isSaving} onClick={() => void saveReview()} className="primary-button min-h-11 px-5 py-3 text-sm font-medium disabled:opacity-55">
                  {isSaving ? "Filing Record..." : "Save to Vault"}
                </button>
                <button type="button" disabled={isSaving} onClick={discardReview} className="secondary-button min-h-11 px-5 py-3 text-sm font-medium disabled:opacity-55">
                  Discard Review
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <BottomNav />
    </main>
  );
}
