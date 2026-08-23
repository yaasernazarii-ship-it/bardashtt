import { unlink } from 'node:fs/promises';
import path from 'node:path';

const MEDIA_URL = /^\/media\/([A-Za-z0-9._-]+)$/;

export async function removeLocalUploads(urls) {
  const names = new Set();
  for (const url of urls) {
    const match = MEDIA_URL.exec(String(url || ''));
    if (match && !match[1].includes('..')) names.add(match[1]);
  }

  await Promise.all(
    [...names].map((name) =>
      unlink(path.join(process.cwd(), 'uploads', name)).catch(() => {})
    )
  );
}
