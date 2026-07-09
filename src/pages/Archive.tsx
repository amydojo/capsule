import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CapsuleArchiveSlip from "../components/system/CapsuleArchiveSlip";
import CapsuleBottomDock from "../components/system/CapsuleBottomDock";
import CapsuleObjectPlate from "../components/system/CapsuleObjectPlate";
import CapsulePhoneFrame from "../components/system/CapsulePhoneFrame";
import CapsuleScreenHeader from "../components/system/CapsuleScreenHeader";
import { getArtifactRoute, ROUTES } from "../constants/navigation";
import { artifacts as sampleArtifacts } from "../data/artifacts";
import { loadArtifacts } from "../services/artifactStorage";
import type { Artifact, ArtifactLifecycleStatus } from "../types/artifact";
import { getArtifactHeroImage, hasObjectFieldPending } from "../utils/artifactImage";

const ArtifactIndexRow = ({ artifact, linked = true }: { artifact: Artifact; linked?: boolean }) => {
  const heroImage = getArtifactHeroImage(artifact);
  const content = (
    <article className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 border-b border-white/10 py-3 last:border-b-0">
      <div className="grid h-11 w-11 place-items-center rounded-[10px] border border-black/[0.05] bg-[var(--capsule-paper)]">
        {heroImage ? <img src={heroImage} alt={artifact.title} className="max-h-9 max-w-9 object-contain" /> : <span className="h-5 w-7 rounded-sm bg-[var(--capsule-printed-bone)]" aria-hidden="true" />}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[0.48rem] text-[var(--capsule-linen-ash)]">{artifact.id}</p>
        <h3 className="mt-1 truncate text-[0.72rem] font-medium text-white">{artifact.title}</h3>
        <p className="mt-1 truncate text-[0.55rem] text-[var(--capsule-linen-ash)]">{artifact.origin}</p>
      </div>
    </article>
  );

  if (!linked) return content;

  return (
    <Link to={getArtifactRoute(artifact.id)} className="block">
      {content}
    </Link>
  );
};

export default function Archive() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArtifactLifecycleStatus | "all">("all");
  const [generatedArtifacts, setGeneratedArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    let cancelled = false;
    void loadArtifacts().then((artifacts) => {
      if (!cancelled) setGeneratedArtifacts(artifacts);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredArtifacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return generatedArtifacts.filter((artifact) => {
      const matchesQuery =
        !normalizedQuery || [artifact.title, artifact.commonName, artifact.classification, artifact.essence, artifact.origin].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || artifact.preservationState === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [generatedArtifacts, query, statusFilter]);

  const featuredArtifact = filteredArtifacts[0];
  const indexArtifacts = featuredArtifact ? filteredArtifacts.slice(1, 4) : filteredArtifacts.slice(0, 3);
  const referenceArtifacts = sampleArtifacts.slice(0, 3);
  const objectCount = generatedArtifacts.length;
  const objectCountLabel = `${objectCount} total`;

  return (
    <CapsulePhoneFrame mode="preservation" footer={<CapsuleBottomDock mode="preservation" />}>
      <CapsuleScreenHeader
        mode="preservation"
        eyebrow="Vault"
        subtitle="Object archive"
        trailing={{ label: "+", ariaLabel: "Preserve a new object", onClick: () => navigate(ROUTES.capture) }}
      />

      <section className="pt-8">
        <h1 className="text-[1.78rem] font-medium leading-[1.02] tracking-normal text-white">All Objects</h1>
        <p className="mt-2 font-mono text-[0.56rem] text-[var(--capsule-linen-ash)]">{objectCountLabel}</p>
        <div className="mt-7 h-px bg-white/12" />

        {generatedArtifacts.length > 0 && (
          <div className="mt-5 grid gap-2">
            <label className="block">
              <span className="sr-only">Search artifact records</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search records"
                className="h-9 w-full rounded-full border border-white/10 bg-white/[0.045] px-4 text-[0.66rem] text-white outline-none placeholder:text-[var(--capsule-linen-ash)]"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by preservation state</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ArtifactLifecycleStatus | "all")}
                className="h-9 w-full rounded-full border border-white/10 bg-[var(--capsule-black)] px-4 text-[0.62rem] text-[var(--capsule-linen-ash)] outline-none"
              >
                <option value="all">All states</option>
                <option value="active">Active</option>
                <option value="sealed">Sealed</option>
                <option value="rediscovered">Rediscovered</option>
              </select>
            </label>
          </div>
        )}

        {generatedArtifacts.length === 0 ? (
          <CapsuleArchiveSlip
            mode="preservation"
            eyebrow="VAULT READY"
            title="The first preserved object will appear here."
            className="mt-6"
          >
            <p className="mt-3 text-[0.62rem] leading-4 text-[var(--capsule-linen-ash)]">Present source evidence to begin the archive.</p>
            <button type="button" onClick={() => navigate(ROUTES.capture)} className="mt-5 h-9 w-full rounded-full bg-[var(--capsule-cream)] text-[0.62rem] font-semibold text-[var(--capsule-black)]">
              Preserve Object
            </button>
          </CapsuleArchiveSlip>
        ) : featuredArtifact ? (
          <Link to={getArtifactRoute(featuredArtifact.id)} className="mt-6 block rounded-[18px] border border-white/10 bg-white/[0.045] p-3">
            <div className="grid grid-cols-[102px_minmax(0,1fr)] gap-4">
              <CapsuleObjectPlate mode="archive" imageSrc={getArtifactHeroImage(featuredArtifact)} imageAlt={featuredArtifact.title} className="min-h-[102px]" />
              <div className="min-w-0 py-2">
                <p className="mono-label text-[0.44rem] text-[var(--capsule-linen-ash)]">{featuredArtifact.id}</p>
                <h2 className="mt-3 text-[0.95rem] font-semibold leading-tight text-white">{featuredArtifact.title}</h2>
                <p className="mt-2 max-h-12 overflow-hidden text-[0.58rem] leading-4 text-[var(--capsule-linen-ash)]">{featuredArtifact.essence || featuredArtifact.classification}</p>
                {hasObjectFieldPending(featuredArtifact) && <p className="mt-2 mono-label text-[0.42rem] text-[var(--capsule-linen-ash)]">Object field pending</p>}
                <span className="mt-3 block h-1 w-1 rounded-full bg-[var(--capsule-red)]" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ) : (
          <CapsuleArchiveSlip mode="preservation" eyebrow="NO MATCHES" title="No local record matches that search." className="mt-6" />
        )}

        <div className="mt-8 flex items-center justify-between">
          <p className="mono-label text-[0.48rem] text-[var(--capsule-linen-ash)]">Recently added</p>
          <p className="text-[0.56rem] text-[var(--capsule-linen-ash)]">View all</p>
        </div>

        <div className="mt-3">
          {(indexArtifacts.length ? indexArtifacts : referenceArtifacts).map((artifact) => (
            <ArtifactIndexRow key={artifact.id} artifact={artifact} linked={indexArtifacts.length > 0} />
          ))}
        </div>
      </section>
    </CapsulePhoneFrame>
  );
}
