-- اعلان داخلیِ سایت + زمانِ آخرین مشاهدهٔ اعلان‌ها توسط کاربر
ALTER TABLE "User" ADD COLUMN "notificationsReadAt" TIMESTAMP(3);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'content',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
