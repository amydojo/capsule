import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ContinuityBar from "../components/ContinuityBar";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { artifacts as sampleArtifacts, primaryArtifact } from "../data/artifacts";
import { getArtifacts } from "../services/artifactStorage";
import type { Artifact, ArtifactLifecycleStatus } from "../types/artifact";
import { getArtifactThumbnailDataUrl, hasObjectFieldPending } from "../utils/artifactImage";

const ArtifactRow = ({ artifact, linked = true }: { artifact: Artifact; linked?: boolean }) => {
  const specimenImage = getArtifactThumbnailDataUrl(artifact);
  const content = (
    <article className="grid gap-5 rounded-[1.55rem] border border-[var(--capsule-line-dark)] bg-white/[0.045] p-3 transition hover:border-[rgba(154,149,86,0.45)] hover:bg-white/[0.07] sm:grid-cols-[15rem_1fr] sm:items-center">
      <SpecimenStage mode="compact" tone="dark" imageDataUrl={specimenImage} imageAlt={artifact.title} />
      <div className="grid gap-6 md:grid-cols-[1fr_13rem] md:items-center">
        <div>
          <p className="font-mono text-xs text-[var(--capsule-mineral-olive)]">{artifact.id}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--capsule-bone)]">{artifact.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--capsule-ash-dim)]">{artifact.essence || artifact.classification}</p>
          {hasObjectFieldPending(artifact) && <p className="mt-3 mono-label text-[0.58rem] text-[var(--capsule-ash-dim)]">Object field pending.</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mono-label text-[0.58rem] text-[var(--capsule-ash-dim)]">Captured</p>
              <p className="mt-2 text-sm text-[var(--capsule-bone)]">{artifact.capturePoint}</p>
            </div>
            <div>
              <p className="mono-label text-[0.58rem] text-[var(--capsule-ash-dim)]">Preservation State</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--capsule-bone)]">
                <span className="h-2 w-2 rounded-full bg-[var(--capsule-mineral-olive)]" />
                {artifact.preservationState}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="mono-label mb-3 text-[0.58rem] text-[var(--capsule-ash-dim)]">Continuity</p>
          <ContinuityBar value={artifact.continuityScore} tone="dark" />
        </div>
      </div>
    </article>
  );

  return linked ? (
    <Link to={`/artifact/${artifact.id}`} className="block">
      {content}
    </Link>
  ) : (
    content
  );
};

export default function Archive() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArtifactLifecycleStatus | "all">("all");
  const generatedArtifacts = getArtifacts();

  const filteredArtifacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return generatedArtifacts.filter((artifact) => {
      const matchesQuery =
        !normalizedQuery ||
        [artifact.title, artifact.commonName, artifact.classification, artifact.essence].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || artifact.preservationState === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [generatedArtifacts, query, statusFilter]);

  const featuredArtifact = filteredArtifacts[0];
  const indexArtifacts = featuredArtifact ? filteredArtifacts.slice(1) : filteredArtifacts;

  return (
    <main className="instrument-shell min-h-[100dvh] overflow-x-hidden pb-12">
      <TopBar fossilId={generatedArtifacts[0]?.id || primaryArtifact.id} tone="dark" />
      <section className="mx-auto w-full max-w-[78rem] px-5 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--capsule-line-dark)] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">ARCHIVE</p>
            <h1 className="mt-2 text-4xl font-semibold uppercase tracking-[0.04em] text-[var(--capsule-bone)] sm:text-5xl">Vault</h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--capsule-ash-dim)]">{generatedArtifacts.length} preserved objects. Documented continuity.</p>
        </div>

        {generatedArtifacts.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_12rem]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artifacts"
              className="rounded-full border border-[var(--capsule-line-dark)] bg-white/[0.055] px-5 py-3 text-sm text-[var(--capsule-bone)] outline-none placeholder:text-[var(--capsule-ash-dim)]"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ArtifactLifecycleStatus | "all")}
              className="rounded-full border border-[var(--capsule-line-dark)] bg-[var(--capsule-panel-black)] px-5 py-3 text-sm text-[var(--capsule-bone)] outline-none"
            >
              <option value="all">All states</option>
              <option value="active">Active</option>
              <option value="sealed">Sealed</option>
              <option value="rediscovered">Rediscovered</option>
            </select>
          </div>
        )}

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {[
            "All",
            "Artifacts",
            "Specimens",
            "Media",
          ].map((label, index) => (
            <span key={label} className={`mono-label shrink-0 rounded-full border px-4 py-2 text-[0.56rem] ${index === 0 ? "border-[rgba(154,149,86,0.48)] bg-[rgba(154,149,86,0.12)] text-[var(--capsule-mineral-olive-bright)]" : "border-[var(--capsule-line-dark)] bg-white/[0.04] text-[var(--capsule-ash-dim)]"}`}>
              {label}
            </span>
          ))}
        </div>

        {generatedArtifacts.length === 0 ? (
          <div className="rounded-[1.7rem] border border-[var(--capsule-line-dark)] bg-white/[0.045] p-10 text-center">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">No preserved objects yet.</p>
            <button onClick={() => navigate("/capture")} className="mt-6 min-h-11 rounded-full bg-[var(--capsule-bone)] px-6 py-3 text-sm font-medium text-[var(--capsule-graphite-black)]">
              Capture Object
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {featuredArtifact && (
              <Link to={`/artifact/${featuredArtifact.id}`} className="block rounded-[2rem] border border-[rgba(154,149,86,0.45)] bg-[rgba(154,149,86,0.08)] p-3 shadow-[0_26px_78px_rgba(0,0,0,0.28)]">
                <p className="mono-label mb-3 px-2 text-[0.58rem] text-[var(--capsule-mineral-olive-bright)]">Featured Artifact</p>
                <ArtifactRow artifact={featuredArtifact} linked={false} />
                <div className="mt-4 flex justify-center gap-2">
                  <span className="h-1.5 w-5 rounded-full bg-[var(--capsule-mineral-olive)]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/22" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/22" />
                </div>
              </Link>
            )}
            {indexArtifacts.length > 0 && <p className="mono-label px-1 pt-4 text-[0.62rem] text-[var(--capsule-ash-dim)]">Object Index</p>}
            {indexArtifacts.map((artifact) => (
              <ArtifactRow key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}

        {(generatedArtifacts.length === 0 || filteredArtifacts.length === 0) && (
          <section className="mt-12 border-t border-[var(--capsule-line-dark)] pt-8">
            <p className="mono-label mb-5 text-[0.68rem] text-[var(--capsule-ash-dim)]">Sample objects</p>
            <div className="space-y-4">
              {sampleArtifacts.slice(0, 3).map((artifact) => (
                <ArtifactRow key={artifact.id} artifact={artifact} linked={false} />
              ))}
            </div>
          </section>
        )}
        <BottomNav tone="dark" />
      </section>
    </main>
  );
}
