-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN "icon" TEXT;

-- CreateTable
CREATE TABLE "MenuOrder" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "customer" TEXT NOT NULL, "place" TEXT NOT NULL, "phone" TEXT, "note" TEXT,
  "total" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuOrderLine" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "itemId" TEXT, "name" TEXT NOT NULL, "price" INTEGER NOT NULL, "quantity" INTEGER NOT NULL,
  CONSTRAINT "MenuOrderLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuSetting" (
  "key" TEXT NOT NULL, "value" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuOrder_code_key" ON "MenuOrder"("code");
CREATE INDEX "MenuOrder_status_createdAt_idx" ON "MenuOrder"("status", "createdAt");
CREATE INDEX "MenuOrderLine_orderId_idx" ON "MenuOrderLine"("orderId");

-- AddForeignKey
ALTER TABLE "MenuOrderLine" ADD CONSTRAINT "MenuOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MenuOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
