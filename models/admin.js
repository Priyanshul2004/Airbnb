const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  userType: {
    type: String,
    default: 'admin',
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_listings', 'manage_reviews', 'view_analytics', 'manage_settings']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    phone: String
  }
}, {
  timestamps: true
});

adminSchema.plugin(passportLocalMongoose, {
  usernameField: 'username',
  usernameUnique: true
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
