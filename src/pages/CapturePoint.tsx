import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import CameraCapture from "../components/CameraCapture";
import CaptureFrame from "../components/CaptureFrame";
import CaptureModeToggle from "../components/CaptureModeToggle";
import CapturePreview from "../components/CapturePreview";
import MobileCaptureCTA from "../components/MobileCaptureCTA";
import ObjectSelector from "../components/ObjectSelector";
import SpecimenPreview from "../components/SpecimenPreview";
import TopBar from "../components/TopBar";
import { usePreservationSession } from "../context/PreservationSessionContext";
import { primaryArtifact } from "../data/artifacts";
import { useIsMobile } from "../hooks/useIsMobile";
import type { CaptureInput } from "../types/capture";
import type { ExtractionResult } from "../types/extraction";
import { fileToDataUrl, resizeImageDataUrl, validateImageFile } from "../utils/image";
import { makeSpecimenThumbnail } from "../utils/objectExtraction";

type CapturePointStep = "camera" | "upload" | "confirm-source" | "select-object" | "specimen-locked" | "meaning" | "submitting" | "error";

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
  const isMobile = useIsMobile();
  const { startCapture } = usePreservationSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<CapturePointStep>("camera");
  const [sourceImageDataUrl, setSourceImageDataUrl] = useState("");
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | undefined>();
  const [specimenThumbnailDataUrl, setSpecimenThumbnailDataUrl] = useState("");
  const [objectName, setObjectName] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [futureMemory, setFutureMemory] = useState("");
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const specimenImageDataUrl = extractionResult?.specimenImageDataUrl || "";
  const formReady = Boolean(extractionResult && objectName.trim() && whyNow.trim() && futureMemory.trim());
  const showMeaning = step === "meaning" || step === "submitting";
  const showModeToggle = !isMobile && (step === "camera" || step === "upload");

  const prepareImage = async (dataUrl: string) => {
    const resized = await resizeImageDataUrl(dataUrl, { maxWidth: 1600, maxHeight: 1600, quality: 0.88 });
    return resized;
  };

  const processFile = async (file?: File) => {
    setError("");
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    try {
      setIsProcessingImage(true);
      const dataUrl = await fileToDataUrl(file);
      const resized = await prepareImage(dataUrl);
      setSourceImageDataUrl(resized);
      setExtractionResult(undefined);
      setSpecimenThumbnailDataUrl("");
      setStep("confirm-source");
    } catch {
      setError("Image could not be prepared for preservation.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleCameraCapture = async (dataUrl: string) => {
    setError("");
    try {
      const resized = await prepareImage(dataUrl);
      setSourceImageDataUrl(resized);
      setExtractionResult(undefined);
      setSpecimenThumbnailDataUrl("");
      setStep("confirm-source");
    } catch {
      setError("Camera frame could not be prepared for preservation.");
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void processFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void processFile(event.dataTransfer.files?.[0]);
  };

  const selectObject = () => {
    setError("");
    setStep("select-object");
  };

  const lockSpecimen = async (result: ExtractionResult) => {
    setExtractionResult(result);
    setError("");
    try {
      const thumbnail = await makeSpecimenThumbnail({ specimenImageDataUrl: result.specimenImageDataUrl });
      setSpecimenThumbnailDataUrl(thumbnail);
    } catch {
      setSpecimenThumbnailDataUrl(result.specimenImageDataUrl);
    }
    setStep("specimen-locked");
  };

  const retakePhoto = () => {
    setSourceImageDataUrl("");
    setExtractionResult(undefined);
    setSpecimenThumbnailDataUrl("");
    setError("");
    setStep("camera");
  };

  const goToUpload = () => {
    setError("");
    setStep("upload");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!sourceImageDataUrl) {
      setError("Capture or upload a Source Capture first.");
      setStep("error");
      return;
    }
    if (!extractionResult) {
      setError("Lock the Object Field before preserving.");
      setStep("select-object");
      return;
    }
    if (!formReady) {
      setError("Object, why now, and future-you context are required.");
      setStep("meaning");
      return;
    }

    setStep("submitting");
    const input: CaptureInput = {
      imageDataUrl: extractionResult.specimenImageDataUrl,
      sourceImageDataUrl: extractionResult.sourceImageDataUrl,
      specimenImageDataUrl: extractionResult.specimenImageDataUrl,
      thumbnailDataUrl: specimenThumbnailDataUrl || extractionResult.specimenImageDataUrl,
      objectBoundary: extractionResult.objectBoundary,
      extraction: {
        method: extractionResult.method,
        confidence: extractionResult.confidence,
        warnings: extractionResult.warnings,
        createdAt: extractionResult.createdAt,
      },
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
    <main className="instrument-shell min-h-[100dvh] overflow-x-hidden pb-28 md:pb-12">
      <TopBar fossilId={primaryArtifact.id} tone="dark" />
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[78rem] px-5 sm:px-8 lg:px-10">
        <div className="mb-6 hidden flex-col justify-between gap-4 md:flex md:flex-row md:items-end">
          <div>
            <p className="mono-label text-[0.68rem] text-[var(--capsule-ash-dim)]">CAPTURE POINT</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[0.01em] text-[var(--capsule-bone)] sm:text-5xl">Prepare object for preservation.</h1>
          </div>
          {showModeToggle && (
            <CaptureModeToggle
              mode={step === "upload" ? "upload" : "camera"}
              onModeChange={(mode) => setStep(mode === "camera" ? "camera" : "upload")}
            />
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            {step === "camera" && (
              <CameraCapture onCapture={(dataUrl) => void handleCameraCapture(dataUrl)} onUploadInstead={goToUpload} />
            )}

            {step === "error" && (
              <CaptureFrame label="CAPTURE POINT" status="INTAKE INTERRUPTED" mode="empty">
                <div className="mx-auto max-w-sm px-6 text-center text-white">
                  <p className="text-lg font-semibold">Source Capture is unavailable.</p>
                  <p className="mt-3 text-sm leading-6 text-white/58">{error || "Capture or upload a source image first."}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button type="button" onClick={() => setStep("camera")} className="primary-button px-5 py-3 text-sm font-medium">Try Again</button>
                    <button type="button" onClick={goToUpload} className="secondary-button px-5 py-3 text-sm font-medium">Upload Instead</button>
                  </div>
                </div>
              </CaptureFrame>
            )}

            {step === "upload" && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="block w-full text-left"
              >
                <CaptureFrame label="UPLOAD INTAKE" status={isProcessingImage ? "PREPARING IMAGE" : "OBJECT FIELD"} mode="empty">
                  <div className="mx-auto max-w-sm px-6 text-center text-white">
                    <p className="text-lg font-semibold">Choose Image</p>
                    <p className="mt-3 text-sm leading-6 text-white/58">Place an existing object capture into the chamber.</p>
                    <div className="mt-6 inline-flex rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-medium">Upload Instead</div>
                  </div>
                </CaptureFrame>
              </button>
            )}

            {step === "confirm-source" && sourceImageDataUrl && (
              <CapturePreview imageDataUrl={sourceImageDataUrl} onRetake={retakePhoto} onSelectObject={selectObject} onUploadInstead={goToUpload} />
            )}

            {step === "select-object" && sourceImageDataUrl && (
              <ObjectSelector sourceImageDataUrl={sourceImageDataUrl} onConfirm={(result) => void lockSpecimen(result)} onRetake={retakePhoto} onCancel={goToUpload} objectName={objectName} />
            )}

            {step === "specimen-locked" && extractionResult && (
              <SpecimenPreview extraction={extractionResult} onContinue={() => setStep("meaning")} onReselect={() => setStep("select-object")} />
            )}

            {showMeaning && specimenImageDataUrl && (
              <div className="space-y-5">
                <CaptureFrame label="SPECIMEN LOCKED" status="MEANING REQUIRED" mode="preview" className="md:hidden">
                  <div className="relative flex h-full w-full items-center justify-center p-8">
                    <img src={specimenImageDataUrl} alt="Specimen Image" className="relative max-h-[38dvh] max-w-full rounded-xl object-contain shadow-[0_22px_52px_rgba(0,0,0,0.28)]" />
                  </div>
                </CaptureFrame>
                <div className="hidden md:block">
                  <CaptureFrame label="SPECIMEN LOCKED" status="OBJECT FIELD" mode="preview">
                    <div className="relative flex h-full w-full items-center justify-center p-10">
                      <img src={specimenImageDataUrl} alt="Specimen Image" className="relative max-h-[44rem] max-w-full rounded-xl object-contain shadow-[0_30px_70px_rgba(0,0,0,0.3)]" />
                    </div>
                  </CaptureFrame>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <aside className={`${showMeaning ? "block" : "hidden lg:block"} lg:pt-2`}>
            {showMeaning ? (
              <div className="space-y-3">
                <label className="instrument-card-dark block rounded-2xl p-5">
                  <span className="mono-label text-[0.65rem] text-[var(--capsule-ash-dim)]">What is this object?</span>
                  <input
                    value={objectName}
                    disabled={step === "submitting"}
                    onChange={(event) => setObjectName(event.target.value)}
                    placeholder="field notebook, climbing shoes, first order label..."
                    className="mt-3 w-full bg-transparent text-base text-[var(--capsule-bone)] outline-none placeholder:text-[var(--capsule-ash-dim)]"
                  />
                </label>
                <label className="instrument-card-dark block rounded-2xl p-5">
                  <span className="mono-label text-[0.65rem] text-[var(--capsule-ash-dim)]">Why are you preserving it today?</span>
                  <textarea
                    value={whyNow}
                    disabled={step === "submitting"}
                    onChange={(event) => setWhyNow(event.target.value)}
                    placeholder="what made this object worth preserving now?"
                    rows={3}
                    className="mt-3 w-full resize-none bg-transparent text-base leading-6 text-[var(--capsule-bone)] outline-none placeholder:text-[var(--capsule-ash-dim)]"
                  />
                </label>
                <label className="instrument-card-dark block rounded-2xl p-5">
                  <span className="mono-label text-[0.65rem] text-[var(--capsule-ash-dim)]">What should future-you not forget?</span>
                  <textarea
                    value={futureMemory}
                    disabled={step === "submitting"}
                    onChange={(event) => setFutureMemory(event.target.value)}
                    placeholder="the detail time will erase first..."
                    rows={3}
                    className="mt-3 w-full resize-none bg-transparent text-base leading-6 text-[var(--capsule-bone)] outline-none placeholder:text-[var(--capsule-ash-dim)]"
                  />
                </label>
                <label className="instrument-card-dark block rounded-2xl p-5">
                  <span className="mono-label text-[0.65rem] text-[var(--capsule-ash-dim)]">Origin</span>
                  <input
                    value={origin}
                    disabled={step === "submitting"}
                    onChange={(event) => setOrigin(event.target.value)}
                    placeholder="desk / afternoon / glendora, ca"
                    className="mt-3 w-full bg-transparent text-base text-[var(--capsule-bone)] outline-none placeholder:text-[var(--capsule-ash-dim)]"
                  />
                </label>
                {error && <p className="rounded-2xl border border-[var(--capsule-line-dark)] bg-white/[0.06] p-4 text-sm text-[var(--capsule-bone)]">{error}</p>}
                <button type="submit" disabled={step === "submitting" || !formReady} className="primary-button hidden min-h-11 px-5 py-3 text-sm font-medium disabled:opacity-45 md:inline-flex">
                  {step === "submitting" ? "Preparing Chamber..." : "Add to Chamber"}
                </button>
              </div>
            ) : (
              <div className="instrument-card-dark rounded-2xl p-5">
                <p className="mono-label text-[0.65rem] text-[var(--capsule-ash-dim)]">Capture sequence</p>
                <p className="mt-3 text-sm leading-6 text-[var(--capsule-ash-dim)]">Capture the source first. Meaning prompts appear after the object field is locked.</p>
              </div>
            )}
          </aside>
        </div>
        {showMeaning && (
          <MobileCaptureCTA
            type="submit"
            label={step === "submitting" ? "Preparing Chamber..." : "Add to Chamber"}
            disabled={step === "submitting" || !formReady}
          />
        )}
      </form>
      <div className={`mx-auto max-w-[78rem] px-5 sm:px-8 lg:px-10 ${showMeaning ? "hidden md:block" : ""}`}>
        <BottomNav tone="dark" />
      </div>
    </main>
  );
}
