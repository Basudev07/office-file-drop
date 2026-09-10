/**
 * Instantly triggers direct file download to user's device.
 * Fetches the file blob to bypass cross-origin browser restrictions on <a download>.
 */
export const downloadFileInstantly = async (
  fileUrl: string,
  fileName: string,
  onStateChange?: (isDownloading: boolean) => void
): Promise<void> => {
  if (!fileUrl) return;

  if (onStateChange) onStateChange(true);

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    }, 1500);
  } catch (error) {
    console.warn('Direct blob download failed, falling back to direct navigation:', error);
    const fallbackAnchor = document.createElement('a');
    fallbackAnchor.href = fileUrl;
    fallbackAnchor.download = fileName;
    fallbackAnchor.target = '_blank';
    fallbackAnchor.rel = 'noopener noreferrer';
    document.body.appendChild(fallbackAnchor);
    fallbackAnchor.click();
    setTimeout(() => document.body.removeChild(fallbackAnchor), 1000);
  } finally {
    if (onStateChange) onStateChange(false);
  }
};
