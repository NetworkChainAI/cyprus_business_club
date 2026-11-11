-- CreateTable
CREATE TABLE "PresalePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT,
    "method" TEXT NOT NULL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "week" INTEGER,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tokenAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresalePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresaleTotal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT,
    "totalTokenAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresaleTotal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PresalePurchase_externalId_key" ON "PresalePurchase"("externalId");

-- CreateIndex
CREATE INDEX "PresalePurchase_userId_createdAt_idx" ON "PresalePurchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PresalePurchase_walletId_idx" ON "PresalePurchase"("walletId");

-- CreateIndex
CREATE INDEX "PresalePurchase_status_idx" ON "PresalePurchase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PresaleTotal_userId_key" ON "PresaleTotal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PresaleTotal_walletId_key" ON "PresaleTotal"("walletId");

-- CreateIndex
CREATE INDEX "PresaleTotal_walletId_idx" ON "PresaleTotal"("walletId");

-- AddForeignKey
ALTER TABLE "PresalePurchase" ADD CONSTRAINT "PresalePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "FlyUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresalePurchase" ADD CONSTRAINT "PresalePurchase_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresaleTotal" ADD CONSTRAINT "PresaleTotal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "FlyUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresaleTotal" ADD CONSTRAINT "PresaleTotal_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
