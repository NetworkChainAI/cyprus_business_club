-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Community_status_idx" ON "Community"("status");
