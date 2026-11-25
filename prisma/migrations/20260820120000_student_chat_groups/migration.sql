-- CreateTable
CREATE TABLE "ChatGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroupMessage" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatGroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroupRead" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatGroupRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatGroup_lastMessageAt_idx" ON "ChatGroup"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ChatGroupMember_userId_idx" ON "ChatGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatGroupMember_groupId_userId_key" ON "ChatGroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "ChatGroupMessage_groupId_createdAt_idx" ON "ChatGroupMessage"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatGroupRead_userId_idx" ON "ChatGroupRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatGroupRead_groupId_userId_key" ON "ChatGroupRead"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "ChatGroupMember" ADD CONSTRAINT "ChatGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatGroupMessage" ADD CONSTRAINT "ChatGroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatGroupRead" ADD CONSTRAINT "ChatGroupRead_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
