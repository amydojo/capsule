import CapsuleObjectPlate from "../system/CapsuleObjectPlate";

export type ArtifactRecordHeroProps = {
  accessionLabel: string;
  imageSrc: string | null;
  imageAlt: string;
  revealed?: boolean;
};

export default function ArtifactRecordHero({ accessionLabel, imageSrc, imageAlt, revealed = false }: ArtifactRecordHeroProps) {
  return (
    <section className="artifact-record-hero" aria-label="Preserved object specimen">
      <CapsuleObjectPlate
        imageSrc={imageSrc || undefined}
        imageAlt={imageAlt}
        label={accessionLabel}
        revealed={revealed}
        className="artifact-record-hero__plate"
      />
      <div className="artifact-record-hero__ruler" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </section>
  );
}
