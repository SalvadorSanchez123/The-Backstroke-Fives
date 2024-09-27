-- CreateTable
CREATE TABLE "Archive" (
    "id" SERIAL NOT NULL,
    "week" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "lists" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AlbumToArchive" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToArchive_AB_unique" ON "_AlbumToArchive"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToArchive_B_index" ON "_AlbumToArchive"("B");

-- AddForeignKey
ALTER TABLE "_AlbumToArchive" ADD CONSTRAINT "_AlbumToArchive_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToArchive" ADD CONSTRAINT "_AlbumToArchive_B_fkey" FOREIGN KEY ("B") REFERENCES "Archive"("id") ON DELETE CASCADE ON UPDATE CASCADE;
