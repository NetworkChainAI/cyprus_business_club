-- CreateTable
CREATE TABLE "CbcPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" JSONB NOT NULL,
    "image" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "communityId" TEXT,
    "brandId" TEXT,
    "eventId" TEXT,

    CONSTRAINT "CbcPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CbcPost_communityId_createdAt_idx" ON "CbcPost"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "CbcPost_brandId_createdAt_idx" ON "CbcPost"("brandId", "createdAt");

-- CreateIndex
CREATE INDEX "CbcPost_eventId_createdAt_idx" ON "CbcPost"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "CbcPost_authorId_createdAt_idx" ON "CbcPost"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "CbcPost" ADD CONSTRAINT "CbcPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "CbcUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbcPost" ADD CONSTRAINT "CbcPost_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbcPost" ADD CONSTRAINT "CbcPost_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbcPost" ADD CONSTRAINT "CbcPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
