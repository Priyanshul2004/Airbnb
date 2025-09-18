const Admin = require("../models/admin");
const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");

// Admin Dashboard
module.exports.dashboard = async (req, res) => {
  try {
    // Get statistics
    const totalListings = await Listing.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    
    // Calculate total revenue (assuming 10% commission)
    const listings = await Listing.find({});
    const totalRevenue = listings.reduce((sum, listing) => sum + (listing.price * 0.1), 0);

    // Get recent listings
    const recentListings = await Listing.find({})
      .populate('owner')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent users
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    res.render("admin/dashboard", {
      totalListings,
      totalUsers,
      totalReviews,
      totalRevenue: Math.round(totalRevenue),
      recentListings,
      recentUsers,
      page: 'admin-dashboard'
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/login");
  }
};

// Admin Login - Redirect to unified login
module.exports.renderLoginForm = (req, res) => {
  console.log('🔄 Redirecting admin login to unified login page');
  res.redirect("/login");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back, Admin!");
  const redirectUrl = req.session.returnTo || "/admin/dashboard";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

// Admin Login API
module.exports.loginAPI = async (req, res) => {
  // Debugger for admin login flow
  debugger;
  
  console.log('=== ADMIN LOGIN API START ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  console.log('Session ID:', req.sessionID);
  console.log('Current user:', req.user);
  
  try {
    const { email, role, password } = req.body;
    
    console.log('Extracted form data:', { 
      email,
      role,
      password: password ? '[HIDDEN]' : 'undefined'
    });

    if (!email || !password || !role) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: "Email, role, and password are required"
      });
    }

    console.log('Looking up admin with email:', email);
    // Find admin by email
    const admin = await Admin.findOne({ email: email });
    
    if (!admin) {
      console.log('Admin not found for email:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log('Admin found:', {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      userType: admin.userType,
      role: admin.role,
      isActive: admin.isActive
    });

    // Check if the provided role matches the admin's role
    if (admin.role !== role) {
      console.log('Role mismatch. Expected:', admin.role, 'Got:', role);
      return res.status(401).json({
        success: false,
        message: "Invalid role for this admin account"
      });
    }

    // Check password using passport-local-mongoose method
    console.log('Authenticating password...');
    const isPasswordValid = await admin.authenticate(password);
    
    if (!isPasswordValid) {
      console.log('Password authentication failed');
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log('Password authentication successful');

    // Update last login timestamp
    admin.lastLogin = new Date();
    await admin.save();
    console.log('Last login timestamp updated');

    // Login the admin (create session)
    console.log('Attempting to create session...');
    req.login(admin, (err) => {
      if (err) {
        console.error('Session creation failed:', err);
        return res.status(500).json({
          success: false,
          message: "Login failed"
        });
      }

      console.log('Session created successfully');
      console.log('Session after login:', req.session);
      console.log('User after login:', req.user);

      const responseData = {
        success: true,
        message: "Login successful",
        user: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
          userType: admin.userType,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin
        }
      };

      console.log('Sending successful response:', responseData);
      console.log('=== ADMIN LOGIN API END ===');
      res.json(responseData);
    });

  } catch (error) {
    console.error("Admin login API error:", error);
    console.log('=== ADMIN LOGIN API ERROR ===');
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Admin Logout
module.exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have been logged out successfully!");
    res.redirect("/admin/login");
  });
};

// Listings Management
module.exports.listings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const listings = await Listing.find({})
      .populate('owner')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalListings = await Listing.countDocuments();
    const totalPages = Math.ceil(totalListings / limit);

    res.render("admin/listings", {
      listings,
      currentPage: page,
      totalPages,
      totalListings,
      page: 'admin-listings'
    });
  } catch (error) {
    console.error("Listings error:", error);
    req.flash("error", "Error loading listings");
    res.redirect("/admin/dashboard");
  }
};

