const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  rsvp: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("RSVP", rsvpSchema);