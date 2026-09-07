import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { privateDocumentName, privateDocumentPath } from './privateDocuments';

const MEDIA_URL = /^\/media\/([A-Za-z0-9._-]+)$/;

export async function removeLocalUploads(urls) {
  const names = new Set();
  const privateNames = new Set();
  for (const url of urls) {
    const match = MEDIA_URL.exec(String(url || ''));
    if (match && !match[1].includes('..')) names.add(match[1]);
    const privateName = privateDocumentName(url);
    if (privateName) privateNames.add(privateName);
  }

  await Promise.all([
    ...[...names].map((name) => unlink(path.join(process.cwd(), 'uploads', name)).catch(() => {})),
    ...[...privateNames].map((name) => unlink(privateDocumentPath(name)).catch(() => {})),
  ]);
}
