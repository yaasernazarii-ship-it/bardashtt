-- افزودن محتوای تلفیقی (ویدیو/صوت) به کتاب‌ها
ALTER TABLE "Book" ADD COLUMN "aparatUrl" TEXT;
ALTER TABLE "Book" ADD COLUMN "audioUrl" TEXT;
