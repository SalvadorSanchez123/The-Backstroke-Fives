import { Strategy } from "passport-local";
import { PrismaClient } from "@prisma/client";
import passport from "passport";

const prisma = new PrismaClient();

const strategy = new Strategy(
    async (username, password, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { username } });
            if (!user) {
                return done(null, false, { message: 'Incorrect username' });
            }

            if (user.password !== password) {
                return done(null, false, { message: 'Incorrect password' });
            }

            return done(null, user);//null - no error, user - sets req.user on every logged in session
        } 
        catch (err) {
            return done(err);
        }
    }
);

export default function(passport) {
    passport.use(strategy);

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser( async (id, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            done(null, user);
        }
        catch(err) {
            done(err);
        }
    });
}