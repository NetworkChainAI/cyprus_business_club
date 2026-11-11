-- CreateTable
CREATE TABLE "LibertyPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" JSONB NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibertyPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LibertyPost_slug_key" ON "LibertyPost"("slug");

-- CreateIndex
CREATE INDEX "LibertyPost_createdAt_idx" ON "LibertyPost"("createdAt");
