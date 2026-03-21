const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  organizerName: { type: String, required: true },
  organizerId: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: String,
  logo: {
    data: Buffer,
    contentType: String
  },
  organizedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
});

module.exports = mongoose.model('Organizer', organizerSchema);
