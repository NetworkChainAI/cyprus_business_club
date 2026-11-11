-- CreateEnum
CREATE TYPE "CbcUserRole" AS ENUM ('USER', 'PARTNER', 'RESIDENT', 'ADMIN');

-- AlterTable
ALTER TABLE "CbcUserInfo" ADD COLUMN     "role" "CbcUserRole" NOT NULL DEFAULT 'USER';
