import express from 'express';
import routes from './routes/routes.js';
import { create, engine } from 'express-handlebars';
import session from 'express-session';
import passport from 'passport';
import passportConfig from './config/passport.js';
import flash from 'connect-flash';

const app = express();

app.use(flash());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));

//passport setup
app.use(passport.initialize());
app.use(passport.session());

//passport configuration
passportConfig(passport);

//handlebars setup
app.engine('handlebars', engine({ defaultLayout: "main" }));
app.set('view engine', 'handlebars');
app.set('views', './views');
create({}).handlebars.registerHelper('increment', (index) => index + 1);
create({}).handlebars.registerHelper('isNotLast', (index, arr) => {
    if ((index + 1) == arr.length) {
        return false;
    }
    else {
        return true;
    }
});


app.use('/css', express.static('./node_modules/bootstrap/dist/css'));
app.use('/js', express.static('./node_modules/bootstrap/dist/js'));
app.use('/frontend-js', express.static('./frontend-js'));


//Adds req.body to any request with a JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//middleware to make every template have {{user}} available if authenticated
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

//attach app to router
app.use(routes);


//listen to requests
app.listen(3000, () => {
    console.log('Now listening on port 3000');
});