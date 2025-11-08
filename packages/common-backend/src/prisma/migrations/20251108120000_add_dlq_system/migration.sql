-- CreateEnum
CREATE TYPE "DLQMessageStatus" AS ENUM('PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REPROCESSED', 'ARCHIVED', 'EXPIRED');

-- CreateTable
CREATE TABLE "dead_letter_messages" (
    "id" TEXT NOT NULL,
    "originalQueue" TEXT NOT NULL,
    "userId" TEXT,
    "gameId" TEXT,
    "sagaId" TEXT,
    "messageBody" JSONB NOT NULL DEFAULT '{}',
    "headers" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "errorDetails" JSONB NOT NULL DEFAULT '{}',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "status" "DLQMessageStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "reprocessedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dead_letter_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dead_letter_messages_originalQueue_createdAt_idx" ON "dead_letter_messages"("originalQueue", "createdAt");

-- CreateIndex
CREATE INDEX "dead_letter_messages_userId_createdAt_idx" ON "dead_letter_messages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "dead_letter_messages_gameId_createdAt_idx" ON "dead_letter_messages"("gameId", "createdAt");

-- CreateIndex
CREATE INDEX "dead_letter_messages_sagaId_idx" ON "dead_letter_messages"("sagaId");

-- CreateIndex
CREATE INDEX "dead_letter_messages_status_priority_createdAt_idx" ON "dead_letter_messages"("status", "priority", "createdAt");
