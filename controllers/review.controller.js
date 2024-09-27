import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const token = process.env.DISCOGS_TOKEN;


//router.post('/reviews/:user/:album', reviews.addOne);
const addOne = async (req, res) => {
    const user = Number.parseInt(req.user.id);
    // const user = Number.parseInt(req.params.user);
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
            return res.redirect(`/reviews/view/${reviewExists.id}`);
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
        }
        else {
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
    }
    else {
        confirmedAlbum = album;
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

    await setTotalRating(confirmedAlbum.id);
    res.redirect(`/albums/reviews/${confirmedAlbum.id}`);
}

const getAll = async (req, res) => {
    const allReviews = await prisma.review.findMany();
    res.send(allReviews);
}

const deleteOne = async (req, res) => {
    // can only delete 30 minutes after creation. After that, it's sealed.
    try {
        const reviewDeleted = await prisma.review.delete({
            where: {
                id: Number.parseInt(req.params.review),
            },
            include: {
                album: true,
            },
        });
        await setTotalRating(reviewDeleted.album.id);
        res.redirect(`/albums/reviews/${reviewDeleted.album.id}`);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const updateOne = async (req, res) => {
    // can only update 30 minutes after creation. After that, it's sealed.
    try {
        const newReview  = await prisma.review.update({
            where: {
                id: Number.parseInt(req.params.review),
            },
            include: {
                album: true,
            },
            data: {
                starRating: req.body.starRating,
                comment: req.body.comment,
            },
        });
        await setTotalRating(newReview.album.id);
        res.redirect(`/reviews/view/${newReview.id}`);
    } 
    catch(err) {
        console.log(err);
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
    const discogsAlbumId = Number.parseInt(req.params.album);
    const user = Number.parseInt(req.user.id);
    // const user = Number.parseInt(req.params.user);

    const album = await prisma.album.findUnique({
        where: {
            discogsId: discogsAlbumId,
        },
        include: {
            reviews: true,
        },
    });
    if(album) {
        const reviewExists = await prisma.review.findFirst({
            where: {
                albumId: album.id,
                reviewerId: user,
            },
        });
        if (reviewExists) {
            return res.redirect(`/reviews/view/${reviewExists.id}`);
        }
    }

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

    return res.render('addreview', { album: albumObject, review: null });
}

const getUpdatePage = async (req, res) => {
    const review = await prisma.review.findUnique({
        where: {
            id: Number.parseInt(req.params.review),
        },
        include: {
            reviewer: true,
            album: true,
        },
    });
    return res.render('addreview', { album: review.album, review: review });
}


const getReviewEdit = async (req, res) => {
    let review = await prisma.review.findUnique({
        where: {
            id: Number.parseInt(req.params.review),
        },
        include: {
            reviewer: true,
            album: true,
        },
    });

    //Can only update within 30 minutes of being created
    let halfHourInMilliseconds = 30 * 60 * 1000;
    let elapsedMilliseconds = Date.now().valueOf() - review.createdAt.valueOf();
    let canUpdate = elapsedMilliseconds < halfHourInMilliseconds ? true : false;
    //Ensure that the user updating this review is the user that is logged in
    if (req?.user) {
        canUpdate = review.reviewer.id === req.user.id ? canUpdate : false;
    }
    else {
        canUpdate = false;
    }
    const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(review.createdAt);
    const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(review.createdAt);
    const day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(review.createdAt);
  
    review.createdAt = `${day}-${month}-${year}`;
    review.album.totalRating = Number.parseFloat(Math.trunc(review.album.totalRating * 10)) / 10;
    return res.render('reviewedit', { review: review, canUpdate: canUpdate });
}

const setTotalRating = async (albumId) => {
    const album = await prisma.album.findUnique({
        where: {
            id: Number.parseInt(albumId),
        },
        include: {
            reviews: true,
        },
    });

    let newTotalRating = 0;
    if (album.reviews.length > 0) {
        let count = album.reviews.length;
        let sum = 0;
        album.reviews.forEach( (review) => {
            sum += Number.parseFloat(review.starRating);
        });
        newTotalRating = sum / count;
    }
    
    try{
        const newAlbumRating = await prisma.album.update({
            where: {
                id: album.id,
            },
            data: {
                totalRating: newTotalRating,
            },
        });
    }
    catch(err) {
        res.status(404).send();
        return;
    }
}

export default {
    addOne,
    getAll,
    deleteOne,
    updateOne,
    getOne,
    getAddReviewPage,
    getReviewEdit,
    getUpdatePage,
    setTotalRating,
}