const mongoose = require('mongoose');

const savedEventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  savedAt: { type: Date, default: Date.now }
});

const savedEventsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  savedEvents: [savedEventSchema],
  totalSaved: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SavedEvents', savedEventsSchema, 'savedEvents');
