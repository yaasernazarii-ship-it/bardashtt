-- نمرهٔ کلاسی می‌تواند اعشاری باشد (مثل ۱۸٫۵)، پس نمرهٔ نهایی هم اعشاری می‌شود.
-- تبدیل INTEGER به DOUBLE PRECISION گسترشی است: مقدارهای ثبت‌شدهٔ قبلی دست‌نخورده می‌مانند.
ALTER TABLE "ExamPermit" ALTER COLUMN "classScore" TYPE DOUBLE PRECISION;

ALTER TABLE "ExamAttempt" ALTER COLUMN "classScore" TYPE DOUBLE PRECISION;
ALTER TABLE "ExamAttempt" ALTER COLUMN "finalPercent" TYPE DOUBLE PRECISION;

-- percent روی گواهی همان نمرهٔ نهایی است؛ examPercent درصد آزمون و همچنان عدد صحیح می‌ماند.
ALTER TABLE "Certificate" ALTER COLUMN "percent" TYPE DOUBLE PRECISION;
ALTER TABLE "Certificate" ALTER COLUMN "classScore" TYPE DOUBLE PRECISION;
