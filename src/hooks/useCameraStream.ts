import { useCallback, useEffect, useRef, useState } from "react";
import { fallbackCameraConstraints, getCameraErrorMessage, getPrimaryCameraConstraints } from "../utils/camera";

export type CameraStatus = "idle" | "requesting" | "ready" | "error" | "unsupported";

type UseCameraStreamOptions = {
  enabled: boolean;
  facingMode?: "environment" | "user";
};

export function useCameraStream({ enabled, facingMode = "environment" }: UseCameraStreamOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus((current) => (current === "unsupported" ? current : "idle"));
  }, []);

  const attachStream = useCallback(async (stream: MediaStream) => {
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    await video.play().catch(() => undefined);
    setStatus("ready");
  }, []);

  const start = useCallback(async () => {
    if (!("mediaDevices" in navigator) || !navigator.mediaDevices?.getUserMedia) {
      const mapped = getCameraErrorMessage(new DOMException("unsupported", "NotSupportedError"));
      setError(mapped.message);
      setStatus("unsupported");
      return;
    }

    stop();
    setError("");
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia(getPrimaryCameraConstraints(facingMode));
      await attachStream(stream);
    } catch (primaryError) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(fallbackCameraConstraints);
        await attachStream(stream);
      } catch (fallbackError) {
        const mapped = getCameraErrorMessage(primaryError || fallbackError);
        setError(mapped.message);
        setStatus(mapped.kind === "unsupported" ? "unsupported" : "error");
      }
    }
  }, [attachStream, facingMode, stop]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      throw new Error("Camera frame is not ready.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Camera frame could not be captured.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.88);
  }, []);

  useEffect(() => {
    if (enabled) {
      void start();
    } else {
      stop();
    }

    return () => stop();
  }, [enabled, start, stop]);

  return {
    videoRef,
    status,
    error,
    start,
    stop,
    captureFrame,
    isReady: status === "ready",
  };
}
