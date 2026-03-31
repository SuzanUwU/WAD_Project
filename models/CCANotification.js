const mongoose = require("mongoose");

const ccaNotificationSchema = new mongoose.Schema({
  userId: {
    type: String,   // same as your RSVP user (e.g. "S006")
    required: true
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },

  message: {
    type: String,
    required: true
  },

  isRead: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CCANotification", ccaNotificationSchema);