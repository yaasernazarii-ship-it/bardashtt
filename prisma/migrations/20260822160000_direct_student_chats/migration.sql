-- CreateTable
CREATE TABLE "DirectChat" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectChatRead" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectChatRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DirectChat_userAId_userBId_key" ON "DirectChat"("userAId", "userBId");
CREATE INDEX "DirectChat_userAId_lastMessageAt_idx" ON "DirectChat"("userAId", "lastMessageAt");
CREATE INDEX "DirectChat_userBId_lastMessageAt_idx" ON "DirectChat"("userBId", "lastMessageAt");
CREATE INDEX "DirectChatMessage_chatId_createdAt_idx" ON "DirectChatMessage"("chatId", "createdAt");
CREATE UNIQUE INDEX "DirectChatRead_chatId_userId_key" ON "DirectChatRead"("chatId", "userId");
CREATE INDEX "DirectChatRead_userId_idx" ON "DirectChatRead"("userId");

-- AddForeignKey
ALTER TABLE "DirectChatMessage" ADD CONSTRAINT "DirectChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "DirectChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectChatRead" ADD CONSTRAINT "DirectChatRead_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "DirectChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
