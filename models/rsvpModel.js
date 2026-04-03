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

exports.join = function(eventId, userId, state) {
  return RSVP.create({ event: eventId, user: userId, status: state });
}

exports.cancel = async function(id) {
  return RSVP.deleteOne({ _id:id });
}

exports.promote = async function(rsvpId) {
  return await RSVP.updateOne({ _id: rsvpId },{ status: 'confirmed'});
}

exports.getUserRSVP = function(userId) {
  return RSVP.find({ user: userId });
}

exports.getWaitlistForUser = function(userId) {
  return RSVP.find({ user: userId, status: 'waitlist' });
}
exports.getWaitlistPosition = async function(eventId, userId) {
  const waitlist = await RSVP.find({ event: eventId, status: 'waitlist' }).sort({ joinedAt: 1 });
  console.log(waitlist);
  const position = waitlist.findIndex(rsvp => rsvp.user == userId);
  return position >= 0 ? position + 1 : null; //account for index0
}
exports.getConfirmedForUser = function(userId) {
  return RSVP.find({ user: userId, status: 'confirmed' });
}
exports.getWaitlist = async function(eventId) {
  return await RSVP.find({ event: eventId, status: 'waitlist' }).sort({ joinedAt: 1 });
};
exports.getConfirmed = async function(eventId) {
  return await RSVP.find({ event: eventId, status: 'confirmed' });
}

exports.getDocCount = async function(eventId,state) {
  const attendees = await RSVP.find({ event: eventId, status: state });
  return attendees.length? attendees.length : 0;
}

exports.isAlreadyRsvp = function(eventId, userId) {
  return RSVP.findOne({ event: eventId, user: userId });
}

exports.findById = function(id) {
  return RSVP.findById(id);
}
exports.updateNote = function(id, note) {
  return RSVP.updateOne({_id:id}, { note });//first is WHERE second is to be updated
}
//mass delete rsvps when event is deleted
exports.deleteByEventId = function(eventId) {
  return RSVP.deleteMany({ event: eventId });
}

// can I add these functions?-khin
// for notifications
exports.getByEvent = function(eventId) {
  return RSVP.find({ event: eventId });
}