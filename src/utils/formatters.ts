export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 10) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

export type FileCategory =
  | 'image'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'audio'
  | 'video'
  | 'generic';

export function getFileCategory(mimeType?: string | null, fileName?: string): FileCategory {
  const mime = (mimeType || '').toLowerCase();
  const ext = fileName ? getFileExtension(fileName) : '';

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'image';
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    ['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)
  ) {
    return 'document';
  }
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
  ) {
    return 'spreadsheet';
  }
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    ['ppt', 'pptx', 'key'].includes(ext)
  ) {
    return 'presentation';
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('rar') ||
    mime.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archive';
  }
  if (
    mime.includes('javascript') ||
    mime.includes('json') ||
    mime.includes('html') ||
    ['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'java', 'c', 'cpp', 'html', 'css', 'sql'].includes(ext)
  ) {
    return 'code';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return 'audio';
  }
  if (mime.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return 'video';
  }

  return 'generic';
}

export function isPrintable(mimeType?: string | null, fileName?: string): boolean {
  const category = getFileCategory(mimeType, fileName);
  const ext = fileName ? getFileExtension(fileName) : '';
  return (
    category === 'image' ||
    category === 'pdf' ||
    ext === 'txt' ||
    ext === 'md' ||
    ext === 'log' ||
    (mimeType || '').includes('text')
  );
}
