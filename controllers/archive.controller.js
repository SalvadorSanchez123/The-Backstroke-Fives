import { PrismaClient } from '@prisma/client';
import albums from './album.controller.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
dayjs.extend(isoWeek);

const prisma = new PrismaClient();

const addOne = async (req, res) => {
    const topLists = await albums.getTopFiveLists(req, res);

    const existsArchive = await prisma.archive.findFirst({
        where: {
            week: topLists.date.weekNumber,
            year: topLists.date.year,
        },
    });

    if (existsArchive) {
        return;
    }

    if (!topLists.albumsToArchive) {
        const archive = await prisma.archive.create({
            data: {
                week: `${topLists.date.weekNumber}`,
                year: `${topLists.date.year}`,
                lists: null,
            },
        });
    }
    else {
        const archive = await prisma.archive.create({
            data: {
                week: `${topLists.date.weekNumber}`,
                year: `${topLists.date.year}`,
                lists: topLists,
                albums: {
                    connect: topLists.albumsToArchive,
                },
            },
        });
    }
}

const getAll = async (req, res) => {
    const allArchives = await prisma.archive.findMany({});
    res.send(allArchives);
}

const deleteOne = async (req, res) => {
    try {
        const archive  = await prisma.archive.delete({
            where: {
                id: Number.parseInt(req.params.archive),
            },
        });
        res.send(archive);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const updateOne = async (req, res) => {
    try {
        const archive  = await prisma.archive.update({
            where: {
                id: Number.parseInt(req.params.archive),
            },
            data: req.body,
        });
        res.send(archive);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const getOne = async (req, res) => {
    const archive = await prisma.archive.findUnique({
        where: {
            id: Number.parseInt(req.params.archive),
        },
    });

    if (!archive) {
        res.status(404).send();
        return;
    }

    res.send(archive);
}

// router.get('/archives', archives.getArchives);
// router.get('/archives/:archive', archives.getArchives);
// router.get('/archives/album/:album', archives.getArchives);
// router.get('/archives/album/:album/:archive', archives.getArchives);
const getArchives = async (req, res) => {
    let archivesGuide = {};
    const addToArchiveGuide = (archive) => {
        let isEmpty = archive.lists === null ? true : false;
        if (archivesGuide[archive.year] !== undefined) {
            archivesGuide[archive.year][archive.week] = {
                id: archive.id,
                isEmpty: isEmpty,
            };
        }
        else {
            archivesGuide[archive.year] = {};
            archivesGuide[archive.year][archive.week] = {
                id: archive.id,
                isEmpty: isEmpty,
            };
        }
    };

    //produce json blob and archives of specific album
    if (req.params?.album) {
        const albumId = Number.parseInt(req.params.album);
        const album = await prisma.album.findUnique({
            where: {
                id: albumId,
            },
            include: {
                archives: true,
            },
        });
        let archiveIdList = [];
        album.archives.forEach(archive => {
            archiveIdList.push(archive.id);
        });
        const albumArchives = await prisma.archive.findMany({
            where: {
                id: {
                    in: archiveIdList,
                },
            },
        });
        albumArchives.forEach(addToArchiveGuide);

        // produce json blob for chosen archive week from album
        if (req.params?.archive) {
            const archiveId = Number.parseInt(req.params.archive);
            const archive = await prisma.archive.findUnique({
                where: {
                    id: archiveId,
                },
            });
            return res.render('archives', { archives: archivesGuide, blob: archive.lists, album: album });
        }
        // produce archives list without chosen archive 
        else {
            return res.render('archives', { archives: archivesGuide, blob: null, album: album });
        }
    }
    // produce list of all archives
    else {
        const allArchives = await prisma.archive.findMany({});
        allArchives.forEach(addToArchiveGuide);
        // produce json blob of chosen archive
        if (req.params?.archive) {
            const archiveId = Number.parseInt(req.params.archive);
            const archive = await prisma.archive.findUnique({
                where: {
                    id: archiveId,
                },
            });
            return res.render('archives', { archives: archivesGuide, blob: archive.lists, album: null });
        }
        // no archive chosen, just render all archives list
        else {
            return res.render('archives', { archives: archivesGuide, blob: null, album: null });
        }
    }
}


export default {
    addOne,
    getAll,
    deleteOne,
    updateOne,
    getOne,
    getArchives,
}