const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organizer: String,
  category: String,

  startDate: Date,
  endDate: Date,

  location: String,
  description: String,

  image: {
    data: Buffer,
    contentType: String
  }
});

const Event = mongoose.model('Event', eventSchema, 'events');

module.exports = Event;