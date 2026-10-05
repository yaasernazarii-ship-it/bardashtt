#!/usr/bin/env python3
"""تمیزکردن متن کتاب: حذف همپوشانی تکه‌ها و اصلاح آرتیفکت‌های استخراج PDF."""
import re
import sys

RAW = "/project/outputs/book-text.txt"
OUT = "/project/outputs/book-clean.txt"

lines = [l.rstrip() for l in open(RAW, encoding="utf-8")]

# ۱) حذف بلوک‌های تکراری ناشی از همپوشانی تکه‌ها:
# اگر دنباله‌ای از >=3 خط غیرخالی قبلاً دقیقاً دیده شده، حذفش کن.
out = []
seen_windows = set()
i = 0
W = 3
while i < len(lines):
    window = tuple(x for x in lines[i:i + W] if x.strip())
    if len(window) == W and window in seen_windows:
        # از این نقطه تا جایی که تکراری است رد شو
        j = i
        while j < len(lines):
            w2 = tuple(x for x in lines[j:j + W] if x.strip())
            if len(w2) == W and w2 in seen_windows:
                j += 1
            else:
                break
        i = j
        continue
    if len(window) == W:
        seen_windows.add(window)
    out.append(lines[i])
    i += 1

text = "\n".join(out)

# ۲) حذف شماره صفحه‌های تنها و سرصفحه‌های تکراری
text = re.sub(r"\n\s*\d{1,3}\s*\n", "\n", text)
text = re.sub(r"\n\s*(متد پنج سوال طالیی|یاسر نظری)\s*\n", "\n", text)

# ۳) فشرده‌سازی خطوط خالی پشت سر هم
text = re.sub(r"\n{3,}", "\n\n", text)

open(OUT, "w", encoding="utf-8").write(text)

print(f"خطوط اولیه: {len(lines)}")
print(f"خطوط بعد از حذف تکرار: {len(text.splitlines())}")
print(f"کاراکتر اولیه: {sum(len(l) for l in lines)}")
print(f"کاراکتر نهایی: {len(text)}")
