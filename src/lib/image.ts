/** Ritaglia al centro e ridimensiona una foto in un quadrato JPEG (data URL). */
export async function fileToAvatarDataUrl(file: File, size = 384): Promise<string> {
  const source = await loadImage(file);
  const side = Math.min(source.width, source.height);
  const sx = (source.width - side) / 2;
  const sy = (source.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponibile");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source.image, sx, sy, side, side, 0, 0, size, size);
  source.close();
  return canvas.toDataURL("image/jpeg", 0.86);
}

interface LoadedImage {
  image: CanvasImageSource;
  width: number;
  height: number;
  close(): void;
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // alcuni formati (es. HEIC su browser non Apple) passano dal fallback
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { image: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}
