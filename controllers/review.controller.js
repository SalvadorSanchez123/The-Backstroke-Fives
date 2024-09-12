import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const token = process.env.DISCOGS_TOKEN;


//router.post('/reviews/:user/:album', reviews.addOne);
const addOne = async (req, res) => {
    const user = Number.parseInt(req.user.id);
    const discogsAlbumId = Number.parseInt(req.params.album);

    const album = await prisma.album.findUnique({
        where: {
            discogsId: discogsAlbumId,
        },
        include: {
            reviews: true,
        },
    });

    // if user has already reviewed this album
    if(album) {
        const reviewExists = await prisma.review.findFirst({
            where: {
                albumId: album.id,
                reviewerId: user,
            },
        });
        if (reviewExists) {
            // res.redirect(`/albums/reviews/${album.id}`);
            res.render('addreview', {
                album: null,
                message: "You've already reviewed this album",
            });
            return;
        }
    }

    // Get/Create Album
    let confirmedAlbum = null;
    if (!album) {
        const mastersUrl = `https://api.discogs.com/masters/${discogsAlbumId}?token=${token}`;
        const mastersRes = await fetch(mastersUrl);
        const mastersJson = await mastersRes.json();

        const mainReleaseUrl = `https://api.discogs.com/releases/${mastersJson.main_release}?token=${token}`;
        const mainReleaseRes = await fetch(mainReleaseUrl);
        const mainReleaseJson = await mainReleaseRes.json();

        // Get data
        const genreName = mainReleaseJson.genres[0];
        const newAlbumArtUrl = mainReleaseJson.images[0].uri;
        const newTitle = mainReleaseJson.title;
        const newCountry = mainReleaseJson.country;
        const newArtist = mainReleaseJson.artists[0].name;
        const newYear = `${mainReleaseJson.year}`;

        // Get/Create Genre
        const genre = await prisma.genre.findUnique({
            where: {
                name: genreName,
            },
            include: {
                albums: true,
            },
        });
        let confirmedGenre = null;
        if (!genre) {
            confirmedGenre = await prisma.genre.create({
                data: {
                    name: genreName,
                },
            });
        } else {
            confirmedGenre = genre;
        }

        // Create new album
        confirmedAlbum = await prisma.album.create({
            data: {
                discogsId: discogsAlbumId,
                albumArtUrl: newAlbumArtUrl,
                title: newTitle,
                country: newCountry,
                artist: newArtist,
                year: newYear,
                totalRating: req.body.starRating,
                genreId: confirmedGenre.id,
            },
        });
    } else {
        confirmedAlbum = album;
        let oldReviewCount = confirmedAlbum.reviews.length;
        let newReviewCount = oldReviewCount + 1;
        let newRating = ((confirmedAlbum.totalRating * oldReviewCount) + req.body.starRating) / newReviewCount;
        try {
            const updatedAlbum  = await prisma.album.update({
                where: {
                    discogsId: discogsAlbumId,
                },
                data: {
                    totalRating: newRating,
                },
            });
        } 
        catch(err) {
            res.status(404).send();
            return;
        }
    }

    // Add new review
    const review = await prisma.review.create({
        data: {
            starRating: req.body.starRating,
            reviewerId: user,
            comment: req.body.comment,
            albumId: confirmedAlbum.id,
        },
    });

    res.redirect(`/albums/reviews/${confirmedAlbum.id}`);
}

const getAll = async (req, res) => {
    const allReviews = await prisma.review.findMany();
    res.send(allReviews);
}

const deleteOne = async (req, res) => {
    const reviewId = Number.parseInt(req.params.review);
    const reviewSealed = await prisma.review.findUnique({
        where: {
            id: reviewId,
        },
    });
    // can only delete 30 minutes after creation. After that, it's sealed.
    let halfHourInSeconds = 30 * 60;
    let elapsedSeconds = Date.now() - reviewSealed.createdAt.valueOf();
    if (elapsedSeconds > halfHourInSeconds) {
        res.send(200);
        return;
    }
    try {
        const review  = await prisma.review.delete({
            where: {
                id: reviewId,
            },
        });
        res.send(review);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const updateOne = async (req, res) => {
    const reviewId = Number.parseInt(req.params.review);
    const reviewSealed = await prisma.review.findUnique({
        where: {
            id: reviewId,
        },
    });
    // can only update 30 minutes after creation. After that, it's sealed.
    let halfHourInSeconds = 30 * 60;
    let elapsedSeconds = Date.now() - reviewSealed.createdAt.valueOf();
    if (elapsedSeconds > halfHourInSeconds) {
        res.send(200);
        return;
    }

    try {
        const review  = await prisma.review.update({
            where: {
                id: reviewId,
            },
            data: req.body,
        });
        res.send(review);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const getOne = async (req, res) => {
    const review = await prisma.review.findUnique({
        where: {
            id: Number.parseInt(req.params.review),
        },
        include: {
            reviewer: true,
            album: true,
        },
    });

    if (!review) {
        res.status(404).send();
        return;
    }

    res.send(review);
}

const getAddReviewPage = async (req, res) => {
    const discogsAlbumId = req.params.album;

    const mastersUrl = `https://api.discogs.com/masters/${discogsAlbumId}?token=${token}`;
    const mastersRes = await fetch(mastersUrl);
    const mastersJson = await mastersRes.json();

    const mainReleaseUrl = `https://api.discogs.com/releases/${mastersJson.main_release}?token=${token}`;
    const mainReleaseRes = await fetch(mainReleaseUrl);
    const mainReleaseJson = await mainReleaseRes.json();

    const albumObject = {
        discogsId: discogsAlbumId,
        genre: mainReleaseJson.genres[0],
        albumArtUrl: mainReleaseJson.images[0].uri,
        title: mainReleaseJson.title,
        country: mainReleaseJson.country,
        artist: mainReleaseJson.artists[0].name,
        year: `${mainReleaseJson.year}`,
    };

    return res.render('addreview', { 
        album: albumObject,
        message: null,
    });
}

export default {
    addOne,
    getAll,
    deleteOne,
    updateOne,
    getOne,
    getAddReviewPage,
}