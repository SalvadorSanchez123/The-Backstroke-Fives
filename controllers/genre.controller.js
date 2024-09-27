import { PrismaClient } from '@prisma/client';
import albums from './album.controller.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
dayjs.extend(isoWeek);

const prisma = new PrismaClient();


const addOne = async (req, res) => {
    let genre = await prisma.genre.create({
        data: req.body
    });

    res.send(genre);
}

const getAll = async (req, res) => {
    const allGenres = await prisma.genre.findMany({
        // include: {
        //     albums: { 
        //         include: {
        //             reviews: true,
        //         },
        //     },
        // },
    });
    res.send(allGenres);
}

const deleteOne = async (req, res) => {
    try {
        const genre  = await prisma.genre.delete({
            where: {
                id: Number.parseInt(req.params.genre),
            },
        });
        res.send(genre);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const updateOne = async (req, res) => {
    try {
        const genre  = await prisma.genre.update({
            where: {
                id: Number.parseInt(req.params.genre),
            },
            data: req.body,
        });
        res.send(genre);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const getOne = async (req, res) => {
    const genre = await prisma.genre.findUnique({
        where: {
            id: Number.parseInt(req.params.genre),
        },
        include: {
            albums: {
                include: {
                    reviews: true,
                },
            },
        },
    });

    if (!genre) {
        res.status(404).send();
        return;
    }

    res.send(genre);
}


//router.get('/genres/toplist/:genre', genres.getTopListByGenre);
const getTopListByGenre = async (req, res) => {
    const weekNumber = dayjs().isoWeek();
    const year = dayjs().isoWeekYear();

    const genreId = Number.parseInt(req.params.genre);

    const genre = await prisma.genre.findUnique({
        where: {
            id: genreId,
        },
        include: {
            albums: {
                include: {
                    reviews: true,
                },
            },
        },
    });

    //order them by star rating, 
    const albumsReviewedThisWeek = albums.getAlbumsReviewedThisWeekSorted(genre.albums); // reviews not necessary
    //officail rating and return filtered data
    const topListOfficial = albumsReviewedThisWeek.map((album) => {
        const officialRating = Number.parseFloat(Math.trunc(album.totalRating * 10)) / 10;
        return {
            id: album.id,
            discogsId: album.discogsId,
            albumArtUrl: album.albumArtUrl,
            title: album.title,
            country: album.country,
            artist: album.artist,
            year: album.year,
            totalRating: officialRating,
            genre: genre.name,
        };
    });

    const genresTopList = {
        name: `Top ${genre.name} Albums: Full List`,
        list: topListOfficial,
        date: {
            weekNumber: weekNumber,
            year: year,
        },
        isTop: false,
    };

    res.render('lists', { topList: genresTopList });
}


const getTopList = async (req, res) => {
    const weekNumber = dayjs().isoWeek();
    const year = dayjs().isoWeekYear();

    const allAlbums = await prisma.album.findMany({
        include: {
            reviews: true,
        },
    });
    //order them by star rating, 
    const albumsReviewedThisWeek = albums.getAlbumsReviewedThisWeekSorted(allAlbums); // reviews not necessary
    //officail rating and return filtered data
    const topListOfficial = await Promise.all(albumsReviewedThisWeek.map(async (album) => {
        const genre = await prisma.genre.findUnique({
            where: {
                id: album.genreId,
            },
        });
        const officialRating = Number.parseFloat(Math.trunc(album.totalRating * 10)) / 10;
        return {
            id: album.id,
            discogsId: album.discogsId,
            albumArtUrl: album.albumArtUrl,
            title: album.title,
            country: album.country,
            artist: album.artist,
            year: album.year,
            totalRating: officialRating,
            genre: genre.name,
        };
    }));

    const topListObject = {
        name: "Top Albums: Full List",//new name (All reviewed this week)
        list: topListOfficial,
        date: {
            weekNumber: weekNumber,
            year: year,
        },
        isTop: true,
    };

    res.render('lists', { topList: topListObject });
}


export default {
    addOne,
    getAll,
    deleteOne,
    updateOne,
    getOne,
    getTopListByGenre,
    getTopList,
}