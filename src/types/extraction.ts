export type NormalizedBoundary = {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: "normalized";
};

export type ExtractionMethod = "manual-object-field" | "assisted-object-field" | "simulated-isolation" | "fallback";

export type ExtractionResult = {
  specimenImageDataUrl: string;
  sourceImageDataUrl: string;
  objectBoundary: NormalizedBoundary;
  method: ExtractionMethod;
  confidence: number;
  warnings: string[];
  createdAt: string;
};

export type ObjectFieldTransform = {
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation?: number;
};
