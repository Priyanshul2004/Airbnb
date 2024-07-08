const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true, // Ensure every review has a comment
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true, // Ensure every review has a rating
    },
    createdAt: {
        type: Date,
        default: Date.now, // Pass the function instead of calling it
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

module.exports = mongoose.model("Review", reviewSchema);
