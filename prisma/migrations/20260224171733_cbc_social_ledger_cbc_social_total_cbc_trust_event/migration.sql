-- AlterTable
ALTER TABLE "CbcUserInfo" ADD COLUMN     "trustScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CbcTrustEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CbcTrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CbcSocialLedger" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "sourceUserId" TEXT,
    "action" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "refId" TEXT,
    "refType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CbcSocialLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CbcSocialTotal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "rank" TEXT NOT NULL DEFAULT 'Explorer',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CbcSocialTotal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CbcTrustEvent_userId_createdAt_idx" ON "CbcTrustEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CbcSocialLedger_recipientId_createdAt_idx" ON "CbcSocialLedger"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "CbcSocialLedger_recipientId_action_refId_idx" ON "CbcSocialLedger"("recipientId", "action", "refId");

-- CreateIndex
CREATE INDEX "CbcSocialLedger_sourceUserId_action_createdAt_idx" ON "CbcSocialLedger"("sourceUserId", "action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CbcSocialTotal_userId_key" ON "CbcSocialTotal"("userId");

-- AddForeignKey
ALTER TABLE "CbcTrustEvent" ADD CONSTRAINT "CbcTrustEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CbcUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbcSocialLedger" ADD CONSTRAINT "CbcSocialLedger_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CbcUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbcSocialLedger" ADD CONSTRAINT "CbcSocialLedger_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "CbcUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbcSocialTotal" ADD CONSTRAINT "CbcSocialTotal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CbcUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
