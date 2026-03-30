const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// models/user-model.js
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, 
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    default: 'student'
  },
  admin_type: {  // ✅ this is for the sub admins
    type: String,
    enum: ['cca-admin', 'hack-admin', 'ptjob-admin', 'career-admin'],
    required: function() { return this.role === 'admin'; }
  },
  profile: {
    data: Buffer,
    contentType: String
  },
  // school:   { type: mongoose.Schema.Types.ObjectId, ref: "School" },
  // Stored as school code string (e.g. "scis") so it can be compared directly
  // against eligibleSchools arrays on Hackathon without a DB join
  school: { type: String, default: '' },
  major:  { type: String, default: '' }, // major code e.g. "ba"
  createdAt: { type: Date, default: Date.now }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
