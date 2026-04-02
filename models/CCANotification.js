const mongoose = require("mongoose");

const ccaNotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },

  eventTitle: String,   // for display

  field: String,        // what changed (location, capacity, date)

  oldValue: String,     // before
  newValue: String,     // after

  message: String,      

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