import type { AppUser, ProjectData } from '@/types';

export const PROJECT_DOCUMENT_MAX_SIZE = 25 * 1024 * 1024;
export const PROJECT_DOCUMENT_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function hasPrivateDocumentStore() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN);
}

export function canAccessProjectDocuments(actor: AppUser, project: ProjectData) {
  return actor.type === 'admin' || actor.type === 'employee' || project.userId === actor.id;
}

export function projectDocumentPrefix(projectId: string) {
  return `projects/${projectId}/`;
}

export function sanitizeDocumentFilename(value: string) {
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const safe = normalized
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-120);
  return safe || 'document';
}

export function secureDocumentUrl(projectId: string, documentId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`;
}

export function contentDisposition(filename: string, download: boolean) {
  const asciiName = sanitizeDocumentFilename(filename).replace(/"/g, '');
  const utf8Name = encodeURIComponent(filename).replace(/[!'()*]/g, character => (
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  ));
  return `${download ? 'attachment' : 'inline'}; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`;
}
