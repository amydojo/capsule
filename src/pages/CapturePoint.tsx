import type { ChangeEvent, DragEvent } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraCapture from "../components/CameraCapture";
import CaptureFrame from "../components/CaptureFrame";
import CaptureModeToggle from "../components/CaptureModeToggle";
import ObjectSelector from "../components/ObjectSelector";
import CapsuleBottomDock from "../components/system/CapsuleBottomDock";
import CapsuleObjectPlate from "../components/system/CapsuleObjectPlate";
import CapsulePhoneFrame from "../components/system/CapsulePhoneFrame";
import CapsuleScreenHeader from "../components/system/CapsuleScreenHeader";
import { ROUTES } from "../constants/navigation";
import { usePreservationSession } from "../context/PreservationSessionContext";
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
      setError("Capsule could not prepare this source evidence. Try again or use a clearer image.");
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
      setError("Capsule could not prepare this source evidence. Try again or select a clearer image.");
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
      setError("Present source evidence before preserving.");
      setStep("error");
      return;
    }

    setStep("context-lock");
  };

  const preserveObject = () => {
    setError("");

    if (!sourceImageDataUrl || !extractionResult) {
      setError("Present source evidence before preserving.");
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

  const headerCopy = {
    camera: { eyebrow: "Capture Object", title: "Center the object.", subtitle: "Source evidence begins the record." },
    upload: { eyebrow: "Source Evidence", title: "Present an object to preserve.", subtitle: "Select an image and Capsule will set the first object field." },
    "object-ready": { eyebrow: "Object Field", title: "Set the field around the object.", subtitle: "Adjust what Capsule should preserve from the source evidence." },
    "context-lock": { eyebrow: "Context Lock", title: "Add what Capsule can't see.", subtitle: "A few optional tags keep the record attached to the object." },
    "adjust-field": { eyebrow: "Object Field", title: "Set the field around the object.", subtitle: "Use the field controls to seal the specimen." },
    submitting: { eyebrow: "Preserve", title: "Preparing chamber.", subtitle: "The object field is moving into preservation." },
    error: { eyebrow: "Source Evidence", title: "Intake interrupted.", subtitle: "Try again or select a clearer source image." },
  }[step];

  return (
    <CapsulePhoneFrame mode="preservation" footer={<CapsuleBottomDock mode="preservation" />}>
      <CapsuleScreenHeader
        mode="preservation"
        eyebrow={headerCopy.eyebrow}
        title={headerCopy.title}
        subtitle={headerCopy.subtitle}
        centered={step === "camera" || step === "adjust-field"}
        leading={{ label: "x", ariaLabel: "Return to Vault", onClick: () => navigate(ROUTES.vault) }}
      />

      {showModeToggle && (
        <div className="mt-5 flex justify-center">
          <CaptureModeToggle
            mode={step === "upload" ? "upload" : "camera"}
            onModeChange={(mode) => setStep(mode === "camera" ? "camera" : "upload")}
          />
        </div>
      )}

        {step === "camera" && <CameraCapture onCapture={(dataUrl) => void handleCameraCapture(dataUrl)} onUploadInstead={goToUpload} />}

        {step === "error" && (
          <CaptureFrame label="SOURCE EVIDENCE" status="INTAKE INTERRUPTED" mode="empty">
            <div className="mx-auto max-w-sm px-6 text-center text-white">
              <p className="text-lg font-semibold">Source evidence is unavailable.</p>
              <p className="mt-3 text-sm leading-6 text-white/58">{error || "Present source evidence before preserving."}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => setStep("camera")} className="primary-button px-5 py-3 text-sm font-medium">Try Again</button>
                <button type="button" onClick={goToUpload} className="secondary-button px-5 py-3 text-sm font-medium">Select Source Image</button>
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
            <CaptureFrame label="SOURCE EVIDENCE" status={isProcessingImage ? "PREPARING FIELD" : "OBJECT FIELD"} mode="empty">
              <div className="mx-auto max-w-sm px-6 text-center text-white">
                <p className="text-lg font-semibold">Select source image</p>
                <p className="mt-3 text-sm leading-6 text-white/58">Capsule begins with an image, but the image is only the source. The object becomes the record.</p>
                <div className="mt-6 inline-flex rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-medium">Select source image</div>
              </div>
            </CaptureFrame>
          </button>
        )}

        {step === "object-ready" && extractionResult && (
          <div className="mt-6 space-y-4">
            <CaptureFrame label="OBJECT FIELD" status="FIELD READY" mode="preview">
              <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 px-5 py-10 text-center text-white">
                <div>
                  <p className="text-[0.95rem] font-semibold">Object field sealed.</p>
                  <p className="mt-2 text-[0.62rem] leading-4 text-white/58">Continue to attach context before preservation.</p>
                </div>
                <div className="relative flex max-h-40 w-full items-center justify-center">
                  <div className="absolute inset-x-[22%] bottom-2 h-10 rounded-[50%] bg-black/35 blur-3xl" />
                  <img src={specimenImageDataUrl} alt="Object field ready for preservation" className="relative max-h-40 max-w-full rounded-xl object-contain shadow-[0_34px_74px_rgba(0,0,0,0.34)]" />
                </div>
              </div>
            </CaptureFrame>
            <div className="grid gap-2">
              <button type="button" onClick={openContextLock} className="h-10 rounded-full bg-[var(--capsule-cream)] px-5 text-[0.62rem] font-semibold text-[var(--capsule-black)] shadow-[0_18px_42px_rgba(0,0,0,0.32)]">
                Continue to Context Lock
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setStep("adjust-field")} className="device-control-button px-4 py-2 text-[0.58rem] font-medium">Adjust Field</button>
                <button type="button" onClick={retakePhoto} className="device-control-button px-4 py-2 text-[0.58rem] font-medium">New Source</button>
              </div>
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
          <div className="mt-6 rounded-[22px] border border-[rgba(17,16,17,0.08)] bg-[var(--capsule-cream)] p-4 text-[var(--capsule-black)] shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
            <CapsuleObjectPlate imageSrc={specimenImageDataUrl} imageAlt="Object field preview" label="Object field" className="min-h-[148px]" />
              <form
                className="mt-5 flex flex-col justify-between gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  preserveObject();
                }}
              >
                <div>
                  <div className="grid gap-3">
                    {contextLockFields.map((field) => (
                      <label key={field.id} className="block border-b border-[rgba(17,16,17,0.1)] pb-2.5">
                        <span className="mono-label text-[0.46rem] text-[var(--capsule-muted)]">{field.label}</span>
                        <input
                          value={contextFields[field.id]}
                          onChange={(event) => updateContextField(field.id, event.target.value)}
                          placeholder={field.placeholder}
                          className="mt-1.5 w-full bg-transparent text-[0.72rem] text-[var(--capsule-black)] outline-none placeholder:text-[rgba(125,118,108,0.72)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <button type="submit" className="h-10 rounded-full bg-[var(--capsule-black)] px-5 text-[0.62rem] font-semibold text-white shadow-[0_18px_42px_rgba(23,25,28,0.18)]">
                    Preserve Object
                  </button>
                  <button type="button" onClick={() => setStep("object-ready")} className="h-9 rounded-full border border-[rgba(17,16,17,0.1)] px-5 text-[0.58rem] font-medium text-[var(--capsule-muted)]">
                    Back to Object Field
                  </button>
                </div>
              </form>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </CapsulePhoneFrame>
  );
}
