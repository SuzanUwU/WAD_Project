const mongoose = require("mongoose");

const ccaSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  title: String,
  organizer: String,
  category: { type: String, default: "CCA" },
  description: String,
  startDate: Date,
  endDate: Date,
  location: String,
  image: String,
  clubType: String,
  capacity: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const CCA = mongoose.model("CCA", ccaSchema, "cca");


// ================= FUNCTIONS =================

// GET ALL
exports.getAllCCA = function(query = {}) {
  return CCA.find(query).populate("eventId");
};

// GET BY CCA ID
exports.getCCAById = function(id) {
  return CCA.findById(id).populate("eventId");
};

// GET BY EVENT ID (VERY IMPORTANT)
exports.getCCAByEventId = function(eventId) {
  return CCA.findOne({ eventId }).populate("eventId");
};

// CREATE
exports.createCCA = function(data) {
  return CCA.create(data);
};

// UPDATE
exports.updateCCA = function(id, data) {
  return CCA.findByIdAndUpdate(id, data, { returnDocument: 'after' });
};

// DELETE
exports.deleteCCA = function(id) {
  return CCA.findByIdAndDelete(id);
};