/*
  Warnings:

  - Added the required column `createdBy` to the `Name` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Name" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationCode" TEXT,
ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Name" ADD CONSTRAINT "Name_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
