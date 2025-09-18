const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const Booking = require("../models/booking");

// User Dashboard
module.exports.dashboard = async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's bookings
    const userBookings = await Booking.find({ user: user._id })
      .populate('listing')
      .sort({ bookingDate: -1 })
      .limit(5);
    const totalUserBookings = await Booking.countDocuments({ user: user._id });

    // Get user's reviews
    const userReviews = await Review.find({ author: user._id }).populate('listing');
    const totalUserReviews = userReviews.length;

    // Calculate total spent on bookings
    const allUserBookings = await Booking.find({ user: user._id });
    const totalSpent = allUserBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    // Get recent activity based on bookings
    const recentActivity = userBookings.slice(0, 3).map(booking => ({
      icon: 'calendar-check',
      message: `Booked ${booking.listing.title}`,
      time: booking.bookingDate.toLocaleDateString()
    }));

    // Get available listings for booking
    const availableListings = await Listing.find({}).limit(6).sort({ createdAt: -1 });

    res.render("user/dashboard", {
      user,
      userBookings: totalUserBookings,
      userBookingsData: userBookings,
      userReviews: totalUserReviews,
      totalSpent: Math.round(totalSpent),
      recentActivity,
      availableListings
    });
  } catch (error) {
    console.error("User dashboard error:", error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/listings");
  }
};

// User Profile
module.exports.profile = async (req, res) => {
  try {
    console.log('🔍 === USER PROFILE CONTROLLER CALLED ===');
    console.log('👤 Current user:', {
      id: req.user._id,
      email: req.user.email,
      userType: req.user.userType,
      role: req.user.role
    });
    console.log('🌐 Request URL:', req.originalUrl);
    console.log('🌐 Request path:', req.path);
    
    const user = req.user;
    
    // Get user's booking statistics
    const userBookings = await Booking.countDocuments({ user: user._id });
    const allUserBookings = await Booking.find({ user: user._id });
    const totalSpent = allUserBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    // Get user's reviews count
    const userReviews = await Review.countDocuments({ author: user._id });
    
    // Placeholder for favorites (you can implement this later)
    const userFavorites = 0;
    
    res.render("user/profile", { 
      user, 
      userBookings, 
      totalSpent: Math.round(totalSpent),
      userReviews,
      userFavorites
    });
  } catch (error) {
    console.error("User profile error:", error);
    req.flash("error", "Error loading profile");
    res.redirect("/user/dashboard");
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, req.body.user, { new: true });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/user/profile");
    }

    req.flash("success", "Profile updated successfully");
    res.redirect("/user/profile");
  } catch (error) {
    console.error("Update profile error:", error);
    req.flash("error", "Error updating profile");
    res.redirect("/user/profile");
  }
};

module.exports.updatePersonalInfo = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and email are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email, 
      _id: { $ne: userId } 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email address is already in use"
      });
    }

    // Update user information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim()
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Personal information updated successfully",
      data: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email
      }
    });

  } catch (error) {
    console.error("Update personal info error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating personal information",
      error: error.message
    });
  }
};

// User Listings
module.exports.userListings = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const listings = await Listing.find({ owner: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalListings = await Listing.countDocuments({ owner: user._id });
    const totalPages = Math.ceil(totalListings / limit);

    res.render("user/listings", {
      listings,
      currentPage: page,
      totalPages,
      totalListings
    });
  } catch (error) {
    console.error("User listings error:", error);
    req.flash("error", "Error loading listings");
    res.redirect("/user/dashboard");
  }
};

// User Bookings
module.exports.userBookings = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ user: user._id })
      .populate('listing')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalBookings = await Booking.countDocuments({ user: user._id });
    const totalPages = Math.ceil(totalBookings / limit);

    res.render("user/bookings", {
      user,
      bookings,
      currentPage: page,
      totalPages,
      totalBookings
    });
  } catch (error) {
    console.error("User bookings error:", error);
    req.flash("error", "Error loading bookings");
    res.redirect("/user/dashboard");
  }
};

// User Reviews
module.exports.userReviews = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ author: user._id })
      .populate('listing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({ author: user._id });
    const totalPages = Math.ceil(totalReviews / limit);

    res.render("user/reviews", {
      reviews,
      currentPage: page,
      totalPages,
      totalReviews
    });
  } catch (error) {
    console.error("User reviews error:", error);
    req.flash("error", "Error loading reviews");
    res.redirect("/user/dashboard");
  }
};

// User Favorites
module.exports.userFavorites = async (req, res) => {
  try {
    const user = req.user;
    // Placeholder for favorites - you'll need to implement a favorites model
    const favorites = [];
    const totalFavorites = 0;

    res.render("user/favorites", {
      favorites,
      totalFavorites
    });
  } catch (error) {
    console.error("User favorites error:", error);
    req.flash("error", "Error loading favorites");
    res.redirect("/user/dashboard");
  }
};

// User Settings
module.exports.settings = async (req, res) => {
  try {
    const user = req.user;
    res.render("user/settings", { user });
  } catch (error) {
    console.error("User settings error:", error);
    req.flash("error", "Error loading settings");
    res.redirect("/user/dashboard");
  }
};

module.exports.updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, req.body.user, { new: true });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/user/settings");
    }

    req.flash("success", "Settings updated successfully");
    res.redirect("/user/settings");
  } catch (error) {
    console.error("Update settings error:", error);
    req.flash("error", "Error updating settings");
    res.redirect("/user/settings");
  }
};
