// Triggers a client-side download of text content by creating a temporary
// object URL and clicking a hidden anchor. Browser-only.
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "application/json"
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
