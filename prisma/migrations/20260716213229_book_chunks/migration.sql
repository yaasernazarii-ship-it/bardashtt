-- CreateTable
CREATE TABLE "BookChunk" (
    "id" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookChunk_idx_idx" ON "BookChunk"("idx");
