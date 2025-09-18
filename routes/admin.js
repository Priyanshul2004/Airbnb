const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const adminController = require("../controllers/admin.js");
const { isAdminLoggedIn, isAdmin } = require("../middleware.js");

// Admin Authentication Routes
router.get("/login", adminController.renderLoginForm);
router.post("/login", 
  passport.authenticate("admin-local", {
    failureRedirect: "/admin/login",
    failureFlash: true,
  }),
  adminController.login
);

// Admin Login API
router.post("/api/login", adminController.loginAPI);

// Admin Listings API
router.get("/api/listings", isAdminLoggedIn, wrapAsync(adminController.listingsAPI));

// Admin Users API
router.get("/api/users", isAdminLoggedIn, wrapAsync(adminController.usersAPI));

// Admin Profile API
router.get("/api/profile", isAdminLoggedIn, wrapAsync(adminController.profileAPI));

router.get("/logout", adminController.logout);

// Admin Dashboard
router.get("/dashboard", isAdminLoggedIn, wrapAsync(adminController.dashboard));

// Listings Management
router.get("/listings", isAdminLoggedIn, wrapAsync(adminController.listings));
router.get("/listings/:id", isAdminLoggedIn, wrapAsync(adminController.showListing));
router.get("/listings/:id/edit", isAdminLoggedIn, wrapAsync(adminController.editListing));
router.put("/listings/:id", isAdminLoggedIn, wrapAsync(adminController.updateListing));
router.delete("/listings/:id", isAdminLoggedIn, wrapAsync(adminController.deleteListing));

// Users Management
router.get("/users", isAdminLoggedIn, wrapAsync(adminController.users));
router.get("/users/:id", isAdminLoggedIn, wrapAsync(adminController.showUser));
router.delete("/users/:id", isAdminLoggedIn, wrapAsync(adminController.deleteUser));

// Admin Profile
router.get("/profile", isAdminLoggedIn, wrapAsync(adminController.profile));

module.exports = router;
