export function hasImageMimeType(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isAllowedTimeMirrorFile(file: File): boolean {
  return hasImageMimeType(file) && file.size <= 10 * 1024 * 1024;
}
