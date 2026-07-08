import type { ChangeEvent, DragEvent } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import CameraCapture from "../components/CameraCapture";
import CaptureFrame from "../components/CaptureFrame";
import CaptureModeToggle from "../components/CaptureModeToggle";
import MobileCaptureCTA from "../components/MobileCaptureCTA";
import ObjectSelector from "../components/ObjectSelector";
import TopBar from "../components/TopBar";
import { ROUTES } from "../constants/navigation";
import { usePreservationSession } from "../context/PreservationSessionContext";
import { primaryArtifact } from "../data/artifacts";
import { useIsMobile } from "../hooks/useIsMobile";
import type { CaptureInput } from "../types/capture";
import type { ExtractionResult } from "../types/extraction";
import { fileToDataUrl, resizeImageDataUrl, validateImageFile } from "../utils/image";
import {
  estimateExtractionConfidence,
  extractSpecimenFromImage,
  getDefaultObjectBoundary,
  loadImage,
  makeSpecimenThumbnail,
} from "../utils/objectExtraction";

type CapturePointStep = "camera" | "upload" | "object-ready" | "context-lock" | "adjust-field" | "submitting" | "error";

type ContextLockField = "objectName" | "whyKeepIt" | "origin" | "collection";

type ContextLockFields = Record<ContextLockField, string>;

const emptyContextLockFields: ContextLockFields = {
  objectName: "",
  whyKeepIt: "",
  origin: "",
  collection: "",
};

const contextLockFields: Array<{
  id: ContextLockField;
  label: string;
  placeholder: string;
}> = [
  { id: "objectName", label: "Object name", placeholder: "what should Capsule call this?" },
  { id: "whyKeepIt", label: "Why keep it?", placeholder: "small reason, not a whole story" },
  { id: "origin", label: "Origin", placeholder: "desk, car, kitchen, Remy evidence..." },
  { id: "collection", label: "Collection", placeholder: "desk objects, printed matter, Remy relics..." },
];

const formatCapturePoint = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

const optionalContextValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

