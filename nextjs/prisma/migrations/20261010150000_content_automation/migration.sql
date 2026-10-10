CREATE TABLE "ContentAutomationItem" (
  "id" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "postId" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContentAutomationItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentAutomationItem_sourceHash_key" ON "ContentAutomationItem"("sourceHash");
CREATE INDEX "ContentAutomationItem_section_status_idx" ON "ContentAutomationItem"("section", "status");
CREATE INDEX "ContentAutomationItem_postId_idx" ON "ContentAutomationItem"("postId");
