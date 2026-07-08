export type CaptureReticleProps = {
  imageSrc?: string;
  imageAlt?: string;
  label?: string;
  active?: boolean;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

function ReticleObject() {
  return (
    <div className="relative h-20 w-48" aria-hidden="true">
      <span className="absolute bottom-0 left-4 h-4 w-40 rounded-[50%] bg-black/20 blur-sm" />
      <span className="absolute bottom-5 left-0 h-14 w-48 rounded-md border border-black/10 bg-[var(--capsule-printed-bone)]" />
      <span className="absolute bottom-8 left-3 h-7 w-12 rounded-[3px] border border-black/10 bg-[var(--capsule-cream)]" />
      <span className="absolute bottom-8 left-20 h-7 w-9 rounded-[3px] bg-[rgba(171,170,166,0.45)]" />
      <span className="absolute bottom-7 right-3 h-8 w-12 rounded-[3px] bg-[rgba(17,16,17,0.86)]" />
    </div>
  );
}

export default function CaptureReticle({ imageSrc, imageAlt = "Object in capture reticle", label = "Center the object.", active = true, className }: CaptureReticleProps) {
  return (
    <section className={joinClasses("capsule-mode-preservation rounded-[var(--capsule-radius-panel)] p-6", className)}>
      <p className="mb-5 text-center text-xl font-medium text-white">{label}</p>
      <div className="relative mx-auto flex aspect-[252/318] w-full max-w-[252px] items-center justify-center overflow-hidden rounded-[22px] border border-white/[0.06] bg-[rgba(171,170,166,0.3)]">
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <span key={index} className="border-b border-r border-white/12" />
          ))}
        </div>
        <span className="absolute left-6 top-8 h-0.5 w-8 bg-white/35" aria-hidden="true" />
        <span className="absolute right-6 top-8 h-0.5 w-8 bg-white/35" aria-hidden="true" />
        <span className="absolute bottom-8 left-6 h-0.5 w-8 bg-white/35" aria-hidden="true" />
        <span className="absolute bottom-8 right-6 h-0.5 w-8 bg-white/35" aria-hidden="true" />
        {imageSrc ? <img src={imageSrc} alt={imageAlt} className="relative max-h-[70%] max-w-[78%] object-contain" /> : <ReticleObject />}
        {active && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[var(--capsule-red)] shadow-[0_0_0_6px_rgba(152,57,49,0.16)]" aria-label="Capture active" />}
      </div>
    </section>
  );
}
