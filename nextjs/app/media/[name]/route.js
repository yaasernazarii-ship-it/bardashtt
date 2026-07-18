import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const CONTENT_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function GET(request, { params }) {
  const { name } = await params;
  // فقط نام فایل ساده مجاز است (جلوگیری از path traversal)
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  const ext = name.split('.').pop()?.toLowerCase();
  const type = CONTENT_TYPE[ext];
  if (!type) return new Response('Not found', { status: 404 });

  try {
    const buf = await readFile(path.join(process.cwd(), 'uploads', name));
    return new Response(buf, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
