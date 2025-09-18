const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    userType: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'super_admin', 'moderator'],
        default: 'user',
        required: true
    },
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'username',
  usernameUnique: true
});

module.exports = mongoose.model("User", userSchema);