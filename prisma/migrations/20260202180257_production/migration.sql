/*
  Warnings:

  - You are about to drop the column `subject` on the `tutors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tutors" DROP COLUMN "subject",
ADD COLUMN     "subjects" TEXT[];
