const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const userController = require("../controllers/user.js");
const usersController = require("../controllers/users.js");
const { isLoggedIn, saveRedirectUrl, isNotAdmin } = require("../middleware.js");

// Authentication Routes
router.get("/signup", usersController.renderSignupForm);
router.post("/signup", wrapAsync(usersController.signup));

router.get("/login", usersController.renderLoginForm);
router.post("/login", 
  saveRedirectUrl,
  passport.authenticate("unified-local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  usersController.login
);

router.get("/logout", usersController.logout);

// Homepage redirect with logout
router.get("/homepage-logout", usersController.homepageLogout);

// User Dashboard Routes
router.get("/user/dashboard", isLoggedIn, isNotAdmin, wrapAsync(userController.dashboard));

// User Profile Routes
router.get("/user/profile", isLoggedIn, isNotAdmin, wrapAsync(userController.profile));
router.put("/user/profile/:id", isLoggedIn, isNotAdmin, wrapAsync(userController.updateProfile));
router.put("/user/profile/personal", isLoggedIn, isNotAdmin, wrapAsync(userController.updatePersonalInfo));

// User Listings Routes
router.get("/user/listings", isLoggedIn, isNotAdmin, wrapAsync(userController.userListings));

// User Bookings Routes
router.get("/user/bookings", isLoggedIn, isNotAdmin, wrapAsync(userController.userBookings));

// User Reviews Routes (removed)
// router.get("/reviews", isLoggedIn, wrapAsync(userController.userReviews));

// User Favorites Routes (removed)
// router.get("/favorites", isLoggedIn, wrapAsync(userController.userFavorites));

// User Settings Routes
router.get("/user/settings", isLoggedIn, isNotAdmin, wrapAsync(userController.settings));
router.put("/user/settings/:id", isLoggedIn, isNotAdmin, wrapAsync(userController.updateSettings));

module.exports = router;