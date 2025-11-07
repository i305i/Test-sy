// File type utilities

export function getFileTypeLabel(mimeType: string): string {
  const types: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'image/jpeg': 'صورة',
    'image/jpg': 'صورة',
    'image/png': 'صورة',
    'image/gif': 'صورة',
    'image/webp': 'صورة',
    'video/mp4': 'فيديو',
    'video/mpeg': 'فيديو',
    'video/quicktime': 'فيديو',
    'audio/mpeg': 'صوت',
    'audio/wav': 'صوت',
    'text/plain': 'نص',
    'application/zip': 'مضغوط',
    'application/x-rar-compressed': 'مضغوط',
  };

  return types[mimeType] || 'ملف';
}

export function getFileColor(mimeType: string): string {
  if (mimeType?.includes('pdf')) return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
  if (mimeType?.includes('image')) return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
  if (mimeType?.includes('video')) return 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30';
  if (mimeType?.includes('audio')) return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30';
  if (mimeType?.includes('zip') || mimeType?.includes('compressed')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
  return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
}

export function getFileIconType(mimeType: string): string {
  if (mimeType?.includes('pdf')) return 'pdf';
  if (mimeType?.includes('image')) return 'image';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return 'document';
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return 'spreadsheet';
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return 'presentation';
  if (mimeType?.includes('video')) return 'video';
  if (mimeType?.includes('audio')) return 'audio';
  if (mimeType?.includes('zip') || mimeType?.includes('compressed')) return 'archive';
  return 'file';
}

export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (isNaN(size)) return '0 B';
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
  return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  if (days < 365) return `منذ ${Math.floor(days / 30)} أشهر`;
  
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

