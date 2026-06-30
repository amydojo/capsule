import { motion } from "framer-motion";
import { useState } from "react";
import { useParams } from "react-router-dom";
import ArtifactActions from "../components/ArtifactActions";
import MetadataTable from "../components/MetadataTable";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { getArtifact } from "../data/artifacts";

export default function ArtifactView() {
  const { id } = useParams();
  const artifact = getArtifact(id);
  const [sealed, setSealed] = useState(false);
  const preservationState = sealed ? "active, sealed" : artifact.preservationState;

  return (
    <main className="min-h-screen pb-16">
      <TopBar fossilId={artifact.id} />
      <section className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <SpecimenStage mode="artifact" />
        </motion.div>
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--capsule-blue)]" />
            <span className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">OBJECT</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold uppercase tracking-[0.04em] sm:text-5xl">{artifact.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--capsule-ash)]">{artifact.essence}</p>
        </div>
        <div className="mt-10">
          <MetadataTable artifact={artifact} preservationState={preservationState} />
          <ArtifactActions sealed={sealed} onSeal={() => setSealed(true)} />
        </div>
      </section>
    </main>
  );
}
