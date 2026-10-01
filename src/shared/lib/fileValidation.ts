const IMAGE_MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const ALLOWED_IMAGE_MIME_TYPES = Object.keys(IMAGE_MIME_EXTENSIONS);
export const IMAGE_ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_MIME_TYPES.join(",");
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File, maxBytes = MAX_IMAGE_UPLOAD_BYTES): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return "Choose a JPG, PNG, or WebP image.";
  }

  if (file.size > maxBytes) {
    return `Choose an image under ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  }

  return null;
}

export function getSafeImageExtension(file: File): string {
  return IMAGE_MIME_EXTENSIONS[file.type as keyof typeof IMAGE_MIME_EXTENSIONS] ?? "jpg";
}
