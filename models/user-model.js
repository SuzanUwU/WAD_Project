const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

userSchema.statics.generateNextStudentId = async function() {
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

userSchema.pre('save', async function(next) {
  // Only hash if the password was just created or modified
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByCustomId = function(customId) {
  return this.findOne({ userId: customId });
};

userSchema.statics.authenticateUser = async function(identifier, password) {
  const user = await this.findOne({ 
      $or: [{ email: identifier }, { username: identifier }] 
  });
  
  if (!user) return null;
  
  const isMatch = await user.comparePassword(password);

  if (!isMatch) return null;
  
  return user;
};

module.exports = mongoose.model('User', userSchema);