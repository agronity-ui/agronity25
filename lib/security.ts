import DOMPurify from 'isomorphic-dompurify';

export function sanitizeText(input: string) {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

export function safeFilePath(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').slice(-90) || 'file';
}

export function assertAllowedFile(file: File, types: string[], maxMb: number) {
  if (!types.some(t => file.type.startsWith(t))) throw new Error(`Tipe file tidak didukung: ${file.type}`);
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Ukuran file maksimal ${maxMb} MB.`);
}
