-- نمرهٔ تکلیف/فعالیت کلاسی (از ۲۰) که مدیر یا ادیتور پیش از شروع آزمون ثبت می‌کند.
ALTER TABLE "ExamPermit" ADD COLUMN "classScore" INTEGER;

-- کپی نمرهٔ کلاسی در لحظهٔ شروع آزمون + نمرهٔ نهایی پس از تصحیح.
ALTER TABLE "ExamAttempt" ADD COLUMN "classScore" INTEGER;
ALTER TABLE "ExamAttempt" ADD COLUMN "finalPercent" INTEGER;

-- ریز نمرهٔ گواهی؛ ستون percent همچنان نمرهٔ نهایی است.
ALTER TABLE "Certificate" ADD COLUMN "examPercent" INTEGER;
ALTER TABLE "Certificate" ADD COLUMN "classScore" INTEGER;

-- آزمون‌های تصحیح‌شدهٔ قبلی نمرهٔ کلاسی نداشته‌اند؛ نمرهٔ نهایی‌شان همان درصد آزمون است.
UPDATE "ExamAttempt" SET "finalPercent" = "percent" WHERE "submittedAt" IS NOT NULL AND "percent" IS NOT NULL;
UPDATE "Certificate" SET "examPercent" = "percent" WHERE "percent" IS NOT NULL;
