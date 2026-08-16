# بازسازی نشان «سازمان آموزش فنی و حرفه‌ای کشور» از تصویرِ واترمارک‌خورده.
#
# فایلی که فرستاده شده واترمارکِ سایتِ عکسِ آماده را دارد و واترمارک روی خودِ نشان هم
# افتاده است. نشان اما یک طرحِ تخت با دقیقاً دو رنگِ سرمه‌ای و قرمز است؛ پس به‌جای
# «پاک‌کردن» واترمارک، نشان از روی رنگ بازسازی می‌شود: هر پیکسل بر پایهٔ خلوصِ رنگش
# (chroma) به سرمه‌ای، قرمز یا پس‌زمینه نسبت داده می‌شود و رنگِ استانداردِ همان ناحیه را
# می‌گیرد. واترمارک خاکستریِ بی‌رنگ است (chroma < 20) و کلاً بیرون می‌ماند، در حالی که
# کم‌رنگ‌ترین پیکسلِ نشان chroma ≈ 46 دارد — فاصله‌ای امن برای جداسازیِ بی‌خطا.
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

SRC = '/project/uploads/Screenshot-2026-08-16-191903.png'
OUT = '/project/outputs/assets/mohr-emza'
SS = 3            # ابرنمونه‌برداری برای لبه‌های نرم بدون هالهٔ واترمارک
OUT_WIDTH = 620
NAVY = (46, 49, 146)
RED = (222, 30, 22)
CHROMA_MIN = 30   # مرزِ جداسازی؛ بینِ ۲۰ (سقفِ واترمارک) و ۴۶ (کفِ نشان)

a = np.asarray(Image.open(SRC).convert('RGB')).astype(np.int16)
chroma = a.max(2) - a.min(2)
mask = chroma > CHROMA_MIN
is_red = (a[:, :, 0] >= a[:, :, 2]) & mask
is_blue = mask & ~is_red


def components(m, connectivity=8):
    h, w = m.shape
    seen = np.zeros_like(m)
    out = []
    steps = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    if connectivity == 8:
        steps += [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    for sy, sx in zip(*np.nonzero(m)):
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
                if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        out.append(comp)
    return sorted(out, key=len, reverse=True)


# تکه‌های خیلی ریز، فرینجِ رنگیِ لبهٔ واترمارک است نه بخشی از نشان.
clean = np.zeros_like(mask)
for c in components(mask):
    if len(c) < 12:
        continue
    ys, xs = zip(*c)
    clean[np.array(ys), np.array(xs)] = True
mask = clean
is_red &= mask
is_blue &= mask

ys, xs = np.nonzero(mask)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
sub_mask = mask[y0:y1, x0:x1]
sub_red = is_red[y0:y1, x0:x1]
sub_blue = is_blue[y0:y1, x0:x1]
h, w = sub_mask.shape

# رنگِ تختِ استاندارد؛ واترمارک که نشان را کم‌رنگ کرده بود کاملاً از بین می‌رود.
rgb = np.zeros((h, w, 3), np.uint8)
rgb[sub_blue] = NAVY
rgb[sub_red] = RED

# لبه‌ها: ماسکِ دودویی را بزرگ می‌کنیم، آنجا نرم می‌کنیم و بعد پایین می‌آوریم. این‌طور
# لبه ضدپله می‌شود بدون اینکه پیکسلِ نیمه‌شفافی از واترمارک وارد شود.
big = Image.fromarray((sub_mask * 255).astype(np.uint8)).resize((w * SS, h * SS), Image.NEAREST)
alpha = np.asarray(big.filter(ImageFilter.GaussianBlur(SS * 0.6)).resize((w, h), Image.LANCZOS))
alpha = np.clip(alpha.astype(np.float32) * 1.25, 0, 255).astype(np.uint8)
alpha[~sub_mask & (alpha < 40)] = 0

# رنگِ ناحیهٔ نیمه‌شفافِ لبه باید از همسایهٔ توپرش بیاید، وگرنه لبه سیاه می‌زند.
fill = Image.fromarray(rgb).filter(ImageFilter.MaxFilter(5))
rgb = np.where(sub_mask[:, :, None], rgb, np.asarray(fill))

rgba = np.dstack([rgb.astype(np.uint8), alpha])
img = Image.fromarray(rgba).resize((OUT_WIDTH, round(h * OUT_WIDTH / w)), Image.LANCZOS)
img.save(f'{OUT}/cert-logo-tvto-full.png', optimize=True)
print(f'cert-logo-tvto-full.png  {img.width}x{img.height}')

# پیش‌نمایش روی زمینهٔ کرمِ گواهی در اندازهٔ واقعیِ چاپ (ارتفاع ۵۸pt با ۳۰۰dpi)
ph = round(58 / 72 * 300)
pw = round(img.width * ph / img.height)
small = img.resize((pw, ph), Image.LANCZOS)
canvas = Image.new('RGB', (pw + 80, ph + 80), (253, 250, 243))
canvas.paste(small, (40, 40), small)
canvas.save(f'{OUT}/preview-tvto-print.png')
print(f'preview-tvto-print.png  {canvas.width}x{canvas.height}')
