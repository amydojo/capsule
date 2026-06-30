import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import SpecimenNotebook from "../components/SpecimenNotebook";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { primaryArtifact } from "../data/artifacts";

export default function Rediscover() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen pb-12">
      <TopBar fossilId={primaryArtifact.id} />
      <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--capsule-line)] bg-white/62 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--capsule-blue)]" />
            <span className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">RESURFACED</span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold uppercase tracking-[0.04em] sm:text-5xl">{primaryArtifact.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--capsule-ash)]">{primaryArtifact.essence}</p>
        </div>

        <SpecimenStage mode="artifact" />

        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--capsule-line)] bg-white/56 p-6">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">FOSSIL ID {primaryArtifact.id}</p>
            <p className="mt-3 text-2xl font-semibold">Captured 423 days ago</p>
          </div>
          <div className="rounded-2xl border border-[var(--capsule-line)] bg-white/56 p-6">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">Preservation State</p>
            <p className="mt-3 text-2xl font-semibold">active, not yet sealed</p>
          </div>
        </div>

        <section className="mx-auto mt-5 grid max-w-4xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--capsule-line)] bg-white/50 p-5">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">THEN</p>
            <div className="mt-4 flex min-h-36 items-center justify-center rounded-xl border border-[var(--capsule-line)] bg-[var(--capsule-paper)]">
              <SpecimenNotebook small />
            </div>
            <p className="mt-4 text-sm text-[var(--capsule-ash)]">Captured</p>
            <p className="font-mono text-sm text-[var(--capsule-graphite)]">Jun 30, 2026</p>
          </div>
          <div className="rounded-2xl border border-[var(--capsule-line)] bg-white/50 p-5">
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">NOW</p>
            <div className="mt-4 flex min-h-36 items-center justify-center rounded-xl border border-[rgba(39,110,241,0.22)] bg-[var(--capsule-paper)]">
              <SpecimenNotebook small refined />
            </div>
            <p className="mt-4 text-sm text-[var(--capsule-ash)]">Specimen</p>
            <p className="font-mono text-sm text-[var(--capsule-graphite)]">Aug 06, 2027</p>
          </div>
        </section>

        <div className="mx-auto mt-7 flex max-w-4xl flex-wrap gap-3">
          <button
            onClick={() => navigate(`/artifact/${primaryArtifact.id}`)}
            className="rounded-full bg-[var(--capsule-graphite)] px-5 py-3 text-sm font-medium text-white"
          >
            Open Artifact
          </button>
          <button className="rounded-full border border-[var(--capsule-line)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--capsule-graphite)]">Add Observation</button>
          <button className="rounded-full border border-[var(--capsule-line)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--capsule-graphite)]">Seal Fossil</button>
        </div>
        <BottomNav />
      </section>
    </main>
  );
}
