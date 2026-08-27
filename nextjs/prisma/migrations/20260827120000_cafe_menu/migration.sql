-- CreateTable
CREATE TABLE "MenuCategory" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "kind" TEXT NOT NULL DEFAULT 'items', "imageUrl" TEXT, "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MenuItem" (
  "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "price" INTEGER NOT NULL, "imageUrl" TEXT,
  "available" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MenuExpense" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "amount" INTEGER NOT NULL, "expenseDate" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuExpense_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MenuSale" (
  "id" TEXT NOT NULL, "amount" INTEGER NOT NULL, "saleDate" TIMESTAMP(3) NOT NULL, "note" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuSale_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MenuCategory_active_sortOrder_idx" ON "MenuCategory"("active", "sortOrder");
CREATE INDEX "MenuItem_categoryId_sortOrder_idx" ON "MenuItem"("categoryId", "sortOrder");
CREATE INDEX "MenuExpense_expenseDate_idx" ON "MenuExpense"("expenseDate");
CREATE INDEX "MenuSale_saleDate_idx" ON "MenuSale"("saleDate");
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "MenuCategory" ("id", "name", "kind", "sortOrder", "updatedAt") VALUES
('menu-breakfast', 'صبحانه و عصرانه', 'items', 1, CURRENT_TIMESTAMP),
('menu-cake', 'کیک', 'items', 2, CURRENT_TIMESTAMP),
('menu-cold-drinks', 'نوشیدنی سرد', 'items', 3, CURRENT_TIMESTAMP),
('menu-hot-drinks', 'نوشیدنی گرم', 'items', 4, CURRENT_TIMESTAMP),
('menu-burger', 'برگر', 'items', 5, CURRENT_TIMESTAMP),
('menu-pasta', 'پاستا', 'items', 6, CURRENT_TIMESTAMP),
('menu-potato', 'سیب‌زمینی', 'items', 7, CURRENT_TIMESTAMP),
('menu-coffee', 'قهوه', 'items', 8, CURRENT_TIMESTAMP),
('menu-juice', 'آبمیوه و اسموتی', 'items', 9, CURRENT_TIMESTAMP),
('menu-ice-coffee', 'آیس‌کافی', 'items', 10, CURRENT_TIMESTAMP),
('menu-tea', 'چای', 'items', 11, CURRENT_TIMESTAMP),
('menu-herbal-tea', 'دمنوش', 'items', 12, CURRENT_TIMESTAMP),
('menu-entertainment', 'سرگرمی', 'image', 13, CURRENT_TIMESTAMP);
