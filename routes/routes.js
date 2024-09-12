import express from 'express';
import reviews from '../controllers/review.controller.js';
import users from '../controllers/user.controller.js';
import albums from '../controllers/album.controller.js';
import genres from '../controllers/genre.controller.js';
import auth from '../controllers/auth.controller.js';
import passport from 'passport';

const router = new express.Router();

// List the rest of albums view and links
// list reviews view and links
// view user reviews

//login setup
// add update, delete review search and form view
// add review -> search -> make review form MAKE-VIEW 
            //or links to review already made so EDIT-VIEW
// click into reviews to edit (verify user matches review and session)






//TOP FIVE ONLY
//TOP FIVE ONLY
//TOP FIVE ONLY
//TOP FIVE ONLY
//TOP FIVE ONLY

// main page routes
//      1. view main page without needing user login
//          - Menu (available through all views) to view personal profile or login
//          - Menu make review (goes to search page)
//          - Menu (ambitious) archived top lists link (not drop down in menu)
//      2. view into lists (longer than 5, updated every week)
//      3. view into single albums with list of reviews underneath 
//      4. view into a single review with username displayed
//       5. view into reviews of single user open to public
//      5. view into user and their history of reviews
//      6. (ambitious) (Archive/Search) archived top list weeks by decade,year, month
//      -  search for ablum that has been reviewed in the past 


// user routes 
// router.get()
//      7. view user login/signup (if not logged in from menu profile or review creation)
//      8. view sign up W/bio addage
//      9. view user main page with all their review history
//          - Menu still available (to create reviews)
//          - click into single review views
//      - able to delete and edit (30 mins) reviews buttons in single review view 
//          - name, bio, amount of reviews, list of all reviews
//      10. view user new review creation
//          - Search for album
//      11. view user write review of selected album


router.get('/register', auth.getRegistrationPage);
router.post('/register', auth.registerUser, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,//this message has to be setup
}));
router.get('/login', auth.getLoginPage);
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,//this message has to be setup
}));


//album routes
//user search discog (verify the current session is logged in as a user. only registered users can open this)
// router.get('/search',albums.searchAlbumToReview);
//temp route for top album
router.get('/top',albums.getTopAlbum);
//get all reviews from album
router.get('/albums/reviews/:album', albums.getAllReviews);
router.get('/', albums.getTopFiveLists);
// router.get('/', (req, res) => {
//     //render ('home', topART, topRating, topName, topArtist);
//     //render (generate the whole top five list)
//     //render (generate lists basic genres entered in )
//     res.render('home');
// });
router.get('/albums', albums.getAll);


//review routes
// router.post('/reviews/:user/:album', reviews.addOne);
router.get('/reviews', reviews.getAll);
// router.delete('/reviews/:review', reviews.deleteOne);
// router.put('/reviews/:review', reviews.updateOne);
router.get('/reviews/:review', reviews.getOne);

//User routes
router.post('/users', users.addOne);
//search for users?
router.get('/users', users.getAll);
router.delete('/users/:user', users.deleteOne);
router.put('/users/:user', users.updateOne);
router.get('/users/:user', users.getOneById);
// router.get('/users/username/:username', users.getOneByUsername);

//Genre routes
router.post('/genres', genres.addOne);
router.get('/genres', genres.getAll);
router.delete('/genres/:genre', genres.deleteOne);
router.put('/genres/:genre', genres.updateOne);
router.get('/genres/:genre', genres.getOne);
router.get('/toplistbygenre/:genre', genres.getTopListByGenre);
router.get('/toplist', genres.getTopList);



// user authenticated routes
router.use(auth.isAuthenticated);
router.get('/search',albums.getSearchPage);
router.get('/search/results', albums.searchAlbumToReview)
router.get('/users/reviews/:user', users.getUserWithReviews);
router.get('/reviews/getadd/:album', reviews.getAddReviewPage);
router.post('/reviews/add/:album', reviews.addOne);
router.get('/logout', auth.logout);
//edit review
//make review
router.delete('/reviews/:review', reviews.deleteOne);
router.put('/reviews/:review', reviews.updateOne);



//Export our router
export default router;