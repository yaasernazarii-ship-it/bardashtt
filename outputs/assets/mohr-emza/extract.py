# جدا کردن مهر (مشکی) و امضا (آبی) از عکسِ کاغذ و ساختن PNG با پس‌زمینهٔ شفاف
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

SRC = '/project/uploads/IMG_9560.jpeg'
OUT = '/project/outputs/assets/stamp-work'

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float32)

# نور کاغذ یکنواخت نیست؛ با تقسیم بر پس‌زمینهٔ محو، سایه و گرادیانِ عکس حذف می‌شود
bg = np.asarray(im.filter(ImageFilter.GaussianBlur(45))).astype(np.float32)
norm = np.clip(a / np.maximum(bg, 1) * 255, 0, 255)
lum = norm @ np.array([0.299, 0.587, 0.114], np.float32)
bd = norm[:, :, 2] - norm[:, :, 0]  # آبیِ خودکار در برابر مشکیِ مهر

ink = lum < 205
blue = ink & (bd > 10)
black = ink & ~blue


def components(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask)
    out = []
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        q = deque([(sy, sx)])
        seen[sy, sx] = True
        comp = []
        while q:
            y, x = q.popleft()
            comp.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
        out.append(comp)
    return sorted(out, key=len, reverse=True)


def to_mask(comps, shape):
    m = np.zeros(shape, bool)
    for c in comps:
        for y, x in c:
            m[y, x] = True
    return m


def bbox(comps):
    ys = [p[0] for c in comps for p in c]
    xs = [p[1] for c in comps for p in c]
    return min(xs), max(xs), min(ys), max(ys)


# امضا یک خطِ پیوسته است: بزرگ‌ترین تکهٔ آبی. باقیِ لکه‌های آبی نوفهٔ فشرده‌سازی JPEG
# روی جوهر مشکیِ مهر است، نه امضا.
blue_comps = components(blue)
sig_mask = to_mask(blue_comps[:1], blue.shape)

# مهر نقطه‌نقطه است و به ده‌ها تکه می‌شکند؛ پس محدودهٔ مهر را از تکه‌های بزرگ می‌گیریم و
# بعد هر تکهٔ ریزِ داخل همان محدوده (نقطهٔ «ث»، دونقطه، شمارهٔ ثبت) را هم نگه می‌داریم.
black_comps = components(black)
big = [c for c in black_comps if len(c) >= 100]
big_pts = np.array([p for c in big for p in c])
keep = list(big)
for c in black_comps:
    if len(c) < 4 or len(c) >= 100:
        continue
    cy = sum(p[0] for p in c) / len(c)
    cx = sum(p[1] for p in c) / len(c)
    # تکهٔ ریز فقط وقتی جزو مهر است که چسبیده به بدنهٔ مهر باشد (نقطهٔ «ث»، دونقطه،
    # ارقام شمارهٔ ثبت). لکه‌های دورافتادهٔ کاغذ و جوهرِ پخش‌شده کنار گذاشته می‌شوند.
    if np.min(np.abs(big_pts[:, 0] - cy) + np.abs(big_pts[:, 1] - cx)) <= 35:
        keep.append(c)
stamp_mask = to_mask(keep, black.shape)
print(f'مهر: {len(keep)} تکه از {len(black_comps)} | امضا: بزرگ‌ترین تکه از {len(blue_comps)}')

# آلفای نرم از چگالی جوهر ساخته می‌شود تا بافتِ واقعیِ مهر (نقطه‌نقطه) حفظ شود
soft = np.clip((238.0 - lum) / (238.0 - 105.0), 0, 1)


def export(mask, color, name, scale=2):
    grown = np.asarray(
        Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    ) > 0
    alpha = np.where(grown, soft, 0)
    ys, xs = np.nonzero(alpha > 0.05)
    sub = alpha[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = sub.shape
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[:, :, 0], rgba[:, :, 1], rgba[:, :, 2] = color
    rgba[:, :, 3] = (sub * 255).astype(np.uint8)
    img = Image.fromarray(rgba).resize((w * scale, h * scale), Image.LANCZOS)
    img.save(f'{OUT}/{name}.png')
    print(f'{name}.png  {img.width}x{img.height}  نسبت عرض به ارتفاع={img.width / img.height:.2f}')
    return img


export(stamp_mask, (26, 24, 22), 'cert-stamp')
export(sig_mask, (28, 46, 130), 'cert-signature')
