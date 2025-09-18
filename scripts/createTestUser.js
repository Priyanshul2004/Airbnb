const mongoose = require("mongoose");
const User = require("../models/user");

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function createTestUser() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    // Create test user
    const testUser = new User({
      email: "admin@airbnb.com",
      username: "admin",
      userType: "admin",
      role: "super_admin",
      firstName: "Admin",
      lastName: "User",
      isActive: true
    });

    const registeredUser = await User.register(testUser, "admin123");
    console.log("Test user created successfully:", {
      id: registeredUser._id,
      email: registeredUser.email,
      username: registeredUser.username,
      userType: registeredUser.userType,
      role: registeredUser.role
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  }
}

createTestUser();
