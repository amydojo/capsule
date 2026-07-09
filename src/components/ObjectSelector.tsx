import { useMemo, useState } from "react";
import type { ExtractionResult } from "../types/extraction";
import {
  calculateBoundaryFromObjectField,
  estimateExtractionConfidence,
  extractSpecimenFromImage,
  validateBoundary,
} from "../utils/objectExtraction";
import CaptureFrame from "./CaptureFrame";
import ExtractionReadout from "./ExtractionReadout";
import ObjectFieldFrame from "./ObjectFieldFrame";

type ObjectSelectorProps = {
  sourceImageDataUrl: string;
  onConfirm: (result: ExtractionResult) => void;
  onCancel?: () => void;
  onRetake?: () => void;
  objectName?: string;
};

type ImageSize = {
  width: number;
  height: number;
};

export default function ObjectSelector({ sourceImageDataUrl, onConfirm, onCancel, onRetake, objectName }: ObjectSelectorProps) {
  const [imageSize, setImageSize] = useState<ImageSize | undefined>();
  const [zoom, setZoom] = useState(1.18);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");

  const boundary = useMemo(
    () =>
      calculateBoundaryFromObjectField({
        imageNaturalWidth: imageSize?.width || 1200,
        imageNaturalHeight: imageSize?.height || 1200,
        frameWidth: 1,
        frameHeight: 1,
        zoom,
        offsetX,
        offsetY,
      }),
    [imageSize?.height, imageSize?.width, offsetX, offsetY, zoom],
  );

  const confidence = useMemo(
    () => estimateExtractionConfidence({ boundary, objectName, imageWidth: imageSize?.width, imageHeight: imageSize?.height }),
    [boundary, imageSize?.height, imageSize?.width, objectName],
  );

  const resetAlignment = () => {
    setZoom(1.18);
    setOffsetX(0);
    setOffsetY(0);
    setError("");
  };

  const confirmSelection = async () => {
    setError("");
    const validation = validateBoundary(boundary);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    try {
      setIsExtracting(true);
      const specimenImageDataUrl = await extractSpecimenFromImage({ sourceImageDataUrl, boundary });
      onConfirm({
        specimenImageDataUrl,
        sourceImageDataUrl,
        objectBoundary: boundary,
        method: "manual-object-field",
        confidence,
        warnings: confidence < 0.72 ? ["Capsule works best when one object fills the field."] : [],
        createdAt: new Date().toISOString(),
      });
    } catch {
      setError("Could not lock the object field. Try again or select clearer source evidence.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-5">
      <CaptureFrame label="OBJECT FIELD" status="FIELD ADJUSTMENT" mode="preview">
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 px-5 py-16 sm:px-10">
          <div className="max-w-xl text-center text-white">
            <p className="text-xl font-semibold">Set the field around the object.</p>
            <p className="mt-2 text-sm leading-6 text-white/58">Save the field when the object is centered in the source evidence.</p>
          </div>

          <ObjectFieldFrame sourceImageDataUrl={sourceImageDataUrl} boundary={boundary} onImageLoad={setImageSize} />
        </div>
      </CaptureFrame>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="device-control-button px-7 py-3 text-sm font-medium">
          Field Controls
        </button>
        <button type="button" onClick={() => setShowDetails((value) => !value)} className="device-control-button px-7 py-3 text-sm font-medium">
          Details
        </button>
      </div>

      {showAdvanced && (
        <div className="grid gap-3 rounded-[1.35rem] border border-[var(--capsule-line-dark)] bg-white/[0.055] p-4 sm:grid-cols-4">
          <label className="block sm:col-span-2">
            <span className="mono-label text-[0.6rem] text-[var(--capsule-ash-dim)]">Zoom</span>
            <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-3 w-full accent-[var(--capsule-red)]" />
          </label>
          <label className="block">
            <span className="mono-label text-[0.6rem] text-[var(--capsule-ash-dim)]">Horizontal</span>
            <input type="range" min="-100" max="100" step="1" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} className="mt-3 w-full accent-[var(--capsule-red)]" />
          </label>
          <label className="block">
            <span className="mono-label text-[0.6rem] text-[var(--capsule-ash-dim)]">Vertical</span>
            <input type="range" min="-100" max="100" step="1" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} className="mt-3 w-full accent-[var(--capsule-red)]" />
          </label>
          <button type="button" onClick={resetAlignment} className="device-control-button px-7 py-3.5 text-sm font-medium sm:col-span-4">Reset Field</button>
        </div>
      )}

      {showDetails && (
        <div className="rounded-[1.35rem] border border-[var(--capsule-line-dark)] bg-white/[0.055] p-3">
          <ExtractionReadout confidence={confidence} method="manual-object-field" sourceRetained boundaryLocked />
        </div>
      )}

      {error && <p className="rounded-2xl border border-[var(--capsule-line-dark)] bg-white/[0.06] p-4 text-sm text-[var(--capsule-bone)]">{error}</p>}
      <p className="mx-auto max-w-2xl text-center text-sm leading-6 text-[var(--capsule-ash-dim)]">Capsule preserves objects best when one object fills the field.</p>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <button type="button" disabled={isExtracting} onClick={() => void confirmSelection()} className="min-h-11 rounded-full bg-[var(--capsule-bone)] px-7 py-3.5 text-sm font-semibold text-[var(--capsule-graphite-black)] shadow-[0_18px_42px_rgba(0,0,0,0.32)] disabled:opacity-50">
          {isExtracting ? "Sealing Field..." : "Save Object Field"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="device-control-button px-7 py-3.5 text-sm font-medium">Cancel</button>}
        {onRetake && <button type="button" onClick={onRetake} className="device-control-button px-7 py-3.5 text-sm font-medium">Retake</button>}
      </div>
    </div>
  );
}
