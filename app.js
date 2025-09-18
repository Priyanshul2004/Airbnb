if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Admin = require("./models/admin.js");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const adminRouter = require("./routes/admin.js");
const bookingRouter = require("./routes/booking.js");


const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: false, // Changed to false for Passport.js compatibility
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false, // Set to false for development
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// Unified Authentication Strategy
passport.use('unified-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    console.log('🔍 === UNIFIED AUTHENTICATION START ===');
    console.log('📋 Auth data:', { email, role: req.body.role, password: password ? '[HIDDEN]' : 'undefined' });
    
    // Find user by email
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return done(null, false, { message: 'Invalid email or password' });
    }
    
    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      username: user.username,
      userType: user.userType,
      role: user.role,
      isActive: user.isActive
    });
    
    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account is inactive');
      return done(null, false, { message: 'Account is inactive' });
    }
    
    // Check role if provided
    if (req.body.role && user.role !== req.body.role) {
      console.log('❌ Role mismatch. Expected:', user.role, 'Got:', req.body.role);
      return done(null, false, { message: 'Invalid role for this account' });
    }
    
    // Authenticate password
    const isPasswordValid = await user.authenticate(password);
    
    if (!isPasswordValid) {
      console.log('❌ Password authentication failed');
      return done(null, false, { message: 'Invalid email or password' });
    }
    
    console.log('✅ Authentication successful');
    console.log('🔄 User will be serialized and logged in');
    return done(null, user);
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return done(error);
  }
}));

// Legacy User Authentication (for backward compatibility)
passport.use('local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, User.authenticate()));

// Legacy Admin Authentication (for backward compatibility)
passport.use('admin-local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, Admin.authenticate()));

// Serialization - unified for all users
passport.serializeUser((user, done) => {
  console.log('🔄 Serializing user:', { id: user._id, userType: user.userType, role: user.role });
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('🔄 Deserializing user with ID:', id);
    const user = await User.findById(id);
    console.log('👤 Deserialized user:', user ? { id: user._id, email: user.email, userType: user.userType, role: user.role } : 'User not found');
    done(null, user);
  } catch (error) {
    console.error('❌ Deserialization error:', error);
    done(error, null);
  }
});

app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.get("/", async (req, res) => {
  try {
    const Listing = require("./models/listing");
    const allListings = await Listing.find({}).limit(6);
    res.render("home", { allListings, page: 'home' });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.render("home", { allListings: [], page: 'home' });
  }
});

//app.get("/demouser", async (req,res)=>{
 // let fakeUser = new User({
//    email: "student@gmail.com",
//    username: "delta-student",
//  });
//  let registeredUser = await User.register(fakeUser, "helloworld");
//  res.send(registeredUser);
//});



app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/booking", bookingRouter);
app.use("/", userRouter);
app.use("/admin", adminRouter);

// Footer routes
const footerRouter = require("./routes/footer");
app.use("/", footerRouter);


// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

app.all("*",(req, res, next)=>{
  next(new ExpressError(404, "page not found!"));
});

app.use((err, req, res, next)=>{
  let {statusCode=500, message="something went wrong"} = err;
  res.status(statusCode).render("error.ejs", { message });
  //res.status(statusCode).send(message);
});



app.listen(8080, () => {
  console.log("server is listening to port 8080");
});