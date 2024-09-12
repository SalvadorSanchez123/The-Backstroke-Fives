/*
  Warnings:

  - You are about to drop the column `albumArtURL` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `discogsID` on the `Album` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[discogsId]` on the table `Album` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Album_discogsID_key";

-- AlterTable
ALTER TABLE "Album" DROP COLUMN "albumArtURL",
DROP COLUMN "discogsID",
ADD COLUMN     "albumArtUrl" TEXT,
ADD COLUMN     "discogsId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Album_discogsId_key" ON "Album"("discogsId");