// API endpoint to fetch all listings
module.exports.listingsAPI = async (req, res) => {
  try {
    console.log('🔍 === FETCHING ALL LISTINGS API ===');
    
    const listings = await Listing.find({})
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${listings.length} listings`);
    
    // Debug: Log first listing to check structure
    if (listings.length > 0) {
      console.log('📋 Sample listing structure:', {
        id: listings[0]._id,
        title: listings[0].title,
        createdAt: listings[0].createdAt,
        hasCreatedAt: !!listings[0].createdAt
      });
    }

    res.json({
      success: true,
      data: listings,
      count: listings.length
    });
  } catch (error) {
    console.error('❌ Listings API error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listings',
      error: error.message
    });
  }
};

module.exports.showListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate('owner')
      .populate({
        path: 'reviews',
        populate: {
          path: 'author'
        }
      });

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/admin/listings");
    }

    res.render("admin/listing-detail", { listing, page: 'admin-listing-detail' });
  } catch (error) {
    console.error("Show listing error:", error);
    req.flash("error", "Error loading listing");
    res.redirect("/admin/listings");
  }
};

module.exports.editListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/admin/listings");
    }

    res.render("admin/edit-listing", { listing, page: 'admin-edit-listing' });
  } catch (error) {
    console.error("Edit listing error:", error);
    req.flash("error", "Error loading listing");
    res.redirect("/admin/listings");
  }
};

module.exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, req.body.listing, { new: true });

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/admin/listings");
    }

    req.flash("success", "Listing updated successfully");
    res.redirect(`/admin/listings/${id}`);
  } catch (error) {
    console.error("Update listing error:", error);
    req.flash("error", "Error updating listing");
    res.redirect("/admin/listings");
  }
};

module.exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing deleted successfully");
    res.redirect("/admin/listings");
  } catch (error) {
    console.error("Delete listing error:", error);
    req.flash("error", "Error deleting listing");
    res.redirect("/admin/listings");
  }
};

// Users Management
module.exports.users = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Filter to show only users with 'user' role
    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/users", {
      users,
      currentPage: page,
      totalPages,
      totalUsers,
      page: 'admin-users'
    });
  } catch (error) {
    console.error("Users error:", error);
    req.flash("error", "Error loading users");
    res.redirect("/admin/dashboard");
  }
};

// API endpoint to fetch all users with user role
module.exports.usersAPI = async (req, res) => {
  try {
    console.log('🔍 === FETCHING ALL USERS API ===');
    
    // Fetch all users with role 'user' (regular users, not admins)
    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${users.length} users with 'user' role`);
    
    // Debug: Log first user to check structure
    if (users.length > 0) {
      console.log('📋 Sample user structure:', {
        id: users[0]._id,
        username: users[0].username,
        email: users[0].email,
        userType: users[0].userType,
        role: users[0].role,
        createdAt: users[0].createdAt,
        hasCreatedAt: !!users[0].createdAt
      });
    }

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Users API error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

module.exports.showUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/users");
    }

    // Get user's listings
    const userListings = await Listing.find({ owner: id });
    
    // Get user's reviews
    const userReviews = await Review.find({ author: id }).populate('listing');

    res.render("admin/user-detail", {
      user,
      userListings,
      userReviews,
      page: 'admin-user-detail'
    });
  } catch (error) {
    console.error("Show user error:", error);
    req.flash("error", "Error loading user");
    res.redirect("/admin/users");
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Delete user's listings first
    await Listing.deleteMany({ owner: id });
    
    // Delete user's reviews
    await Review.deleteMany({ author: id });
    
    // Delete the user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message
    });
  }
};

// Admin Profile
module.exports.profile = async (req, res) => {
  try {
    console.log('🔍 === ADMIN PROFILE CONTROLLER ===');
    console.log('👤 Current user:', {
      id: req.user._id,
      email: req.user.email,
      userType: req.user.userType,
      role: req.user.role
    });
    
    const admin = req.user;
    
    // Get admin statistics
    const totalListings = await Listing.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    
    // Get recent activity
    const recentListings = await Listing.find({})
      .populate('owner')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    res.render("admin/profile", {
      admin,
      totalListings,
      totalUsers,
      totalReviews,
      recentListings,
      recentUsers,
      page: 'admin-profile'
    });
  } catch (error) {
    console.error("Profile error:", error);
    req.flash("error", "Error loading profile");
    res.redirect("/admin/dashboard");
  }
};

// API endpoint to fetch admin profile data
module.exports.profileAPI = async (req, res) => {
  try {
    console.log('🔍 === FETCHING ADMIN PROFILE API ===');
    console.log('👤 Current admin user:', {
      id: req.user._id,
      email: req.user.email,
      userType: req.user.userType,
      role: req.user.role
    });
    
    const admin = req.user;
    
    // Get platform statistics
    const totalListings = await Listing.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' }); // Only regular users
    const totalReviews = await Review.countDocuments();
    
    // Calculate total revenue (assuming 10% commission)
    const listings = await Listing.find({});
    const totalRevenue = listings.reduce((sum, listing) => sum + (listing.price * 0.1), 0);
    
    // Get recent activity
    const recentListings = await Listing.find({})
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5);

    const profileData = {
      // Admin basic info
      id: admin._id,
      username: admin.username,
      email: admin.email,
      userType: admin.userType,
      role: admin.role,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      
      // Personal information from signup
      firstName: admin.firstName,
      lastName: admin.lastName,
      phone: admin.phone, // This field might not exist yet, but we'll include it
      
      // Platform statistics
      stats: {
        totalListings,
        totalUsers,
        totalReviews,
        totalRevenue: Math.round(totalRevenue)
      },
      
      // Recent activity
      recentActivity: {
        listings: recentListings,
        users: recentUsers
      }
    };

    console.log('✅ Admin profile data prepared:', {
      admin: profileData.username,
      role: profileData.role,
      stats: profileData.stats
    });

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('❌ Admin profile API error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin profile',
      error: error.message
    });
  }
};

// Reviews Management
module.exports.reviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({})
      .populate('author')
      .populate('listing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments();
    const totalPages = Math.ceil(totalReviews / limit);

    res.render("admin/reviews", {
      reviews,
      currentPage: page,
      totalPages,
      totalReviews,
      page: 'admin-reviews'
    });
  } catch (error) {
    console.error("Reviews error:", error);
    req.flash("error", "Error loading reviews");
    res.redirect("/admin/dashboard");
  }
};

module.exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);

    req.flash("success", "Review deleted successfully");
    res.redirect("/admin/reviews");
  } catch (error) {
    console.error("Delete review error:", error);
    req.flash("error", "Error deleting review");
    res.redirect("/admin/reviews");
  }
};

// Analytics
module.exports.analytics = async (req, res) => {
  try {
    // Get analytics data
    const totalListings = await Listing.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Get listings by month (last 12 months)
    const listingsByMonth = await Listing.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    // Get users by month (last 12 months)
    const usersByMonth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    // Get top locations
    const topLocations = await Listing.aggregate([
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.render("admin/analytics", {
      totalListings,
      totalUsers,
      totalReviews,
      listingsByMonth,
      usersByMonth,
      topLocations,
      page: 'admin-analytics'
    });
  } catch (error) {
    console.error("Analytics error:", error);
    req.flash("error", "Error loading analytics");
    res.redirect("/admin/dashboard");
  }
};
