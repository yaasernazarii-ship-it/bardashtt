import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { getSessionUser, isManager } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 6 * 1024 * 1024; // ۶ مگابایت
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const WIDTH = 600; // نسبت ۳×۴ پرسنلی، همان اندازهٔ عکس پروفایل
const HEIGHT = 800;

// آپلود عکس پرسنلی برای صدور دستی گواهی؛ برای هنرجویی که خودش در پروفایل عکس نگذاشته.
// فایل روی پروفایل کاربر نمی‌نشیند و فقط در فرم صدور استفاده می‌شود.
export async function POST(request) {
  const manager = await getSessionUser();
  if (!manager) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(manager)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

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
      // rotate: چرخش خودکار بر اساس EXIF · cover+attention: برش خودکار روی صورت با نسبت ۳×۴
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
    const name = `certphoto-${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
    await writeFile(path.join(dir, name), buf);

    return Response.json({ ok: true, url: `/media/${name}` });
  } catch {
    return Response.json({ ok: false, error: 'آپلود ناموفق بود.' }, { status: 500 });
  }
}
