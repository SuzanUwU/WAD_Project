const mongoose = require("mongoose");

const ccaSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  title: { type: String },
  organizer: { type: String },
  category: { type: String, default: "CCA" },
  description: { type: String },

  startDate: { type: Date },
  endDate: { type: Date },

  location: { type: String },
  image: { type: String },

  clubType: { type: String },

  capacity: { type: Number, default: 0 },

  // new field
  registrationDeadline: { type: Date },

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

// GET BY EVENT ID
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