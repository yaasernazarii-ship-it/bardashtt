# خط آماده‌سازی کتاب و بانک سؤال

اسکریپت‌های **یک‌بارمصرف** که متن کتاب «متد پنج سؤال طلایی» و بانک سؤال آزمون را
آماده و وارد دیتابیس کردند. بخشی از اپلیکیشن نیستند و در زمان اجرای سایت صدا زده نمی‌شوند.

نگه داشته شده‌اند تا اگر کتاب یا سؤال‌ها به‌روزرسانی شد، دوباره قابل استفاده باشند.

## مرحله‌ها

| # | اسکریپت | کار |
|---|---|---|
| ۱ | `clean-book.py` | حذف سرصفحه/پاصفحه و نویزِ استخراجِ PDF |
| ۲ | `normalize-book.py` | یکدست‌سازی نویسهٔ فارسی (ی/ک عربی، نیم‌فاصله، اعداد) |
| ۳ | `shuffle-questions.py` | جابه‌جا کردن ترتیب گزینه‌های آزمون |
| ۴ | `check-questions.py` | اعتبارسنجی ساختار سؤال‌ها پیش از ورود به دیتابیس |
| ۵ | `import-questions.mjs` | نوشتن سؤال‌ها در جدول `ExamQuestion` |

بارگذاری متن کتاب برای دستیار هوشمند (Bardasht.AI) با اسکریپتِ جداگانهٔ
`nextjs/scripts/ingest-book.js` انجام می‌شود؛ آن یکی متن را تکه می‌کند،
embedding می‌سازد و در جدول `BookChunk` می‌ریزد.

## داده‌ها (`data/`)

| فایل | چیست |
|---|---|
| `book-text.txt` | متن خام، مستقیم از PDF |
| `book-clean.txt` | همان متن بعد از پاک‌سازی و یکدست‌سازی |
| `exam-questions.txt` | بانک سؤال اولیه |
| `exam-questions-final.txt` | نسخهٔ نهایی که در دیتابیس نشست |

منبع اصلی (PDF و خروجی OCR) در `outputs/assets/` است.

## اجرا

```bash
python3 clean-book.py  data/book-text.txt  data/book-clean.txt
python3 check-questions.py data/exam-questions-final.txt

# ورود به دیتابیس — باید از ریشهٔ اپ اجرا شود تا .env و Prisma Client پیدا شوند
cd /var/www/bardasht-nextjs
node /path/to/import-questions.mjs /path/to/exam-questions-final.txt
```

> ورود سؤال به دیتابیس **افزایشی** است؛ پیش از اجرای دوباره حتماً بکاپ بگیرید
> (`tools/db-backup.sh`) وگرنه سؤال‌ها تکراری ثبت می‌شوند.