export default function CapturePoint() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { startCapture } = usePreservationSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<CapturePointStep>("camera");
  const [sourceImageDataUrl, setSourceImageDataUrl] = useState("");
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | undefined>();
  const [specimenThumbnailDataUrl, setSpecimenThumbnailDataUrl] = useState("");
  const [contextFields, setContextFields] = useState<ContextLockFields>(emptyContextLockFields);
  const [error, setError] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const specimenImageDataUrl = extractionResult?.specimenImageDataUrl || "";
  const showModeToggle = !isMobile && (step === "camera" || step === "upload");
  const showFixedPreserve = step === "object-ready" && Boolean(extractionResult);

  const prepareImage = async (dataUrl: string) => resizeImageDataUrl(dataUrl, { maxWidth: 1600, maxHeight: 1600, quality: 0.88 });

  const createDefaultExtraction = async (sourceImage: string): Promise<ExtractionResult> => {
    const image = await loadImage(sourceImage);
    const objectBoundary = getDefaultObjectBoundary({
      imageNaturalWidth: image.naturalWidth || image.width,
      imageNaturalHeight: image.naturalHeight || image.height,
      preferredAspectRatio: 1,
    });
    const specimenImageDataUrl = await extractSpecimenFromImage({ sourceImageDataUrl: sourceImage, boundary: objectBoundary });
    const confidence = estimateExtractionConfidence({
      boundary: objectBoundary,
      imageWidth: image.naturalWidth || image.width,
      imageHeight: image.naturalHeight || image.height,
    });

    return {
      specimenImageDataUrl,
      sourceImageDataUrl: sourceImage,
      objectBoundary,
      method: "manual-object-field",
      confidence,
      warnings: [],
      createdAt: new Date().toISOString(),
    };
  };

  const lockDefaultField = async (dataUrl: string) => {
    const resized = await prepareImage(dataUrl);
    const extraction = await createDefaultExtraction(resized);
    const thumbnail = await makeSpecimenThumbnail({ specimenImageDataUrl: extraction.specimenImageDataUrl }).catch(() => extraction.specimenImageDataUrl);
    setSourceImageDataUrl(resized);
    setExtractionResult(extraction);
    setSpecimenThumbnailDataUrl(thumbnail);
    setStep("object-ready");
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
      await lockDefaultField(dataUrl);
    } catch {
      setError("Capsule could not prepare this object. Try again or use a clearer image.");
      setStep("error");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleCameraCapture = async (dataUrl: string) => {
    setError("");
    try {
      setIsProcessingImage(true);
      await lockDefaultField(dataUrl);
    } catch {
      setError("Capsule could not prepare this object. Try again or upload a clearer image.");
      setStep("error");
    } finally {
      setIsProcessingImage(false);
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

  const saveAdjustedField = async (result: ExtractionResult) => {
    setExtractionResult(result);
    setError("");
    const thumbnail = await makeSpecimenThumbnail({ specimenImageDataUrl: result.specimenImageDataUrl }).catch(() => result.specimenImageDataUrl);
    setSpecimenThumbnailDataUrl(thumbnail);
    setStep("object-ready");
  };

  const retakePhoto = () => {
    setSourceImageDataUrl("");
    setExtractionResult(undefined);
    setSpecimenThumbnailDataUrl("");
    setContextFields(emptyContextLockFields);
    setError("");
    setStep("camera");
  };

  const goToUpload = () => {
    setError("");
    setStep("upload");
  };

  const updateContextField = (field: ContextLockField, value: string) => {
    setContextFields((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openContextLock = () => {
    setError("");

    if (!sourceImageDataUrl || !extractionResult) {
      setError("Capture an object before preserving.");
      setStep("error");
      return;
    }

    setStep("context-lock");
  };

  const preserveObject = () => {
    setError("");

    if (!sourceImageDataUrl || !extractionResult) {
      setError("Capture an object before preserving.");
      setStep("error");
      return;
    }

    setStep("submitting");
    const objectName = optionalContextValue(contextFields.objectName);
    const whyNow = optionalContextValue(contextFields.whyKeepIt);
    const origin = optionalContextValue(contextFields.origin);
    const collection = optionalContextValue(contextFields.collection);

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
      capturePoint: formatCapturePoint(),
      ...(objectName ? { objectName } : {}),
      ...(whyNow ? { whyNow } : {}),
      ...(origin ? { origin } : {}),
      ...(collection ? { collection } : {}),
    };

    startCapture(input);
    navigate(ROUTES.chamber);
  };

  return (
    <main className="instrument-shell min-h-[100dvh] overflow-x-hidden pb-36 md:pb-12">
      <TopBar fossilId={primaryArtifact.id} tone="dark" />
      <section className="mx-auto w-full max-w-[78rem] px-5 sm:px-8 lg:px-10">
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

        {step === "camera" && <CameraCapture onCapture={(dataUrl) => void handleCameraCapture(dataUrl)} onUploadInstead={goToUpload} />}

        {step === "error" && (
          <CaptureFrame label="CAPTURE POINT" status="INTAKE INTERRUPTED" mode="empty">
            <div className="mx-auto max-w-sm px-6 text-center text-white">
              <p className="text-lg font-semibold">Object capture is unavailable.</p>
              <p className="mt-3 text-sm leading-6 text-white/58">{error || "Capture or upload an object first."}</p>
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
            <CaptureFrame label="UPLOAD INTAKE" status={isProcessingImage ? "PREPARING OBJECT" : "OBJECT FIELD"} mode="empty">
              <div className="mx-auto max-w-sm px-6 text-center text-white">
                <p className="text-lg font-semibold">Choose Image</p>
                <p className="mt-3 text-sm leading-6 text-white/58">Place an existing object capture into the chamber.</p>
                <div className="mt-6 inline-flex rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-medium">Upload Instead</div>
              </div>
            </CaptureFrame>
          </button>
        )}

        {step === "object-ready" && extractionResult && (
          <div className="space-y-5">
            <CaptureFrame label="OBJECT READY" status="OBJECT FIELD" mode="preview">
              <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 px-6 py-14 text-center text-white sm:px-10">
                <div>
                  <p className="text-xl font-semibold">Capsule selected the object field.</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">Preserve now, or adjust the field first.</p>
                </div>
                <div className="relative flex max-h-[48dvh] w-full items-center justify-center">
                  <div className="absolute inset-x-[22%] bottom-2 h-10 rounded-[50%] bg-black/35 blur-3xl" />
                  <img src={specimenImageDataUrl} alt="Object ready for preservation" className="relative max-h-[48dvh] max-w-full rounded-xl object-contain shadow-[0_34px_74px_rgba(0,0,0,0.34)]" />
                </div>
              </div>
            </CaptureFrame>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <button type="button" onClick={openContextLock} className="hidden min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] shadow-[0_18px_42px_rgba(0,0,0,0.32)] md:inline-flex md:items-center md:justify-center">
                Preserve Object
              </button>
              <button type="button" onClick={() => setStep("adjust-field")} className="device-control-button px-7 py-3.5 text-sm font-medium">Adjust Field</button>
              <button type="button" onClick={retakePhoto} className="device-control-button px-7 py-3.5 text-sm font-medium">Retake</button>
            </div>
          </div>
        )}

        {step === "adjust-field" && sourceImageDataUrl && extractionResult && (
          <ObjectSelector
            sourceImageDataUrl={sourceImageDataUrl}
            onConfirm={(result) => void saveAdjustedField(result)}
            onCancel={() => setStep("object-ready")}
          />
        )}

        {step === "context-lock" && extractionResult && (
          <div className="capsule-mode-archive mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] border border-[var(--capsule-line)] text-[var(--capsule-graphite-black)] shadow-[0_28px_88px_rgba(0,0,0,0.2)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="flex min-h-[24rem] items-center justify-center border-b border-[var(--capsule-line)] p-6 lg:border-b-0 lg:border-r">
                <div className="capsule-surface-paper flex w-full max-w-sm flex-col items-center justify-center p-5">
                  <p className="mono-label self-start text-[0.58rem] text-[var(--capsule-ash)]">Object field</p>
                  <div className="relative mt-5 flex min-h-64 w-full items-center justify-center">
                    <div className="absolute inset-x-[16%] bottom-8 h-10 rounded-[50%] bg-black/10 blur-2xl" aria-hidden="true" />
                    <img src={specimenImageDataUrl} alt="Object field preview" className="relative max-h-72 max-w-full rounded-xl object-contain shadow-[0_26px_58px_rgba(23,25,28,0.14)]" />
                  </div>
                </div>
              </div>
              <form
                className="flex flex-col justify-between gap-8 p-6 sm:p-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  preserveObject();
                }}
              >
                <div>
                  <p className="mono-label text-[0.68rem] text-[var(--capsule-ash)]">CONTEXT LOCK</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[0.01em] text-[var(--capsule-graphite-black)] sm:text-4xl">{"Add what Capsule can\u2019t see."}</h1>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--capsule-ash)]">A few optional tags help the record stay attached to the real object.</p>

                  <div className="mt-8 grid gap-4">
                    {contextLockFields.map((field) => (
                      <label key={field.id} className="block border-b capsule-hairline pb-3">
                        <span className="mono-label text-[0.58rem] text-[var(--capsule-ash)]">{field.label}</span>
                        <input
                          value={contextFields[field.id]}
                          onChange={(event) => updateContextField(field.id, event.target.value)}
                          placeholder={field.placeholder}
                          className="mt-2 w-full bg-transparent text-base text-[var(--capsule-graphite-black)] outline-none placeholder:text-[rgba(125,118,108,0.72)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <button type="submit" className="min-h-11 rounded-full bg-[var(--capsule-graphite)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(23,25,28,0.18)]">
                    Preserve Object
                  </button>
                  <button type="button" onClick={() => setStep("object-ready")} className="secondary-button px-7 py-3.5 text-sm font-medium">
                    Back to Object Field
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {showFixedPreserve && <MobileCaptureCTA type="button" label="Preserve Object" onClick={openContextLock} />}

        <div className={`mx-auto max-w-[78rem] ${showFixedPreserve || step === "submitting" || step === "adjust-field" || step === "context-lock" ? "hidden md:block" : ""}`}>
          <BottomNav tone="dark" />
        </div>
      </section>
    </main>
  );
}
