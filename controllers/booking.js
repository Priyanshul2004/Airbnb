const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.createBooking = async (req, res) => {
    try {
        const { listingId, checkIn, checkOut, guests, specialRequests } = req.body;
        
        // Validate required fields
        if (!listingId || !checkIn || !checkOut || !guests) {
            req.flash("error", "Please fill in all required fields.");
            return res.redirect("back");
        }

        // Get the listing to calculate price
        const listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect("back");
        }

        // Calculate number of nights
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
        if (nights <= 0) {
            req.flash("error", "Check-out date must be after check-in date.");
            return res.redirect("back");
        }

        // Calculate total price
        const totalPrice = listing.price * nights * guests;

        // Create booking
        const booking = new Booking({
            user: req.user._id,
            listing: listingId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: parseInt(guests),
            totalPrice: totalPrice,
            specialRequests: specialRequests || ""
        });

        await booking.save();
        req.flash("success", "Booking created successfully!");
        res.redirect("/user/dashboard");
        
    } catch (error) {
        console.error("Booking creation error:", error);
        req.flash("error", "Failed to create booking. Please try again.");
        res.redirect("back");
    }
};

module.exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('listing')
            .sort({ bookingDate: -1 });
        
        res.render("user/bookings", { bookings });
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        req.flash("error", "Failed to load bookings.");
        res.redirect("/user/dashboard");
    }
};

module.exports.getUserBookingsAPI = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        // Build query
        let query = { user: req.user._id };
        if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('listing', 'title location country price image')
            .sort({ bookingDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalBookings = await Booking.countDocuments(query);
        const totalPages = Math.ceil(totalBookings / limit);

        // Format response
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            listing: {
                _id: booking.listing._id,
                title: booking.listing.title,
                location: booking.listing.location,
                country: booking.listing.country,
                price: booking.listing.price,
                image: booking.listing.image
            },
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            guests: booking.guests,
            totalPrice: booking.totalPrice,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            specialRequests: booking.specialRequests,
            bookingDate: booking.bookingDate
        }));

        res.json({
            success: true,
            data: {
                bookings: formattedBookings,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalBookings: totalBookings,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error("Error fetching user bookings API:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message
        });
    }
};

module.exports.getBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id)
            .populate('listing')
            .populate('user');
        
        if (!booking) {
            req.flash("error", "Booking not found.");
            return res.redirect("/user/dashboard");
        }

        // Check if user owns this booking
        if (booking.user._id.toString() !== req.user._id.toString()) {
            req.flash("error", "You don't have permission to view this booking.");
            return res.redirect("/user/dashboard");
        }

        res.render("user/booking-details", { booking });
    } catch (error) {
        console.error("Error fetching booking:", error);
        req.flash("error", "Failed to load booking details.");
        res.redirect("/user/dashboard");
    }
};

module.exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, guests, specialRequests } = req.body;
        
        const booking = await Booking.findById(id).populate('listing');
        
        if (!booking) {
            req.flash("error", "Booking not found.");
            return res.redirect("/user/dashboard");
        }

        // Check if user owns this booking
        if (booking.user.toString() !== req.user._id.toString()) {
            req.flash("error", "You don't have permission to update this booking.");
            return res.redirect("/user/dashboard");
        }

        // Update booking details
        if (checkIn) booking.checkIn = new Date(checkIn);
        if (checkOut) booking.checkOut = new Date(checkOut);
        if (guests) booking.guests = parseInt(guests);
        if (specialRequests !== undefined) booking.specialRequests = specialRequests;

        // Recalculate total price if dates or guests changed
        if (checkIn || checkOut || guests) {
            const nights = Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24));
            booking.totalPrice = booking.listing.price * nights * booking.guests;
        }

        await booking.save();
        req.flash("success", "Booking updated successfully!");
        res.redirect(`/booking/${id}`);
        
    } catch (error) {
        console.error("Booking update error:", error);
        req.flash("error", "Failed to update booking. Please try again.");
        res.redirect("back");
    }
};

module.exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        
        if (!booking) {
            req.flash("error", "Booking not found.");
            return res.redirect("/user/dashboard");
        }

        // Check if user owns this booking
        if (booking.user.toString() !== req.user._id.toString()) {
            req.flash("error", "You don't have permission to cancel this booking.");
            return res.redirect("/user/dashboard");
        }

        // Update booking status
        booking.status = 'cancelled';
        await booking.save();
        
        req.flash("success", "Booking cancelled successfully!");
        res.redirect("/user/dashboard");
        
    } catch (error) {
        console.error("Booking cancellation error:", error);
        req.flash("error", "Failed to cancel booking. Please try again.");
        res.redirect("back");
    }
};
