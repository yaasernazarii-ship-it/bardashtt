-- CreateTable
CREATE TABLE "ClassEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "teacher" TEXT,
    "description" TEXT,
    "location" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassEvent_startsAt_idx" ON "ClassEvent"("startsAt");
