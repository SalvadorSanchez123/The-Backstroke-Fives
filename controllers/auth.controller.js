import { PrismaClient, Prisma } from "@prisma/client";
import users from './user.controller.js';
import passport from 'passport';

const prisma = new PrismaClient();

const getRegistrationPage = (req, res) => {
    res.render('register');
}

const registerUser = async (req, res, next) => {
    const { username, password, email, bio } = req.body;

    try {
        await prisma.user.create({
            data: {
                username,
                password,
                email,
                bio,
            },
        });

        next();
    }
    catch(err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            res.render('register', { error: { message: "Username or Email already exists" } });
            return;
        }
        else {
            throw(err);
        }
    }
}


const getLoginPage = (req, res) => {
    res.render('login', { error: req.flash('error') });
}


const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        res.redirect('/');
    }
}

const logout = (req, res) => {
    req.logout(err => {
        if (err) {
            next(err);
        }
        res.redirect('/');
    });
}

export default {
    getRegistrationPage,
    registerUser,
    getLoginPage,
    isAuthenticated,
    logout,
}