const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  event:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },  //event._id
  user:     { type: String, required: true },  //will be customised string later 
  status:   { type: String, enum: ['confirmed', 'waitlist'], default: 'confirmed' },
  joinedAt: { type: Date, default: Date.now },
  note:     { type: String },
});

rsvpSchema.index({ event: 1, user: 1 }, { unique: true });

const RSVP = mongoose.model('RSVP', rsvpSchema, 'rsvps');

exports.join = function(eventId, userId) {
  return RSVP.create({ event: eventId, user: userId, status: 'confirmed' });
}

exports.bookmark = function(eventId, userId, note) {
  return RSVP.create({ event: eventId, user: userId, status: 'bookmark', note });
}

exports.cancel = function(id) {
  return RSVP.deleteOne({ _id:id });
}

exports.getUserRSVP = function(userId) {
  return RSVP.find({ user: userId });
}

exports.getWaitlistForUser = function(userId) {
  return RSVP.find({ user: userId, status: 'waitlist' });
}

exports.getConfirmedForUser = function(userId) {
  return RSVP.find({ user: userId, status: 'confirmed' });
}

exports.getAttendeesForEvent = function(eventId) {
  return RSVP.find({ event: eventId, status: 'confirmed' });
}

exports.isAlreadyRSVPd = function(eventId, userId) {
  return RSVP.findOne({ event: eventId, user: userId, status: 'confirmed' });
}


exports.findById = function(id) {
  return RSVP.findById(id);
}
exports.updateNote = function(id, note) {
  return RSVP.updateOne({_id:id}, { note });//first is WHERE second is to be updated
}