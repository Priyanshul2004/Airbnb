const Listing  = require("./models/listing");
const Review  = require("./models/review");
const Admin = require("./models/admin");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");


module.exports.isLoggedIn = (req, res, next)=>{
    if (!req.isAuthenticated()){
      req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in to create listing!");
        return res.redirect("/login");
      }
      next();
};

module.exports.saveRedirectUrl = (req, res, next)=>{
  if(req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next)=>{
  let { id } = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner.equals(res.locals.currUser._id)) {
      req.flash("error", "you are not the owner of this listing");
     return res.redirect(`/listings/${id}`);
    }

    next();
};

module.exports.validateListing = (req, res, next) => {
  let {error} = listingSchema.validate(req.body);
  if(error) {
    let errMsg = error.details.map((el)=> el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }

};

module.exports.validateReview = (req, res, next) => {
  let {error} = reviewSchema.validate(req.body);
  if(error) {
    let errMsg = error.details.map((el)=> el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }

};

module.exports.isReviewAuthor = async (req, res, next)=>{
  let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currUser._id)) {
      req.flash("error", "you are not the author of this review");
     return res.redirect(`/listings/${id}`);
    }

    next();
};

// Admin Authentication Middleware
module.exports.isAdminLoggedIn = (req, res, next) => {
  console.log('🔍 === ADMIN MIDDLEWARE CHECK ===');
  console.log('👤 User authenticated:', req.isAuthenticated());
  console.log('👤 User data:', req.user ? {
    id: req.user._id,
    email: req.user.email,
    userType: req.user.userType,
    role: req.user.role
  } : 'No user');
  
  if (!req.isAuthenticated()) {
    console.log('❌ User not authenticated, redirecting to login');
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in as admin to access this page!");
    return res.redirect("/login");
  }
  
  // Check if the authenticated user is an admin
  if (!req.user || req.user.userType !== 'admin') {
    console.log('❌ User is not admin, redirecting to login');
    req.flash("error", "You don't have admin privileges!");
    return res.redirect("/login");
  }
  
  console.log('✅ Admin middleware passed');
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== 'admin') {
    req.flash("error", "You don't have admin privileges!");
    return res.redirect("/login");
  }
  next();
};

// Prevent admins from accessing user-specific pages
module.exports.isNotAdmin = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
    console.log('🚫 Admin trying to access user page, redirecting to admin dashboard');
    req.flash("info", "Admins should use the admin panel for management tasks.");
    return res.redirect("/admin/dashboard");
  }
  next();
};
