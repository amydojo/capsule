export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type ResizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

type ThumbnailOptions = {
  maxWidth?: number;
  quality?: number;
};

export const validateImageFile = (file: File): { ok: true } | { ok: false; message: string } => {
  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Use an image file for preservation intake." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Image is larger than 8MB. Use a smaller capture for this local prototype." };
  }
  return { ok: true };
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be prepared."));
    image.src = dataUrl;
  });

export const resizeImageDataUrl = async (
  dataUrl: string,
  options: ResizeOptions = {},
): Promise<string> => {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.88 } = options;
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image could not be processed.");

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
};

export const makeThumbnail = async (dataUrl: string, options: ThumbnailOptions = {}): Promise<string> => {
  const { maxWidth = 480, quality = 0.75 } = options;
  return resizeImageDataUrl(dataUrl, { maxWidth, maxHeight: maxWidth, quality });
};
