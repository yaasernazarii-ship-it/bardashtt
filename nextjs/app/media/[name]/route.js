import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

const CONTENT_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  weba: 'audio/webm',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
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

  const intro = name.startsWith('intro-');
  const portfolio = name.startsWith('portfolio-');
  if (intro) {
    const photo = await prisma.resumePhoto.findFirst({
      where: { url: `/media/${name}` },
      select: { approvalStatus: true, resume: { select: { userId: true } } },
    });
    if (!photo) return new Response('Not found', { status: 404 });
    if (photo.approvalStatus !== 'approved') {
      const user = await getSessionUser();
      if (!user || (user.id !== photo.resume.userId && !['admin', 'editor'].includes(user.role))) {
        return new Response('Not found', { status: 404 });
      }
    }
  }
  if (portfolio) {
    const item = await prisma.actorPortfolioItem.findFirst({
      where: { sourceUrl: `/media/${name}` },
      select: { type: true, status: true, resume: { select: { userId: true } } },
    });
    if (!item) return new Response('Not found', { status: 404 });
    if (!(item.type === 'image' && item.status === 'approved')) {
      const user = await getSessionUser();
      if (!user || (user.id !== item.resume.userId && !['admin', 'editor'].includes(user.role))) {
        return new Response('Not found', { status: 404 });
      }
    }
  }

  try {
    const buf = await readFile(path.join(process.cwd(), 'uploads', name));
    return new Response(buf, {
      headers: {
        'Content-Type': type,
        'Cache-Control': intro || portfolio ? 'private, no-store' : 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
