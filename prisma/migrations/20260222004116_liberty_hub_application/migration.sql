-- CreateTable
CREATE TABLE "LibertyHubApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "eventTypes" JSONB NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibertyHubApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibertyHubApplication_status_idx" ON "LibertyHubApplication"("status");

-- CreateIndex
CREATE INDEX "LibertyHubApplication_userId_idx" ON "LibertyHubApplication"("userId");

-- AddForeignKey
ALTER TABLE "LibertyHubApplication" ADD CONSTRAINT "LibertyHubApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "LibertyUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
