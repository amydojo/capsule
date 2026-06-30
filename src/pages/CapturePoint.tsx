import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ContinuityBar from "../components/ContinuityBar";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { primaryArtifact } from "../data/artifacts";

const prompts = [
  ["Object", "Field notebook, first page of Capsule's origin notes."],
  ["Why now?", "Capturing the moment Capsule becomes real."],
  ["What should future you not forget?", "The spark, the intention, and the system we promised."],
  ["Capture date", "Jun 30, 2026, 1:42 PM"],
];

export default function CapturePoint() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen pb-12">
      <TopBar fossilId={primaryArtifact.id} />
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_24rem] lg:px-10">
        <div>
          <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">CAPTURE POINT</p>
          <h1 className="mt-2 text-4xl font-semibold uppercase tracking-[0.04em]">Capture an object into Capsule</h1>
          <div className="mt-8">
            <SpecimenStage mode="artifact" showScanLine />
          </div>
        </div>

        <aside className="lg:pt-24">
          <div className="space-y-3">
            {prompts.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[var(--capsule-line)] bg-white/62 p-5">
                <p className="mono-label text-[0.65rem] text-[var(--capsule-ash)]">{label}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--capsule-graphite)]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--capsule-line)] bg-white/62 p-5">
            <p className="mono-label text-[0.65rem] text-[var(--capsule-ash)]">Preservation preview</p>
            <p className="mt-3 text-sm text-[var(--capsule-graphite)]">Ink, paper, elastic</p>
            <div className="mt-4">
              <ContinuityBar value={primaryArtifact.continuityScore} />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button className="rounded-full border border-[var(--capsule-line)] bg-white/70 px-5 py-3 text-sm font-medium text-[var(--capsule-graphite)] transition hover:border-[var(--capsule-ash)]">
              Retake
            </button>
            <button
              onClick={() => navigate("/chamber", { state: { preserve: true } })}
              className="rounded-full bg-[var(--capsule-graphite)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(23,25,24,0.16)] transition hover:translate-y-[-1px]"
            >
              Add to Capsule
            </button>
          </div>
        </aside>
      </section>
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <BottomNav />
      </div>
    </main>
  );
}
