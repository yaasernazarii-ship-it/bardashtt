# جدا کردن مهرِ جدید (اسکن تمیزِ IMG_2333) از کاغذ و ساختن PNG با پس‌زمینهٔ شفاف.
# این اسکن برخلاف قبلی جوهرِ پیوسته و پرقدرتی دارد، پس ترمیم خیلی ملایم‌تر است:
# فقط سوراخ‌های ریزِ داخل خطوط پر و نقطه‌های پرتِ کاغذ حذف می‌شوند. بافتِ لبه — همان
# چیزی که مهرِ لاستیکی را واقعی نشان می‌دهد — دست‌نخورده می‌ماند.
import numpy as np
from PIL import Image, ImageOps, ImageFilter
from collections import deque

SRC = '/project/uploads/IMG_2333_ac0a718b.jpeg'
OUT = '/project/outputs/assets/mohr-emza'
UPSCALE = 3
OUT_WIDTH = 620
INK_COLOR = (24, 22, 20)

im = ImageOps.exif_transpose(Image.open(SRC)).convert('RGB')
im = im.resize((im.width * UPSCALE, im.height * UPSCALE), Image.LANCZOS)

# نور کاغذ یکنواخت نیست (سایه و وینیت گوشه‌ها)؛ تقسیم بر پس‌زمینهٔ محو آن را صاف می‌کند.
bg = np.asarray(im.filter(ImageFilter.GaussianBlur(45 * UPSCALE))).astype(np.float32)
norm = np.clip(np.asarray(im).astype(np.float32) / np.maximum(bg, 1) * 255, 0, 255)
lum = norm @ np.array([0.299, 0.587, 0.114], np.float32)

UNIT = UPSCALE * UPSCALE


def components(mask, connectivity=8):
    h, w = mask.shape
    seen = np.zeros_like(mask)
    out = []
    steps = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    if connectivity == 8:
        steps += [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        q = deque([(sy, sx)])
        seen[sy, sx] = True
        comp = []
        while q:
            y, x = q.popleft()
            comp.append((y, x))
            for dy, dx in steps:
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        out.append(comp)
    return sorted(out, key=len, reverse=True)


def to_mask(comps, shape):
    m = np.zeros(shape, bool)
    for c in comps:
        ys, xs = zip(*c)
        m[np.array(ys), np.array(xs)] = True
    return m


def morph(mask, radius, grow):
    f = ImageFilter.MaxFilter if grow else ImageFilter.MinFilter
    img = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(img.filter(f(radius * 2 + 1))) > 0


def fill_holes(mask, max_size):
    """سوراخ‌های محصورِ داخل جوهر را پر می‌کند؛ جاهایی که مهر رنگ نگرفته."""
    filled = mask.copy()
    h, w = mask.shape
    for c in components(~mask, connectivity=4):
        if len(c) > max_size:
            continue
        ys, xs = zip(*c)
        ys, xs = np.array(ys), np.array(xs)
        if ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1:
            continue
        filled[ys, xs] = True
    return filled


ink = lum < 212

# محدودهٔ مهر از تکه‌های بزرگ گرفته می‌شود؛ تکه‌های ریزِ نزدیک به آن (نقطهٔ «خ»، دونقطهٔ
# «ثبت»، ارقام شمارهٔ ثبت) هم نگه داشته می‌شوند و لکه‌های دورافتادهٔ کاغذ کنار می‌روند.
comps = components(ink)
big = [c for c in comps if len(c) >= 120 * UNIT]
big_pts = np.array([p for c in big for p in c])
keep = list(big)
for c in comps:
    if len(c) < 3 * UNIT or len(c) >= 120 * UNIT:
        continue
    cy = sum(p[0] for p in c) / len(c)
    cx = sum(p[1] for p in c) / len(c)
    if np.min(np.abs(big_pts[:, 0] - cy) + np.abs(big_pts[:, 1] - cx)) <= 30 * UPSCALE:
        keep.append(c)
mask = to_mask(keep, ink.shape)

ys, xs = np.nonzero(mask)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
mask = mask[y0:y1, x0:x1]
# آلفا از چگالی جوهر می‌آید تا لبه‌ها نرم بمانند و مهر چاپ‌شده به نظر برسد، نه برش‌خورده.
alpha = np.clip((236 - lum[y0:y1, x0:x1]) / (236 - 150), 0, 1)

solid = mask & (alpha > 0.3)
solid = fill_holes(solid, max_size=45 * UNIT)
solid = morph(morph(solid, 1, True), 1, False)  # بستنِ شکاف‌های مویی
alpha = np.maximum(alpha, solid.astype(np.float32))
mask = mask | solid
# رشته‌های تک‌پیکسلیِ ناشی از دانه‌های کاغذ حذف می‌شوند تا چاپ کثیف دیده نشود.
mask = morph(morph(mask, 1, False), 1, True)

final = np.where(mask, alpha, 0)
h, w = final.shape
rgba = np.zeros((h, w, 4), np.uint8)
rgba[:, :, 0], rgba[:, :, 1], rgba[:, :, 2] = INK_COLOR
rgba[:, :, 3] = (final * 255).astype(np.uint8)

img = Image.fromarray(rgba).resize((OUT_WIDTH, round(h * OUT_WIDTH / w)), Image.LANCZOS)
img.save(f'{OUT}/cert-stamp2-full.png', optimize=True)
print(f'cert-stamp2-full.png  {img.width}x{img.height}  ink px={int(mask.sum())}')

# پیش‌نمایش روی زمینهٔ کرمِ گواهی، در اندازهٔ واقعیِ چاپ (۹۲pt ≈ ۳٫۲cm) با ۳۰۰dpi
box = round(92 / 72 * 300)
prev_h = round(img.height * box / img.width)
canvas = Image.new('RGB', (box + 80, prev_h + 80), (253, 250, 243))
canvas.paste(img.resize((box, prev_h), Image.LANCZOS), (40, 40), img.resize((box, prev_h), Image.LANCZOS))
canvas.save(f'{OUT}/preview-stamp2-print.png')
print(f'preview-stamp2-print.png  {canvas.width}x{canvas.height}')
