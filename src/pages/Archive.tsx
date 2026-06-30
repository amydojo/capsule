import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ContinuityBar from "../components/ContinuityBar";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { artifacts as sampleArtifacts, primaryArtifact } from "../data/artifacts";
import { getArtifacts } from "../services/artifactStorage";
import type { Artifact, ArtifactLifecycleStatus } from "../types/artifact";

const ArtifactRow = ({ artifact, linked = true }: { artifact: Artifact; linked?: boolean }) => {
  const content = (
    <article className="grid gap-6 rounded-[1.7rem] border border-[rgba(229,226,220,0.78)] bg-white/42 p-4 transition hover:border-[rgba(47,126,247,0.26)] hover:bg-white/66 sm:grid-cols-[17rem_1fr] sm:items-center">
      <SpecimenStage mode="compact" imageDataUrl={artifact.thumbnailDataUrl || artifact.imageDataUrl} imageAlt={artifact.title} />
      <div className="grid gap-6 md:grid-cols-[1fr_13rem] md:items-center">
        <div>
          <p className="font-mono text-xs text-[var(--capsule-blue)]">{artifact.id}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--capsule-graphite)]">{artifact.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--capsule-ash)]">{artifact.essence || artifact.classification}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mono-label text-[0.58rem] text-[var(--capsule-ash)]">Captured</p>
              <p className="mt-2 text-sm text-[var(--capsule-graphite)]">{artifact.capturePoint}</p>
            </div>
            <div>
              <p className="mono-label text-[0.58rem] text-[var(--capsule-ash)]">Preservation State</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--capsule-graphite)]">
                <span className="h-2 w-2 rounded-full bg-[var(--capsule-blue)]" />
                {artifact.preservationState}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="mono-label mb-3 text-[0.58rem] text-[var(--capsule-ash)]">Continuity Score</p>
          <ContinuityBar value={artifact.continuityScore} />
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

  return (
    <main className="min-h-screen pb-12">
      <TopBar fossilId={generatedArtifacts[0]?.id || primaryArtifact.id} />
      <section className="mx-auto w-full max-w-[78rem] px-5 sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-[var(--capsule-line)] pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">ARCHIVE</p>
            <h1 className="mt-2 text-4xl font-semibold uppercase tracking-[0.04em] sm:text-5xl">Artifacts</h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--capsule-ash)]">Preserved objects. Documented continuity.</p>
        </div>

        {generatedArtifacts.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_12rem]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artifacts"
              className="rounded-full border border-[var(--capsule-line)] bg-white/58 px-5 py-3 text-sm outline-none placeholder:text-[var(--capsule-ash)]"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ArtifactLifecycleStatus | "all")}
              className="rounded-full border border-[var(--capsule-line)] bg-white/58 px-5 py-3 text-sm outline-none"
            >
              <option value="all">All states</option>
              <option value="active">Active</option>
              <option value="sealed">Sealed</option>
              <option value="rediscovered">Rediscovered</option>
            </select>
          </div>
        )}

        {generatedArtifacts.length === 0 ? (
          <div className="rounded-[1.7rem] border border-[var(--capsule-line)] bg-white/42 p-10 text-center">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">No preserved objects yet.</p>
            <button onClick={() => navigate("/capture")} className="primary-button mt-6 px-6 py-3 text-sm font-medium">
              Capture Object
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArtifacts.map((artifact) => (
              <ArtifactRow key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}

        {(generatedArtifacts.length === 0 || filteredArtifacts.length === 0) && (
          <section className="mt-12 border-t border-[var(--capsule-line)] pt-8">
            <p className="mono-label mb-5 text-[0.68rem] text-[var(--capsule-ash)]">Sample objects</p>
            <div className="space-y-4">
              {sampleArtifacts.slice(0, 3).map((artifact) => (
                <ArtifactRow key={artifact.id} artifact={artifact} linked={false} />
              ))}
            </div>
          </section>
        )}
        <BottomNav />
      </section>
    </main>
  );
}
