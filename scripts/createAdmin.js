const mongoose = require("mongoose");
const Admin = require("../models/admin");

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    // Create admin user
    const admin = new Admin({
      username: "admin",
      email: "admin@airbnb.com",
      role: "super_admin",
      permissions: ["manage_users", "manage_listings", "manage_reviews", "view_analytics", "manage_settings"],
      profile: {
        firstName: "Admin",
        lastName: "User"
      }
    });

    const registeredAdmin = await Admin.register(admin, "admin123");
    console.log("Admin user created successfully:", registeredAdmin);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
