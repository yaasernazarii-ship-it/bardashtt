import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
// نسبت ۳×۴ پرسنلی
const WIDTH = 600;
const HEIGHT = 800;

// عکس قبلیِ همین کاربر را از دیسک پاک می‌کند تا فایل‌های بی‌استفاده روی سرور تلنبار نشوند.
async function removeOldFile(url) {
  if (!url || !/^\/media\/[A-Za-z0-9._-]+$/.test(url)) return;
  try {
    await unlink(path.join(process.cwd(), 'uploads', url.slice('/media/'.length)));
  } catch { /* فایل قبلاً پاک شده یا وجود ندارد */ }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ ok: false, error: 'فایلی انتخاب نشده است.' }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return Response.json({ ok: false, error: 'فقط تصویر jpg، png یا webp مجاز است.' }, { status: 400 });
    }
    const input = Buffer.from(await file.arrayBuffer());
    if (input.length > MAX_BYTES) {
      return Response.json({ ok: false, error: 'حجم عکس نباید بیشتر از ۶ مگابایت باشد.' }, { status: 400 });
    }

    let buf;
    try {
      // rotate: چرخش خودکار بر اساس EXIF گوشی · cover+attention: برش خودکار روی سوژه با نسبت ۳×۴
      buf = await sharp(input)
        .rotate()
        .resize(WIDTH, HEIGHT, { fit: 'cover', position: sharp.strategy.attention })
        .webp({ quality: 86 })
        .toBuffer();
    } catch {
      return Response.json({ ok: false, error: 'فایل انتخاب‌شده تصویر سالمی نیست.' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'uploads');
    await mkdir(dir, { recursive: true });
    const name = `photo-${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
    await writeFile(path.join(dir, name), buf);
    const url = `/media/${name}`;

    await prisma.user.update({ where: { id: user.id }, data: { photoUrl: url } });
    await removeOldFile(user.photoUrl);

    return Response.json({ ok: true, url });
  } catch {
    return Response.json({ ok: false, error: 'آپلود ناموفق بود.' }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  await prisma.user.update({ where: { id: user.id }, data: { photoUrl: null } });
  await removeOldFile(user.photoUrl);
  return Response.json({ ok: true });
}
