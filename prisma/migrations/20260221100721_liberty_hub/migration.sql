-- AlterTable
ALTER TABLE "LibertyEvent" ADD COLUMN     "hubId" TEXT;

-- CreateTable
CREATE TABLE "LibertyHub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "socials" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibertyHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HubOwners" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HubOwners_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "LibertyHub_city_idx" ON "LibertyHub"("city");

-- CreateIndex
CREATE INDEX "LibertyHub_isActive_idx" ON "LibertyHub"("isActive");

-- CreateIndex
CREATE INDEX "_HubOwners_B_index" ON "_HubOwners"("B");

-- CreateIndex
CREATE INDEX "LibertyEvent_hubId_idx" ON "LibertyEvent"("hubId");

-- AddForeignKey
ALTER TABLE "LibertyEvent" ADD CONSTRAINT "LibertyEvent_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "LibertyHub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HubOwners" ADD CONSTRAINT "_HubOwners_A_fkey" FOREIGN KEY ("A") REFERENCES "LibertyHub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HubOwners" ADD CONSTRAINT "_HubOwners_B_fkey" FOREIGN KEY ("B") REFERENCES "LibertyUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
