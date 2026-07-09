import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ArtifactRecordScreen from "../components/artifact-record/ArtifactRecordScreen";
import CapsuleArchiveSlip from "../components/system/CapsuleArchiveSlip";
import CapsuleBottomDock from "../components/system/CapsuleBottomDock";
import CapsulePhoneFrame from "../components/system/CapsulePhoneFrame";
import CapsuleScreenHeader from "../components/system/CapsuleScreenHeader";
import { ROUTES } from "../constants/navigation";
import { addObservation, loadArtifacts, sealArtifact } from "../services/artifactStorage";
import type { Artifact } from "../types/artifact";
import { normalizeArtifactRecord } from "../utils/artifactRecord";
import { findRelatedArtifactSeed } from "../utils/relatedArtifacts";

export default function ArtifactView() {
  const { id } = useParams();
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

  const record = useMemo(() => (artifact ? normalizeArtifactRecord(artifact) : undefined), [artifact]);
  const relatedSeed = useMemo(() => (artifact ? findRelatedArtifactSeed(artifact, allArtifacts) : null), [allArtifacts, artifact]);

  const handleSeal = async () => {
    if (!artifact) return;
    const updated = await sealArtifact(artifact.id);
    if (updated) {
      setArtifact(updated);
      setAllArtifacts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    }
  };

  const handleAddObservation = async () => {
    if (!artifact) return;
    const updated = await addObservation(artifact.id, observationText);
    if (updated) {
      setArtifact(updated);
      setAllArtifacts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setObservationText("");
      setShowObservationInput(false);
    }
  };

  if (isLoading) {
    return (
      <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
        <CapsuleScreenHeader eyebrow="ARTIFACT RECORD" title="Opening record." subtitle={id || "CAP-LOCAL"} />
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

  if (!artifact || !record) {
    return (
      <CapsulePhoneFrame mode="archive" footer={<CapsuleBottomDock />}>
        <CapsuleScreenHeader eyebrow="ARTIFACT RECORD" title="No preserved object here." subtitle={id || "CAP-LOCAL"} />
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

  return (
    <ArtifactRecordScreen
      artifact={artifact}
      record={record}
      relatedSeed={relatedSeed}
      showObservationInput={showObservationInput}
      observationText={observationText}
      onObservationTextChange={setObservationText}
      onToggleObservationInput={() => setShowObservationInput((value) => !value)}
      onAddObservation={() => void handleAddObservation()}
      onSeal={() => void handleSeal()}
    />
  );
}
