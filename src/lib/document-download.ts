export function documentFilename(storagePath: string, title: string) {
  const extension = storagePath.split("?")[0]?.split(".").pop()?.toLowerCase();
  const cleanTitle = title.replace(/[\\/:*?"<>|]/g, "-").trim() || "document";
  return extension && extension.length <= 5 && !cleanTitle.toLowerCase().endsWith(`.${extension}`)
    ? `${cleanTitle}.${extension}`
    : cleanTitle;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function deliverDocument(file: File) {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // All iPhone browsers use the same file-save constraints. The native sheet
  // offers “Save to Files” without navigating away from the application.
  if (ios && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return;
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
      throw error;
    }
  }
  downloadBlob(file, file.name);
}