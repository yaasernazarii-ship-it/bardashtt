CREATE TABLE "SmsNotificationQueue" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" TEXT,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsNotificationQueue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SmsNotificationQueue_dedupeKey_key" ON "SmsNotificationQueue"("dedupeKey");
CREATE INDEX "SmsNotificationQueue_status_nextAttemptAt_idx" ON "SmsNotificationQueue"("status", "nextAttemptAt");
CREATE INDEX "SmsNotificationQueue_userId_createdAt_idx" ON "SmsNotificationQueue"("userId", "createdAt");
