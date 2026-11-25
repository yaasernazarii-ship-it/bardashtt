-- CreateTable
CREATE TABLE "StudentProgressComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdById" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProgressComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentProgressComment_userId_createdAt_idx" ON "StudentProgressComment"("userId", "createdAt");
