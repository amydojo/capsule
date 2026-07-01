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
        label={status === "ready" ? "LIVE CAPTURE" : "CAPTURE POINT"}
        status={status === "ready" ? "rear camera / object field" : "preparing object field"}
        mode="live"
      >
        {unavailable ? (
          <div className="mx-auto max-w-sm px-6 text-center">
            <p className="text-lg font-semibold text-white">Camera access is unavailable.</p>
            <p className="mt-3 text-sm leading-6 text-white/58">{error || "You can still upload an image."}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={start} className="primary-button px-5 py-3 text-sm font-medium">Try Again</button>
              <button type="button" onClick={handleUploadInstead} className="secondary-button px-5 py-3 text-sm font-medium">Upload Instead</button>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
            {status !== "ready" && (
              <div className="relative z-20 rounded-full border border-white/16 bg-black/26 px-5 py-3 text-sm text-white/68 shadow-[0_18px_48px_rgba(0,0,0,0.18)] backdrop-blur">
                {status === "requesting" ? "Requesting camera access..." : "Preparing object field..."}
              </div>
            )}
          </>
        )}
      </CaptureFrame>
      {!unavailable && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" disabled={!isReady} onClick={handleCapture} className="primary-button min-h-11 px-7 py-3.5 text-sm font-semibold disabled:opacity-50">
            Capture Object
          </button>
          <button type="button" onClick={handleUploadInstead} className="secondary-button min-h-11 px-7 py-3.5 text-sm font-medium">
            Upload Instead
          </button>
        </div>
      )}
    </div>
  );
}
