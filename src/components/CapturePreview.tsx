import CaptureFrame from "./CaptureFrame";

type CapturePreviewProps = {
  imageDataUrl: string;
  onRetake: () => void;
  onAdjustField: () => void;
  onUploadInstead: () => void;
};

export default function CapturePreview({ imageDataUrl, onRetake, onAdjustField, onUploadInstead }: CapturePreviewProps) {
  return (
    <div>
      <CaptureFrame label="OBJECT FIELD" status="SOURCE EVIDENCE" mode="preview">
        <div className="relative flex h-full w-full items-center justify-center p-8 sm:p-12">
          <div className="absolute inset-x-[18%] bottom-[16%] h-10 rounded-[50%] bg-black/30 blur-3xl" />
          <img src={imageDataUrl} alt="Object field preview" className="relative max-h-[58dvh] max-w-full rounded-xl object-contain shadow-[0_30px_70px_rgba(0,0,0,0.34)]" />
        </div>
      </CaptureFrame>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <button type="button" onClick={onAdjustField} className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] shadow-[0_18px_42px_rgba(0,0,0,0.32)]">Adjust Field</button>
        <button type="button" onClick={onRetake} className="device-control-button px-7 py-3.5 text-sm font-medium">New Source Evidence</button>
        <button type="button" onClick={onUploadInstead} className="device-control-button px-7 py-3.5 text-sm font-medium">Select Source Image</button>
      </div>
    </div>
  );
}
