/**
 * Profile photo processing.
 *
 * Photos are resized to 160×160 and compressed to JPEG before being
 * stored as data URLs inside the auth record. Without this, a phone
 * photo (2–5 MB) would blow the ~5 MB localStorage quota after one
 * upload; a 160px JPEG is typically 5–15 KB.
 */

export const PHOTO_MAX_EDGE = 160;

interface ProcessPhotoResult {
  dataUrl: string;
}

export async function processProfilePhoto(
  file: File
): Promise<ProcessPhotoResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, WebP…).");
  }

  const bitmap = await loadBitmap(file);

  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_MAX_EDGE;
  canvas.height = PHOTO_MAX_EDGE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser does not support image processing.");
  }

  /* Center-crop to a square, then draw at 160×160 */
  const edge = Math.min(bitmap.width, bitmap.height);
  const cropX = (bitmap.width - edge) / 2;
  const cropY = (bitmap.height - edge) / 2;

  context.drawImage(
    bitmap,
    cropX,
    cropY,
    edge,
    edge,
    0,
    0,
    PHOTO_MAX_EDGE,
    PHOTO_MAX_EDGE
  );

  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  return { dataUrl: canvas.toDataURL("image/jpeg", 0.82) };
}

async function loadBitmap(
  file: File
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  /* Fallback for older browsers without createImageBitmap */
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };

    image.src = url;
  });
}
