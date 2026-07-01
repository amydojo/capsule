type SourceCapturePreviewProps = {
  sourceImageDataUrl: string;
  title: string;
};

export default function SourceCapturePreview({ sourceImageDataUrl, title }: SourceCapturePreviewProps) {
  return (
    <details className="mx-auto mt-16 max-w-4xl border-t border-[var(--capsule-line)] pt-10">
      <summary className="cursor-pointer mono-label text-[0.66rem] text-[var(--capsule-ash)]">SOURCE CAPTURE</summary>
      <div className="mt-5 grid gap-5 rounded-2xl border border-[rgba(229,226,220,0.7)] bg-white/42 p-5 sm:grid-cols-[12rem_1fr] sm:items-center">
        <img src={sourceImageDataUrl} alt={`${title} source capture`} className="max-h-36 w-full rounded-xl object-contain" />
        <div>
          <p className="text-sm font-medium text-[var(--capsule-graphite)]">Source retained for provenance.</p>
          <p className="mt-2 text-sm leading-6 text-[var(--capsule-ash)]">Original capture remains attached to the artifact record.</p>
        </div>
      </div>
    </details>
  );
}
