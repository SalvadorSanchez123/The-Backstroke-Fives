/*
  Warnings:

  - You are about to drop the column `name` on the `Album` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Album" DROP COLUMN "name",
ADD COLUMN     "title" TEXT;
