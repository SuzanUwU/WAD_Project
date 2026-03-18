// models/Event.js
const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organizer: String,        // ← NEW
  category: String,
  date: Date,
  location: String,
  description: String,
  image: {
    data: Buffer,
    contentType: String
  }
});



const Event = mongoose.model('Event', eventSchema, 'events');

// CORRECT EXPORT ↓
module.exports = Event;  // Exports the MODEL
