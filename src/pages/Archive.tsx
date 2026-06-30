import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ContinuityBar from "../components/ContinuityBar";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { artifacts, primaryArtifact } from "../data/artifacts";

export default function Archive() {
  return (
    <main className="min-h-screen pb-12">
      <TopBar fossilId={primaryArtifact.id} />
      <section className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--capsule-line)] pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">ARCHIVE</p>
            <h1 className="mt-2 text-4xl font-semibold uppercase tracking-[0.04em]">Artifacts</h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--capsule-ash)]">Preserved objects. Documented continuity.</p>
        </div>

        <div className="space-y-3">
          {artifacts.map((artifact, index) => {
            const content = (
              <article className="grid gap-5 rounded-2xl border border-[var(--capsule-line)] bg-white/56 p-3 transition hover:border-[rgba(39,110,241,0.35)] hover:bg-white/76 sm:grid-cols-[11rem_1fr] sm:items-center">
                <SpecimenStage mode="compact" />
                <div className="grid gap-5 md:grid-cols-[1fr_12rem_11rem_11rem] md:items-center">
                  <div>
                    <p className="font-mono text-xs text-[var(--capsule-blue)]">{artifact.id}</p>
                    <h2 className="mt-1 text-xl font-semibold text-[var(--capsule-graphite)]">{artifact.title}</h2>
                    <p className="mt-2 text-sm text-[var(--capsule-ash)]">{artifact.capturePoint}</p>
                  </div>
                  <div>
                    <p className="mono-label mb-2 text-[0.62rem] text-[var(--capsule-ash)]">Continuity Score</p>
                    <ContinuityBar value={artifact.continuityScore} />
                  </div>
                  <div>
                    <p className="mono-label text-[0.62rem] text-[var(--capsule-ash)]">Captured</p>
                    <p className="mt-2 text-sm text-[var(--capsule-graphite)]">{artifact.capturePoint.split(", 1")[0]}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--capsule-ash)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--capsule-blue)]" />
                    {artifact.preservationState}
                  </div>
                </div>
              </article>
            );

            return index === 0 ? (
              <Link key={artifact.id} to={`/artifact/${artifact.id}`} className="block">
                {content}
              </Link>
            ) : (
              <div key={artifact.id}>{content}</div>
            );
          })}
        </div>
        <BottomNav />
      </section>
    </main>
  );
}
