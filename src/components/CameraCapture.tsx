import { useEffect } from "react";
import { useCameraStream } from "../hooks/useCameraStream";
import CaptureFrame from "./CaptureFrame";

type CameraCaptureProps = {
  onCapture: (imageDataUrl: string) => void;
  onUploadInstead?: () => void;
  className?: string;
};

export default function CameraCapture({ onCapture, onUploadInstead, className = "" }: CameraCaptureProps) {
  const { videoRef, status, error, start, stop, captureFrame, isReady } = useCameraStream({ enabled: true, facingMode: "environment" });
  const unavailable = status === "error" || status === "unsupported";

  useEffect(() => stop, [stop]);

  const handleCapture = () => {
    try {
      const imageDataUrl = captureFrame();
      stop();
      onCapture(imageDataUrl);
    } catch {
      // Keep the message calm and user-facing; the stream remains active for another try.
    }
  };

  const handleUploadInstead = () => {
    stop();
    onUploadInstead?.();
  };

  return (
    <div className={className}>
      <CaptureFrame
        label={status === "ready" ? "SOURCE EVIDENCE" : "OBJECT FIELD"}
        status={status === "ready" ? "rear camera / object field" : "preparing object field"}
        mode="live"
      >
        {unavailable ? (
          <div className="mx-auto max-w-sm px-6 text-center">
            <p className="text-lg font-semibold text-white">Camera access is unavailable.</p>
            <p className="mt-3 text-sm leading-6 text-white/58">{error || "You can still select a source image."}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={start} className="primary-button px-5 py-3 text-sm font-medium">Try Again</button>
              <button type="button" onClick={handleUploadInstead} className="secondary-button px-5 py-3 text-sm font-medium">Select Source Image</button>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
            {status === "ready" && (
              <div className="absolute bottom-6 left-1/2 z-20 w-[min(88%,28rem)] -translate-x-1/2 rounded-2xl border border-white/14 bg-black/30 px-4 py-3 text-center text-xs leading-5 text-white/64 backdrop-blur md:text-sm md:leading-6">
                Place one object inside the field. Fill most of the frame and keep the source evidence quiet.
              </div>
            )}
            {status !== "ready" && (
              <div className="relative z-20 rounded-full border border-white/16 bg-black/26 px-5 py-3 text-sm text-white/68 shadow-[0_18px_48px_rgba(0,0,0,0.18)] backdrop-blur">
                {status === "requesting" ? "Requesting camera access..." : "Preparing object field..."}
              </div>
            )}
          </>
        )}
      </CaptureFrame>
      {!unavailable && (
        <div className="mt-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:hidden">
            <button type="button" onClick={handleUploadInstead} className="device-control-button justify-self-end px-4 text-[0.64rem] font-medium uppercase tracking-[0.18em]">
              Source
            </button>
            <button type="button" disabled={!isReady} onClick={handleCapture} className="capture-shutter disabled:opacity-45" aria-label="Capture source evidence" />
            <button type="button" className="device-control-button justify-self-start px-4 text-[0.64rem] font-medium uppercase tracking-[0.18em]" aria-label="Capture settings">
              Auto
            </button>
          </div>
          <p className="mt-3 text-center mono-label text-[0.58rem] text-[var(--capsule-ash-dim)] md:hidden">Capture source evidence</p>
          <div className="hidden flex-col gap-3 md:flex md:flex-row md:justify-center">
            <button type="button" disabled={!isReady} onClick={handleCapture} className="primary-button min-h-11 px-7 py-3.5 text-sm font-semibold disabled:opacity-50">
              Capture source evidence
            </button>
            <button type="button" onClick={handleUploadInstead} className="secondary-button min-h-11 px-7 py-3.5 text-sm font-medium">
              Select source image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
