-- ستون‌های موردنیاز برای یادآوری پیامکی سبد رهاشدهٔ کتاب (Abandoned Checkout)
ALTER TABLE "BookOrder" ADD COLUMN "reminderSmsClaimedAt" TIMESTAMP(3);
ALTER TABLE "BookOrder" ADD COLUMN "reminderSmsSentAt" TIMESTAMP(3);

CREATE INDEX "BookOrder_reminderSmsSentAt_idx" ON "BookOrder"("reminderSmsSentAt");
