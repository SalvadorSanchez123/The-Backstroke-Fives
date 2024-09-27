import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
dayjs.extend(isoWeek);

const prisma = new PrismaClient();
const token = process.env.DISCOGS_TOKEN;
const baseURL = `https://api.discogs.com/database/search?type=master&format=album&token=${token}`;
// const baseURL = `https://api.discogs.com/database/search?format=album&token=${token}`;

const getSearchPage = (req, res) => {
    res.render('searchalbum');
}

const searchAlbumToReview = async (req, res) => {
    // route user/:user/search
    // req body from form at the top of user search page
    // make sure all the form values are strings
    let url = baseURL;
    // console.log(req.body);
    if (req.query.artist) {
        url = `${url}&artist=${req.query.artist}`;
    }
    if (req.query.country) {
        url = `${url}&country=${req.query.country}`;
    }
    if (req.query.title) {
        url = `${url}&release_title=${req.query.title}`;
    }
    if (req.query.year) {
        url = `${url}&year=${req.query.year}`;
    }

    const response = await fetch(url);
    const jsonResponse = await response.json();
    let resultsList = jsonResponse.results;

    let resultsAbridged = resultsList.map(result => {
        // title: "{artist} - {title}"    
        const regexArtistTitle = /(.*)\s-\s(.*)/;
        const matchGroups = regexArtistTitle.exec(result.title);
        let albumArtist = matchGroups[1];
        let albumTitle = matchGroups[2];

        return {
            discogsId: result.id,
            albumArtUrl: result.thumb,
            title: albumTitle,
            artist: albumArtist,
            country: result.country,
            genre: result.genre[0],
            year: result.year,
        };
    });

    // console.log(resultsAbridged);
    res.render('searchalbum', { results: resultsAbridged });
}

//First by genre tab?
const searchAlbumFromArchive = async (req, res) => {
    //get album from database by search body {where: req.body} return album view with all reviews 
    const album = await prisma.album.findFirst({
        where: req.body,
    });
    // expect to handle null value instead
    res.send(album);
}


const getAlbumsReviewedThisWeekSorted = (allAlbums) => {
    //Albums from this year (OR SHOULD IT BE LAST FIVE YEARS?)
    // const albumsFromthisYear = allAlbums.filter(album => album.year == new Date().getFullYear());
    const albumsFromthisYear = allAlbums;
    // Albums reviewed this week

    //commented out for the sake of keeping portfolio presentable at all times
    const albumsReviewedThisWeek = albumsFromthisYear.filter(album => {
        return album.reviews.some(review => {
            let created = new Date(review.createdAt);
            let lastMonday = new Date(dayjs().startOf('isoWeek'));
            return created > lastMonday;
        });
    });
    // const albumsReviewedThisWeek = albumsFromthisYear;

    const reviewedAndSortedAlbums  = albumsReviewedThisWeek.sort((albumA, albumB) => {
        let a = Number.parseFloat(albumA.totalRating);
        let b = Number.parseFloat(albumB.totalRating);
        return b - a;//descending
    });

    return reviewedAndSortedAlbums;
}


const getTopAlbum = async () => {
    const allAlbums = await prisma.album.findMany({
        include: {
            reviews: true,
        },
    });
    let albumsReviewedThisWeek = getAlbumsReviewedThisWeekSorted(allAlbums);

    // albums that have THE top rating
    let maxRating = albumsReviewedThisWeek[0].totalRating;
    let topRatedAlbums = albumsReviewedThisWeek.filter(album => album.totalRating == maxRating);
    
    // most reviews out of tied top rated albums
    let reviewTotals = topRatedAlbums.map(album => album.reviews.length);
    let maxReviewCount = Math.max(...reviewTotals);
    let topTiedAlbums = topRatedAlbums.filter(album => album.reviews.length == maxReviewCount);

    // most recently reviewed out of top tied albums
    let mostRecentReviewTimes = topTiedAlbums.map(album => {
        let reviewTimes = album.reviews.map(review => review.createdAt.valueOf());
        return Math.max(...reviewTimes);
    });
    let mostRecent = Math.max(...mostRecentReviewTimes);
    let topAlbum = topTiedAlbums.find(album => {
        return album.reviews.some(review => review.createdAt.valueOf() == mostRecent);
    });

    //official rating and removing reviews
    const genre = await prisma.genre.findUnique({
        where: {
            id: topAlbum.genreId,
        },
    });
    const officialRating = Number.parseFloat(Math.trunc(topAlbum.totalRating * 10)) / 10;
    return {
        id: topAlbum.id,
        discogsId: topAlbum.discogsId,
        albumArtUrl: topAlbum.albumArtUrl,
        title: topAlbum.title,
        country: topAlbum.country,
        artist: topAlbum.artist,
        year: topAlbum.year,
        totalRating: officialRating,
        genre: genre.name,
    };
}


