const mongoose = require("mongoose");

const ccaRegistrationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CCA",
    required: true
  },

  registeredAt: {
    type: Date,
    default: Date.now
  }
});

// prevent duplicate
ccaRegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("CCARegistration", ccaRegistrationSchema);