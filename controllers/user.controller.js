import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const addOne = async (req, res) => {
    const user = await prisma.user.create({
        data: req.body
    });

    res.send(user);
}

const getAll = async (req, res) => {
    const allUsers = await prisma.user.findMany({
        include: {
            reviews: true,
        },
    });
    res.send(allUsers);
}

const deleteOne = async (req, res) => {
    try {
        const user  = await prisma.user.delete({
            where: {
                id: Number.parseInt(req.params.user),
            },
        });
        res.send(user);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const updateOne = async (req, res) => {
    try {
        const user  = await prisma.user.update({
            where: {
                id: Number.parseInt(req.params.user),
            },
            data: req.body,
        });
        res.send(user);
    } 
    catch(err) {
        res.status(404).send();
        return;
    }
}

const getOneById = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            id: Number.parseInt(req.params.user),
        },
        include: {
            reviews: true,
        },
    });

    if (!user) {
        res.status(404).send();
        return;
    }

    res.send(user);
}

const getOneByUsername = async (username) => {
    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
        include: {
            reviews: true,
        },
    });

    // if (!user) {
    //     // res.status(404).send();
    //     return null;
    // }

    return user;
}


//get all reviews from user
const getUserWithReviews = async (req, res) => {
    let userId = Number.parseInt(req.params.user);

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            reviews: true,
        },
    });

    const reviewAlbums = await Promise.all(user.reviews.map(async (review) => {
        const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(review.createdAt);
        const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(review.createdAt);
        const day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(review.createdAt);

        const album = await prisma.album.findUnique({
            where: {
                id: review.albumId,
            },
        });

        return {
            review: {
                starRating: review.starRating,
                comment: review.comment,
                createdAt: `${day}-${month}-${year}`,
            },
            album: album,
        };
    }));

    const userObject = {
        username: user.username,
        bio: user.bio,
        numberOfReviews: user.reviews.length,
        reviewAlbums: reviewAlbums,
    };

    res.render('userpage', { user: userObject });
    // has all info for single user and all its reviews for viewing in single user view
}

export default {
    addOne,
    getAll,
    deleteOne,
    updateOne,
    getOneById,
    getOneByUsername,
    getUserWithReviews,
}