const getTopFiveLists = async (req, res) => {
    const weekNumber = dayjs().isoWeek();
    const year = dayjs().isoWeekYear();

    //Top five:
    //get all albums
    const allAlbums = await prisma.album.findMany({
        include: {
            reviews: true,
        },
    });
    //order them by star rating, 
    const albumsReviewedThisWeek = getAlbumsReviewedThisWeekSorted(allAlbums); // reviews not necessary

    //if no albums reviewed this week
    if (albumsReviewedThisWeek.length == 0) {
        return {
            topAlbum: null,
            lists: null,
            date: {
                weekNumber: weekNumber,
                year: year,
            },
            albumsToArchive: null,
        };
    }

    //officail rating and return filtered data
    const topFiveAlbumsList = albumsReviewedThisWeek.slice(0, 5);//top five
    const topFiveListOfficial = await Promise.all(topFiveAlbumsList.map(async (album) => {
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

    //Top five from all Genre and Full List of albums in the archive collection:
    let albumsToArchive = [];
    //Get all genres
    const allGenres = await prisma.genre.findMany({
        include: {
            albums: { 
                include: {
                    reviews: true,
                },
            },
        },
    });
    //get top five by genre
    const topGenresUnfilterd = allGenres.map(genre => {
        const genreAlbumsReviewedThisWeek = getAlbumsReviewedThisWeekSorted(genre.albums);
        if (genreAlbumsReviewedThisWeek.length == 0) {
            return null;
        }
        //official rating and filtered data
        const topFiveGenreAlbums = genreAlbumsReviewedThisWeek.slice(0,5);//top five
        const topFiveGenreAlbumsOfficial = topFiveGenreAlbums.map((album) => {
            albumsToArchive.push({ id: album.id });

            const officialGenreRating = Number.parseFloat(Math.trunc(album.totalRating * 10)) / 10;
            return {
                id: album.id,
                discogsId: album.discogsId,
                albumArtUrl: album.albumArtUrl,
                title: album.title,
                country: album.country,
                artist: album.artist,
                year: album.year,
                totalRating: officialGenreRating,
                genre: genre.name,
            };
        });

        return {
            name: genre.name,
            genreId: genre.id,
            albums: topFiveGenreAlbumsOfficial,
        };
    });
    //filter out null results 
    const filteredTopGenres = topGenresUnfilterd.filter(genre => genre !== null);

    const topAlbumsLists = {
        topFiveAlbums: topFiveListOfficial,//top five array
        topFiveByGenre: filteredTopGenres, //genres top five
    };
    // console.log(topFiveListOfficial);
    const topAlbum = await getTopAlbum();
    // console.log(weekNumber);

    const topLists = {
        topAlbum: topAlbum,
        lists: topAlbumsLists,
        date: {
            weekNumber: weekNumber,
            year: year,
        },
        albumsToArchive: albumsToArchive,
    };

    return topLists;
}

const getHomePage = async (req, res) => {
    const topLists = await getTopFiveLists(req, res);
    return res.render('home', { topLists: topLists });
}



const getAllReviews = async (req, res) => {
    const albumId = Number.parseInt(req.params.album);
    const album = await prisma.album.findUnique({
        where: {
            id: albumId,
        },
        include: {
            reviews: true,
            archives: true,
        },
    });

    const reviewers = await Promise.all(album.reviews.map(async (review) => {
        const user = await prisma.user.findUnique({
            where: {
                id: review.reviewerId,
            },
        });

        const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(review.createdAt);
        const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(review.createdAt);
        const day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(review.createdAt);
        
        return {
            user: user,
            review: {
                id: review.id,
                starRating: review.starRating,
                comment: review.comment,
                createdAt: `${day}-${month}-${year}`,
            },
        };
    }));

    const officialRating = Number.parseFloat(Math.trunc(album.totalRating * 10)) / 10;
    const hasArchives = album.archives.length == 0 ? false : true;
    const albumObject = {
        album: {
            id: album.id,
            albumArtUrl: album.albumArtUrl,
            title: album.title,
            country: album.country,
            artist: album.artist,
            year: album.year,
            totalRating: officialRating,
            hasArchives: hasArchives,
        },
        reviewersList: reviewers,
    };
    // has all info for single album and all its reviews for viewing in single album view
    res.render('albumreviews', { albumReviews: albumObject });
}


const getAll = async (req, res) => {
    const allAlbums = await prisma.album.findMany({
        // include: {
        //     reviews: true,
        // },
    });
    res.send(allAlbums);
}


const getRandom10 = async (req, res) => {
    const allAlbums = await prisma.album.findMany();
    // Well rated albums being over 7/10
    const wellRatedAlbums = allAlbums.filter(album => album.totalRating >= 7);

    let currentIndex = wellRatedAlbums.length;
    // While there remains elements to shuffle
    while (currentIndex != 0) {
      // Pick a remaining element
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      // And swap it with the current element.
      [wellRatedAlbums[currentIndex], wellRatedAlbums[randomIndex]] = [wellRatedAlbums[randomIndex], wellRatedAlbums[currentIndex]];
    }

    const randListObj = wellRatedAlbums.slice(0,10).map(album => {
        let officialRating = Number.parseFloat(Math.trunc(album.totalRating * 10)) / 10;
        return {
            id: album.id,
            albumArtUrl: album.albumArtUrl,
            title: album.title,
            country: album.country,
            artist: album.artist,
            year: album.year,
            totalRating: officialRating,
        };
    });

    res.render('random10', { randList: randListObj });
}

const getOne = async (req, res) => {
    const album = await prisma.album.findUnique({
        where: {
            id: Number.parseInt(req.params.album),
        },
        include: {
            reviews: true,
        },
    });

    res.send(album);
}

export default {
    getOne,
    getTopFiveLists,
    searchAlbumToReview,
    getSearchPage,
    searchAlbumFromArchive,
    getTopAlbum,
    getAllReviews,
    getAll,
    getAlbumsReviewedThisWeekSorted,
    getRandom10,
    getHomePage,
}