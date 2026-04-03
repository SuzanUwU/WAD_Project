const mongoose = require("mongoose");

const ccaReviewSchema = new mongoose.Schema({
  userId: { type: String },

  name: { type: String },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CCA"
  },

  rating: { type: Number },

  comment: { type: String },

  createdAt: { type: Date, default: Date.now }
});

// prevent duplicate reviews
ccaReviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const CCAReview = mongoose.model("CCAReview", ccaReviewSchema);


// ================= FUNCTIONS =================

// CREATE
exports.createReview = function(data) {
  return CCAReview.create(data);
};

// GET REVIEWS BY EVENT
exports.getReviewsByEvent = function(eventId) {
  return CCAReview.find({ eventId }).sort({ createdAt: -1 });
};

// GET REVIEW BY ID
exports.findById = function(id) {
  return CCAReview.findById(id);
};

// UPDATE REVIEW
exports.updateReview = function(id, data) {
  return CCAReview.updateOne({ _id: id }, data);
};

// DELETE REVIEW
exports.deleteReview = function(id) {
  return CCAReview.deleteOne({ _id: id });
};