CREATE TABLE "ActorPortfolioItem" (
  "id" TEXT NOT NULL,
  "resumeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "aparatUrl" TEXT,
  "title" TEXT,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ActorPortfolioItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ActorPortfolioItem"
  ADD CONSTRAINT "ActorPortfolioItem_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "ActorResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ActorPortfolioItem_resumeId_type_sortOrder_idx"
  ON "ActorPortfolioItem"("resumeId", "type", "sortOrder");
CREATE INDEX "ActorPortfolioItem_resumeId_status_idx"
  ON "ActorPortfolioItem"("resumeId", "status");
CREATE INDEX "ActorPortfolioItem_sourceUrl_idx"
  ON "ActorPortfolioItem"("sourceUrl");
