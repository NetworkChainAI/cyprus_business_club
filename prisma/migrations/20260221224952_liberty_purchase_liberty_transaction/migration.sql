-- CreateEnum
CREATE TYPE "LibertyPaymentProvider" AS ENUM ('STRIPE', 'PAYPAL');

-- CreateTable
CREATE TABLE "LibertyPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibertyPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibertyTransaction" (
    "id" TEXT NOT NULL,
    "provider" "LibertyPaymentProvider" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "amount" DOUBLE PRECISION NOT NULL,
    "providerPaymentId" TEXT,
    "providerData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibertyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LibertyPurchase_transactionId_key" ON "LibertyPurchase"("transactionId");

-- CreateIndex
CREATE INDEX "LibertyPurchase_userId_idx" ON "LibertyPurchase"("userId");

-- CreateIndex
CREATE INDEX "LibertyPurchase_eventId_idx" ON "LibertyPurchase"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "LibertyPurchase_userId_eventId_key" ON "LibertyPurchase"("userId", "eventId");

-- CreateIndex
CREATE INDEX "LibertyTransaction_provider_providerPaymentId_idx" ON "LibertyTransaction"("provider", "providerPaymentId");

-- AddForeignKey
ALTER TABLE "LibertyPurchase" ADD CONSTRAINT "LibertyPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "LibertyUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibertyPurchase" ADD CONSTRAINT "LibertyPurchase_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "LibertyEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibertyPurchase" ADD CONSTRAINT "LibertyPurchase_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LibertyTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
