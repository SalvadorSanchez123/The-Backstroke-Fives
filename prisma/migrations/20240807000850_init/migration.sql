-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "starRating" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "albumId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_username_key" ON "Review"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Review_albumId_key" ON "Review"("albumId");
