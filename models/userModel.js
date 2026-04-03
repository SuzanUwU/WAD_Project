const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const School = require('./school-model');  // Import for validation

// models/userModel.js - FULL MVC BUSINESS LOGIC
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
  admin_type: {  
    type: String,
    enum: ['cca-admin', 'hack-admin', 'ptjob-admin', 'career-admin'],
    required: function() { return this.role === 'admin'; }
  },
  profile: {
    data: Buffer,
    contentType: String
  },
  school: { type: String, default: '' },
  major:  { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// ✅ EXISTING - Password comparison
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ NEW - Generate sequential student IDs (S001, S002...)
userSchema.statics.generateStudentId = async function() {
  const students = await this.find({ role: 'student' }).select('userId').lean();
  const existingNumbers = students
    .map(user => parseInt(user.userId.replace('S', ''), 10))
    .filter(num => !isNaN(num))
    .sort((a, b) => a - b);

  let nextIdNumber = 1;
  for (let i = 0; i < existingNumbers.length; i++) {
    if (existingNumbers[i] === nextIdNumber) {
      nextIdNumber++;
    } else if (existingNumbers[i] > nextIdNumber) {
      break;
    }
  }
  return `S${nextIdNumber.toString().padStart(3, '0')}`;
};

// ✅ NEW - SMU student email validation
userSchema.statics.isValidStudentEmail = function(email) {
  const studentEmailRegex = /^[a-z0-9._-]+\.\d{4}@([a-z0-9-]+\.)*smu\.edu\.sg$/i;
  return studentEmailRegex.test(email);
};

// ✅ NEW - Complete student signup (handles ALL validation + creation)
userSchema.statics.createStudentUser = async function(data) {
  const { username, email, password, confirmPassword, school, major } = data;
  
  // Password match
  if (password !== confirmPassword) {
    throw new Error('Password does not match, try again.');
  }
  
  // Email validation
  if (!this.isValidStudentEmail(email)) {
    throw new Error('Only SMU student emails (@*.smu.edu.sg) can register here.');
  }
  
  // School validation
  if (!school) {
    throw new Error('Please select your school.');
  }
  const schoolDoc = await School.findOne({ code: school });
  if (!schoolDoc) {
    throw new Error('Selected school is invalid. Load schools.');
  }
  
  // Major validation
  if (!major) {
    throw new Error('Please select your major.');
  }
  const majorExists = schoolDoc.majors.some(m => m.code === major);
  if (!majorExists) {
    throw new Error('Selected major is invalid for your school. Load schools.');
  }
  
  // Duplicate check
  const existingUser = await this.findOne({
    $or: [{ username }, { email }]
  });
  if (existingUser) {
    throw new Error('Username or email already exists.');
  }
  
  // Create user
  const userId = await this.generateStudentId();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = new this({
    userId,
    username,
    email,
    password: hashedPassword,
    school,
    major,
    role: 'student'
  });
  
  return await newUser.save();
};

// ✅ NEW - Get formatted profile info for login session
userSchema.methods.getProfileInfo = async function() {
  let schoolName = this.school;
  let majorName = this.major;
  
  const schoolDoc = await School.findOne({ code: this.school });
  if (schoolDoc) {
    schoolName = schoolDoc.fullName;
    const majorDoc = schoolDoc.majors.find(m => m.code === this.major);
    if (majorDoc) majorName = majorDoc.name;
  }
  
  return {
    schoolName,
    majorName,
    admin_type: this.admin_type || 
      (this.scope === "cca" ? "cca-admin" :
       this.scope === "career" ? "career-admin" :
       this.scope === "hack" ? "hack-admin" :
       this.scope === "ptjob" ? "ptjob-admin" : null)
  };
};

module.exports = mongoose.model('User', userSchema);