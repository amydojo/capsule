export type CameraErrorKind = "permission" | "insecure" | "not-found" | "unsupported" | "unavailable";

export const getCameraErrorMessage = (error: unknown): { kind: CameraErrorKind; message: string } => {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      kind: "insecure",
      message: "Camera requires a secure connection. Use HTTPS or upload an image instead.",
    };
  }

  if (!("mediaDevices" in navigator) || !navigator.mediaDevices?.getUserMedia) {
    return {
      kind: "unsupported",
      message: "This browser does not support camera capture. Upload an image instead.",
    };
  }

  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return {
      kind: "permission",
      message: "Camera access was blocked. You can enable it in browser settings or upload an image instead.",
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      kind: "not-found",
      message: "No camera was found. You can still upload an image.",
    };
  }

  return {
    kind: "unavailable",
    message: "Camera access is unavailable. You can still upload an image.",
  };
};

export const getPrimaryCameraConstraints = (facingMode: "environment" | "user" = "environment"): MediaStreamConstraints => ({
  video: {
    facingMode: { ideal: facingMode },
    width: { ideal: 1920 },
    height: { ideal: 1440 },
  },
  audio: false,
});

export const fallbackCameraConstraints: MediaStreamConstraints = {
  video: true,
  audio: false,
};
