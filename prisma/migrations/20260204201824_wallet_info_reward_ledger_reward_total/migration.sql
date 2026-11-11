-- CreateTable
CREATE TABLE "WalletInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "provider" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "taskKey" TEXT NOT NULL,
    "taskTitle" TEXT,
    "amount" DECIMAL(78,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardTotal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "totalAmount" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardTotal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletInfo_userId_key" ON "WalletInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletInfo_address_key" ON "WalletInfo"("address");

-- CreateIndex
CREATE INDEX "RewardLedger_walletAddress_idx" ON "RewardLedger"("walletAddress");

-- CreateIndex
CREATE INDEX "RewardLedger_userId_createdAt_idx" ON "RewardLedger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RewardLedger_userId_taskKey_key" ON "RewardLedger"("userId", "taskKey");

-- CreateIndex
CREATE UNIQUE INDEX "RewardTotal_userId_key" ON "RewardTotal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardTotal_walletAddress_key" ON "RewardTotal"("walletAddress");

-- CreateIndex
CREATE INDEX "RewardTotal_walletAddress_idx" ON "RewardTotal"("walletAddress");

-- AddForeignKey
ALTER TABLE "WalletInfo" ADD CONSTRAINT "WalletInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "FlyUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardLedger" ADD CONSTRAINT "RewardLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "FlyUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardTotal" ADD CONSTRAINT "RewardTotal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "FlyUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
