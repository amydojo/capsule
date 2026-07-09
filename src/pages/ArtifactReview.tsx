import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import CapsuleArchiveSlip from "../components/system/CapsuleArchiveSlip";
import CapsuleBottomDock from "../components/system/CapsuleBottomDock";
import CapsuleObjectPlate from "../components/system/CapsuleObjectPlate";
import CapsulePhoneFrame from "../components/system/CapsulePhoneFrame";
import CapsuleScreenHeader from "../components/system/CapsuleScreenHeader";
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
    "mt-1.5 w-full border-0 border-b border-[rgba(17,16,17,0.1)] bg-transparent px-0 py-1.5 text-[0.72rem] leading-5 text-[var(--capsule-black)] outline-none placeholder:text-[rgba(125,118,108,0.7)] focus:border-[var(--capsule-red)]";
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(name, event.target.value);

  return (
    <label className="block">
      <span className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">{label}</span>
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
    <dl className="grid gap-2 text-[0.68rem] leading-5 text-[var(--capsule-black)]">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[5.6rem_1fr] gap-3 border-b border-[rgba(17,16,17,0.08)] pb-2">
          <dt className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">{label}</dt>
          <dd>{value}</dd>
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
      <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
        <CapsuleScreenHeader
          eyebrow="Artifact Review"
          title="No artifact is waiting for review."
          subtitle="Return to Preserve to form a record before filing it in the Vault."
        />
        <CapsuleArchiveSlip
          eyebrow="REVIEW STATE"
          title="Nothing pending."
          rows={[
            ["Pending record", "none"],
            ["Vault save", "not started"],
          ]}
          className="mt-8"
        />
        <button type="button" onClick={() => navigate(ROUTES.capture)} className="mt-5 h-10 w-full rounded-full bg-[var(--capsule-black)] px-5 text-[0.62rem] font-semibold text-white">
          Return to Preserve
        </button>
      </CapsulePhoneFrame>
    );
  }

  const heroImage = getArtifactHeroImage(pendingArtifact);
  const sourceImage = getArtifactSourceImage(pendingArtifact);
  const previewImage = heroImage || sourceImage;
  const observedRows: Array<[string, string]> = [
    ["Object label", record.observedFacts.objectLabel],
    ...(record.observedFacts.visibleText.length ? ([["Visible text", record.observedFacts.visibleText.join(", ")]] as Array<[string, string]>) : []),
    ...(record.observedFacts.shapeAndSilhouette.length ? ([["Shape", record.observedFacts.shapeAndSilhouette.join(", ")]] as Array<[string, string]>) : []),
    ...(record.observedFacts.marksAndWear.length ? ([["Wear", record.observedFacts.marksAndWear.join(", ")]] as Array<[string, string]>) : []),
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
    <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
      <CapsuleScreenHeader
        eyebrow="Artifact Review"
        title="Check the record before it enters the Vault."
        subtitle="Capsule separated what it saw from what it inferred. Make small corrections before saving."
        marker
      />

      <CapsuleObjectPlate
        imageSrc={previewImage}
        imageAlt={`${record.identity.systemArtifactName} source preview`}
        label="Source preview"
        revealed
        className="mt-5"
      />

      <CapsuleArchiveSlip
        eyebrow="SOURCE PREVIEW"
        title={record.identity.userGivenName || record.identity.systemArtifactName}
        rows={[
          ["Specimen", record.source.specimenImageDataUrl ? "retained" : "not recorded"],
          ["Render", record.source.artifactRenderDataUrl ? "retained" : "not recorded"],
          ["Original", record.source.originalImageDataUrl ? "retained" : "not recorded"],
        ]}
        className="mt-4"
      />

      <section className="capsule-surface-paper mt-4 p-4">
        <p className="mono-label text-[0.5rem] text-[var(--capsule-red)]">OBSERVED BY CAPSULE</p>
        <div className="mt-4 space-y-4">
          <ReviewTextField label="Material tags" name="materialTags" value={fields.materialTags} placeholder="paper, ink, fabric" onChange={updateField} />
          <ReadoutRows rows={observedRows} />
          {confidenceRows.length ? (
            <div>
              <p className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">Confidence</p>
              <div className="mt-2">
                <ReadoutRows rows={confidenceRows} />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="capsule-surface-paper mt-4 p-4">
        <p className="mono-label text-[0.5rem] text-[var(--capsule-red)]">USER CONTEXT</p>
        <div className="mt-4 grid gap-3">
          <ReviewTextField label="Object name" name="objectName" value={fields.objectName} placeholder="what should Capsule call this?" onChange={updateField} />
          <ReviewTextField label="Origin" name="origin" value={fields.origin} placeholder="desk, car, kitchen" onChange={updateField} />
          <ReviewTextField label="Collection" name="collection" value={fields.collection} placeholder="desk objects, printed matter" onChange={updateField} />
          {record.source.userNote ? (
            <div className="border-b border-[rgba(17,16,17,0.08)] pb-2">
              <p className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">Why keep it</p>
              <p className="mt-1.5 text-[0.7rem] leading-5 text-[var(--capsule-black)]">{record.source.userNote}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="capsule-surface-paper mt-4 p-4">
        <p className="mono-label text-[0.5rem] text-[var(--capsule-red)]">INFERRED BY CAPSULE</p>
        <div className="mt-4 space-y-4">
          <ReviewTextField label="Artifact class" name="artifactClass" value={fields.artifactClass} placeholder="continuity artifact" onChange={updateField} />
          <ReviewTextField label="Continuity note" name="continuityNote" value={fields.continuityNote} placeholder="a short continuity note" multiline onChange={updateField} />
          {record.interpretiveLayer.memoryHypothesis ? (
            <div className="border-b border-[rgba(17,16,17,0.08)] pb-2">
              <p className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">Memory hypothesis</p>
              <p className="mt-1.5 text-[0.7rem] leading-5 text-[var(--capsule-black)]">{record.interpretiveLayer.memoryHypothesis}</p>
            </div>
          ) : null}
          <ReadoutRows rows={pressureTraceRows} />
          <p className="text-[0.66rem] leading-5 text-[var(--capsule-muted)]">
            {record.interpretiveLayer.doNotOverclaim ? "Interpretation is marked cautious." : "Interpretation caution flag is not set."}
          </p>
        </div>
      </section>

      <CapsuleArchiveSlip
        eyebrow="MODEL PROVENANCE"
        title="Record systems"
        rows={modelRows.length ? modelRows : [["Model metadata", "not recorded"]]}
        className="mt-4"
      />

      {error ? <p className="mt-4 text-[0.7rem] leading-5 text-[var(--capsule-red)]">{error}</p> : null}
      <div className="mt-5 grid gap-2">
        <button type="button" disabled={isSaving} onClick={() => void saveReview()} className="h-10 rounded-full bg-[var(--capsule-black)] px-5 text-[0.62rem] font-semibold text-white disabled:opacity-55">
          {isSaving ? "Filing Record..." : "Save to Vault"}
        </button>
        <button type="button" disabled={isSaving} onClick={discardReview} className="h-9 rounded-full border border-[rgba(17,16,17,0.1)] px-5 text-[0.58rem] font-medium text-[var(--capsule-muted)] disabled:opacity-55">
          Discard Review
        </button>
      </div>
    </CapsulePhoneFrame>
  );
}
