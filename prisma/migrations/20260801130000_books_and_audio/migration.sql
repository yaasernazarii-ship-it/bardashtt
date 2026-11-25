-- افزودن فیلد صوتی به مطالب
ALTER TABLE "Post" ADD COLUMN "audioUrl" TEXT;

-- جدول کتاب‌های فروشی
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");
CREATE INDEX "Book_published_order_idx" ON "Book"("published", "order");

-- جدول سفارش‌های کتاب
CREATE TABLE "BookOrder" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookOrder_bookId_idx" ON "BookOrder"("bookId");
CREATE INDEX "BookOrder_status_idx" ON "BookOrder"("status");
CREATE INDEX "BookOrder_phone_idx" ON "BookOrder"("phone");

ALTER TABLE "BookOrder" ADD CONSTRAINT "BookOrder_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
