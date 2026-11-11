/*
  Warnings:

  - You are about to alter the column `amount` on the `RewardLedger` table. The data in that column could be lost. The data in that column will be cast from `Decimal(78,18)` to `Integer`.
  - You are about to alter the column `totalAmount` on the `RewardTotal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(78,18)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "RewardLedger" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "RewardTotal" ALTER COLUMN "totalAmount" DROP DEFAULT,
ALTER COLUMN "totalAmount" SET DATA TYPE INTEGER;
