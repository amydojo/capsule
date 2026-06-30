import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ContinuityBar from "../components/ContinuityBar";
import SpecimenStage from "../components/SpecimenStage";
import TopBar from "../components/TopBar";
import { usePreservationSession } from "../context/PreservationSessionContext";
import { primaryArtifact } from "../data/artifacts";
import type { CaptureInput } from "../types/capture";
import { fileToDataUrl, MAX_IMAGE_BYTES, makeThumbnail, resizeImageDataUrl } from "../utils/image";

const formatCapturePoint = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

export default function CapturePoint() {
  const navigate = useNavigate();
  const { startCapture } = usePreservationSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [objectName, setObjectName] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [futureMemory, setFutureMemory] = useState("");
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const processFile = async (file?: File) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Use an image file for preservation intake.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is larger than 8MB. Use a smaller capture for this local prototype.");
      return;
    }

    try {
      setIsProcessingImage(true);
      const dataUrl = await fileToDataUrl(file);
      const resized = await resizeImageDataUrl(dataUrl, 1400, 0.85);
      await makeThumbnail(resized);
      setImageDataUrl(resized);
    } catch {
      setError("Image could not be prepared for preservation.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void processFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void processFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!imageDataUrl) {
      setError("Place an object image in the chamber before preservation.");
      return;
    }
    if (!objectName.trim() || !whyNow.trim() || !futureMemory.trim()) {
      setError("Object, why now, and future-you context are required.");
      return;
    }

    const input: CaptureInput = {
      imageDataUrl,
      objectName: objectName.trim(),
      whyNow: whyNow.trim(),
      futureMemory: futureMemory.trim(),
      origin: origin.trim(),
      capturePoint: formatCapturePoint(),
    };

    startCapture(input);
    navigate("/chamber");
  };

  return (
    <main className="min-h-screen pb-12">
      <TopBar fossilId={primaryArtifact.id} />
      <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-[78rem] gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_24rem] lg:px-10">
        <div>
          <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">CAPTURE POINT</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[0.01em] sm:text-5xl">Prepare object for preservation.</h1>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="block w-full text-left"
            >
              <SpecimenStage mode="artifact" showScanLine imageDataUrl={imageDataUrl} imageAlt={objectName || "Object awaiting preservation"} showIsolationChip={Boolean(imageDataUrl)} />
              {!imageDataUrl && (
                <div className="pointer-events-none -mt-72 flex min-h-72 items-center justify-center text-center">
                  <div className="relative z-30 rounded-full border border-[rgba(229,226,220,0.72)] bg-white/72 px-5 py-3 text-sm text-[var(--capsule-ash)] shadow-[0_18px_48px_rgba(23,25,28,0.05)]">
                    {isProcessingImage ? "Preparing image..." : "Place object in chamber"}
                  </div>
                </div>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        <aside className="lg:pt-24">
          <div className="space-y-3">
            <label className="instrument-panel block rounded-2xl p-5">
              <span className="mono-label text-[0.65rem] text-[var(--capsule-ash)]">Object</span>
              <input
                value={objectName}
                onChange={(event) => setObjectName(event.target.value)}
                placeholder="field notebook, climbing shoes, first order label..."
                className="mt-3 w-full bg-transparent text-sm text-[var(--capsule-graphite)] outline-none placeholder:text-[var(--capsule-ash)]"
              />
            </label>
            <label className="instrument-panel block rounded-2xl p-5">
              <span className="mono-label text-[0.65rem] text-[var(--capsule-ash)]">Why now?</span>
              <textarea
                value={whyNow}
                onChange={(event) => setWhyNow(event.target.value)}
                placeholder="what made this object worth preserving today?"
                rows={3}
                className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-[var(--capsule-graphite)] outline-none placeholder:text-[var(--capsule-ash)]"
              />
            </label>
            <label className="instrument-panel block rounded-2xl p-5">
              <span className="mono-label text-[0.65rem] text-[var(--capsule-ash)]">What should future-you not forget?</span>
              <textarea
                value={futureMemory}
                onChange={(event) => setFutureMemory(event.target.value)}
                placeholder="the detail time will erase first..."
                rows={3}
                className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-[var(--capsule-graphite)] outline-none placeholder:text-[var(--capsule-ash)]"
              />
            </label>
            <label className="instrument-panel block rounded-2xl p-5">
              <span className="mono-label text-[0.65rem] text-[var(--capsule-ash)]">Origin</span>
              <input
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="desk / afternoon / glendora, ca"
                className="mt-3 w-full bg-transparent text-sm text-[var(--capsule-graphite)] outline-none placeholder:text-[var(--capsule-ash)]"
              />
            </label>
          </div>

          <div className="instrument-panel mt-4 rounded-2xl p-5">
            <p className="mono-label text-[0.65rem] text-[var(--capsule-ash)]">Preservation preview</p>
            <p className="mt-3 text-sm text-[var(--capsule-graphite)]">{imageDataUrl ? "Image ready for chamber intake" : "No object image captured"}</p>
            <div className="mt-4">
              <ContinuityBar value={imageDataUrl && objectName && whyNow && futureMemory ? 88 : 36} />
            </div>
          </div>

          {error && <p className="mt-4 rounded-2xl border border-[rgba(229,226,220,0.7)] bg-white/62 p-4 text-sm text-[var(--capsule-graphite)]">{error}</p>}

          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="secondary-button px-5 py-3 text-sm font-medium">
              Retake
            </button>
            <button type="submit" className="primary-button px-5 py-3 text-sm font-medium">
              Add to Chamber
            </button>
          </div>
        </aside>
      </form>
      <div className="mx-auto max-w-[78rem] px-5 sm:px-8 lg:px-10">
        <BottomNav />
      </div>
    </main>
  );
}
