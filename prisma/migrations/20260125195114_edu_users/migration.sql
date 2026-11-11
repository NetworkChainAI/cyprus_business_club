-- CreateTable
CREATE TABLE "EduUsers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EduUsers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EduUsers_email_key" ON "EduUsers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EduUsers_googleId_key" ON "EduUsers"("googleId");
