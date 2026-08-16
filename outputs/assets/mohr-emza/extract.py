# جدا کردن مهر (مشکی) و امضا (آبی) از عکسِ کاغذ و ساختن PNG با پس‌زمینهٔ شفاف.
# مهر روی کاغذِ ناصاف خورده و جای‌جایش رنگ نگرفته؛ اینجا ترمیم می‌شود: سوراخ‌های ریزِ
# داخلِ خطوط پر می‌شوند و جوهرِ کم‌رنگ پررنگ می‌شود، ولی بافتِ لبه دست‌نخورده می‌ماند.
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

SRC = '/project/uploads/IMG_9560.jpeg'
OUT = '/project/outputs/assets/mohr-emza'
UPSCALE = 3  # پردازش در بزرگ‌نمایی تا ترمیم ظریف‌تر انجام شود

im = Image.open(SRC).convert('RGB')
im = im.resize((im.width * UPSCALE, im.height * UPSCALE), Image.LANCZOS)
a = np.asarray(im).astype(np.float32)

# نور کاغذ یکنواخت نیست؛ با تقسیم بر پس‌زمینهٔ محو، سایه و گرادیانِ عکس حذف می‌شود
bg = np.asarray(im.filter(ImageFilter.GaussianBlur(45 * UPSCALE))).astype(np.float32)
norm = np.clip(a / np.maximum(bg, 1) * 255, 0, 255)
lum = norm @ np.array([0.299, 0.587, 0.114], np.float32)
bd = norm[:, :, 2] - norm[:, :, 0]  # آبیِ خودکار در برابر مشکیِ مهر

ink = lum < 210
blue = ink & (bd > 10)
black = ink & ~blue

UNIT = UPSCALE * UPSCALE  # ضریب تبدیل «تعداد پیکسل» به مقیاس بزرگ‌نمایی‌شده


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


# امضا یک خطِ پیوسته است: بزرگ‌ترین تکهٔ آبی. باقیِ لکه‌های آبی نوفهٔ فشرده‌سازی JPEG
# روی جوهرِ مشکیِ مهر است، نه امضا.
sig_mask = to_mask(components(blue)[:1], blue.shape)

# مهر نقطه‌نقطه است و به ده‌ها تکه می‌شکند؛ محدودهٔ مهر از تکه‌های بزرگ گرفته می‌شود و
# تکه‌های ریزِ چسبیده به آن (نقطهٔ «ث»، دونقطه، ارقام شمارهٔ ثبت) هم نگه داشته می‌شوند.
black_comps = components(black)
big = [c for c in black_comps if len(c) >= 100 * UNIT]
big_pts = np.array([p for c in big for p in c])
keep = list(big)
for c in black_comps:
    if len(c) < 4 * UNIT or len(c) >= 100 * UNIT:
        continue
    cy = sum(p[0] for p in c) / len(c)
    cx = sum(p[1] for p in c) / len(c)
    if np.min(np.abs(big_pts[:, 0] - cy) + np.abs(big_pts[:, 1] - cx)) <= 35 * UPSCALE:
        keep.append(c)
stamp_mask = to_mask(keep, black.shape)


def morph(mask, radius, grow):
    f = ImageFilter.MaxFilter if grow else ImageFilter.MinFilter
    img = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(img.filter(f(radius * 2 + 1))) > 0


def fill_holes(mask, max_size):
    """سوراخ‌های محصورِ داخل جوهر را پر می‌کند؛ همان جاهایی که مهر رنگ نگرفته."""
    filled = mask.copy()
    h, w = mask.shape
    for c in components(~mask, connectivity=4):
        if len(c) > max_size:
            continue
        ys, xs = zip(*c)
        ys, xs = np.array(ys), np.array(xs)
        # حفره‌ای که به لبهٔ تصویر برسد سوراخ نیست، فضای بیرونِ مهر است
        if ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1:
            continue
        filled[ys, xs] = True
    return filled


def soft_alpha(lo, hi):
    """آلفا از چگالی جوهر؛ برای مهر بازهٔ تندتری می‌گیریم تا جوهرِ کم‌رنگ هم پررنگ شود."""
    return np.clip((hi - lum) / (hi - lo), 0, 1)


def densify(mask, radius, thresh):
    """جایی که مهر نقطه‌نقطه خورده ولی پوششِ جوهر بالاست را یکدست می‌کند.

    چگالیِ محلیِ جوهر با محوکردن ماسک اندازه گرفته می‌شود؛ ناحیه‌ای که بیش از `thresh`
    آن جوهر دارد یعنی در طرحِ اصلی توپر بوده و فقط رنگ نگرفته. چشم و لبخندِ ماسک و
    فاصلهٔ بین حروف چگالیِ پایینی دارند و دست‌نخورده می‌مانند.
    """
    img = Image.fromarray((mask * 255).astype(np.uint8))
    dens = np.asarray(img.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255
    return mask | (dens > thresh)


def export(mask, color, name, alpha, out_width, repair=False):
    ys, xs = np.nonzero(mask)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sub_mask = mask[y0:y1, x0:x1]
    sub_alpha = alpha[y0:y1, x0:x1]

    if repair:
        solid = sub_mask & (sub_alpha > 0.25)
        solid = densify(solid, 3 * UPSCALE, 0.5)
        solid = fill_holes(solid, max_size=110 * UNIT)
        solid = morph(morph(solid, 1, True), 1, False)  # بستنِ شکاف‌های مویی
        solid = fill_holes(solid, max_size=110 * UNIT)
        sub_alpha = np.maximum(sub_alpha, solid.astype(np.float32))
        sub_mask = sub_mask | solid
        # نقطه‌های پراکندهٔ جوهر در ناحیهٔ کم‌رنگ، چاپی کثیف به نظر می‌رسند؛ رشته‌های
        # یک‌پیکسلی حذف می‌شوند تا محوشدنِ مهر طبیعی دیده شود نه نویز.
        sub_mask = morph(morph(sub_mask, 1, False), 1, True)

    grown = morph(sub_mask, 2, True)
    final = np.where(grown, sub_alpha, 0)

    h, w = final.shape
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[:, :, 0], rgba[:, :, 1], rgba[:, :, 2] = color
    rgba[:, :, 3] = (final * 255).astype(np.uint8)
    img = Image.fromarray(rgba).resize((out_width, round(h * out_width / w)), Image.LANCZOS)
    img.save(f'{OUT}/{name}-full.png', optimize=True)
    print(f'{name}-full.png  {img.width}x{img.height}')
    return img


export(stamp_mask, (26, 24, 22), 'cert-stamp', soft_alpha(196, 236), 600, repair=True)
export(sig_mask, (28, 46, 130), 'cert-signature', soft_alpha(120, 236), 600)
