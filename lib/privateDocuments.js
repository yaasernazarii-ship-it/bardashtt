import path from 'node:path';

export const PRIVATE_PREFIX = 'private:idcard:';

export function privateDocumentRef(name) {
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes('..')) return null;
  return `${PRIVATE_PREFIX}${name}`;
}

export function privateDocumentName(value) {
  const ref = String(value || '');
  if (!ref.startsWith(PRIVATE_PREFIX)) return null;
  const name = ref.slice(PRIVATE_PREFIX.length);
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes('..')) return null;
  return name;
}

export function privateDocumentPath(name) {
  return path.join(process.cwd(), 'private_uploads', 'id-cards', name);
}

export function privateDocumentUrl(value) {
  const name = privateDocumentName(value);
  return name ? `/api/admin/private-files/${encodeURIComponent(name)}` : null;
}
