const mongoose = require("mongoose");

const ccaReviewSchema = new mongoose.Schema({
  userId: {
    type: String, //  using userId like "S006"
    required: true
  },

  name: {
    type: String,
    required: true
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CCA",
    required: true
  },

  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  comment: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});


// this is to prevent duplicate reviews
ccaReviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });


module.exports = mongoose.model("CCAReview", ccaReviewSchema);