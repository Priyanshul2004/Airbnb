const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const bookingController = require("../controllers/booking.js");
const { isLoggedIn } = require("../middleware.js");

// Booking Routes
router.post("/", isLoggedIn, wrapAsync(bookingController.createBooking));
router.get("/api/user", isLoggedIn, wrapAsync(bookingController.getUserBookingsAPI));
router.get("/user", isLoggedIn, wrapAsync(bookingController.getUserBookings));
router.get("/:id", isLoggedIn, wrapAsync(bookingController.getBooking));
router.put("/:id", isLoggedIn, wrapAsync(bookingController.updateBooking));
router.delete("/:id", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
