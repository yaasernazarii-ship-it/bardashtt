-- کد پستی گیرنده برای سفارش کتاب
ALTER TABLE "BookOrder" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
