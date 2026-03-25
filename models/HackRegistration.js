const mongoose = require('mongoose');
 
const hackRegistrationSchema = new mongoose.Schema({
 
  hackathonId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Hackathon',
    required: true,
  },
 
  eventId: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'Event',
    default: null,           // placeholder — link when events integration is complete
  },
 
  // Team leader (the user submitting the form)
  userId: {
    type:    String,
    default: 'placeholder_user', // replace with req.session.userId when session is ready
  },
 
  username: {
    type:     String,
    required: true,
    trim:     true,
  },
 
  email: {
    type:      String,
    required:  true,
    trim:      true,
    lowercase: true,
  },
 
  school: {
    type:     String,
    required: true,
  },
 
  major: {
    type:     String,
    required: true,
  },
 
  // Additional team members (excluding the leader)
  // Each entry stores the teammate's userId and email resolved from the Users collection
  teamMembers: [
    {
      userId:   { type: String, required: true },
      email:    { type: String, required: true, lowercase: true },
      username: { type: String, default: '' },
    }
  ],
 
  teamSize: {
    type:     Number,
    required: true,
    min:      1,
  },
 
  registeredAt: {
    type:    Date,
    default: Date.now,
  },
 
});
 
// Prevent the same user from registering for the same hackathon twice
hackRegistrationSchema.index({ hackathonId: 1, userId: 1 }, { unique: true });
 
const HackRegistration = mongoose.model(
  'HackRegistration',
  hackRegistrationSchema,
  'hackRegistrations'
);
module.exports = HackRegistration;