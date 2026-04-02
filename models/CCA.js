const mongoose = require("mongoose");

const ccaSchema = new mongoose.Schema({
  
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  title: {
    type: String,
    required: true
  },

  organizer: {
    type: String,
    required: true
  },

  category: {
    type: String,
    default: "CCA"
  },

  description: {
    type: String
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  location: {
    type: String
  },

  // BUFFER IMAGE
  image: {
    data: Buffer,
    contentType: String
  },

  clubType: {
    type: String,
    required: true
  },

  capacity: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CCA", ccaSchema, "cca");