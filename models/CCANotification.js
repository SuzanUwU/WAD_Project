const mongoose = require("mongoose");

const ccaNotificationSchema = new mongoose.Schema({
  userId: String,
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },
  eventTitle: String,
  field: String,
  oldValue: String,
  newValue: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const CCANotification = mongoose.model("CCANotification", ccaNotificationSchema);


// ================= FUNCTIONS =================

exports.createNotification = function(data) {
  return CCANotification.create(data);
};

exports.getUserNotifications = function(userId) {
  return CCANotification.find({ userId }).sort({ createdAt: -1 });
};

exports.markAsRead = function(id) {
  return CCANotification.updateOne({ _id: id }, { isRead: true });
};