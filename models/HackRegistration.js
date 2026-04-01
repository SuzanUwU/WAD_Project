const mongoose = require('mongoose');
 
const hackRegistrationSchema = new mongoose.Schema({
  hackathonId: {type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true},
  eventId: {type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null},
  
  // Team leader (the user submitting the form)
  userId: {type: String, default: 'placeholder_user'}, 
  username: {type: String, required: true, trim: true},
  email: {type: String, required: true, trim: true, lowercase: true},
  school: {type: String, required: true},
  major: {type: String, required: true},
 
  // Additional team members (excluding the leader)
  // Each entry stores the teammate's userId and email resolved from the Users collection
  teamMembers: [
    {
      userId:   { type: String, required: true },
      email:    { type: String, required: true, lowercase: true },
      username: { type: String, default: '' },
    }
  ],
  teamSize: {type: Number, required: true, min: 1},
  registeredAt: {type: Date, default: Date.now},
 
});
 
// Prevent the same user from registering for the same hackathon twice
hackRegistrationSchema.index({ hackathonId: 1, userId: 1 }, { unique: true });

const HackRegistration = mongoose.model('HackRegistration', hackRegistrationSchema,'hackRegistrations');
// exports.model = HackRegistration;

// query helpers
exports.findByHackathon = function (hackathonId) {
  return HackRegistration.find({ hackathonId }).sort({ registeredAt: 1 });
};
 
exports.findByUser = function (userId) {
  return HackRegistration.find({ userId });
};
 
exports.findDuplicate = function (hackathonId, userId) {
  return HackRegistration.findOne({ hackathonId, userId });
};
 
exports.createRegistration = function (data) {
  return HackRegistration.create(data);
};

exports.deleteByHackathon = function (hackathonId) {
  return HackRegistration.deleteMany({ hackathonId });
};