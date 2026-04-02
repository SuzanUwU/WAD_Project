const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  startDate:{
    type:Date
  },
  endDate:{
    type:Date

  }, jobreview: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    reviewedAt: {
      type: Date
    }
  }
});


// ensures dignity of records no duplicated records
jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true })


// find applicants with job status 
exports.findByUserAndStatus = function(userId, status) {
  return JobApplication.find({ userId, status }).populate('jobId');
};

exports.create = function (details){
  return JobApplication.create(details)
}


exports.findByIdAndDelete =function(id){
  return JobApplication.findByIdAndDelete(id)
}

exports.findByIdAndUpdate = function(id, status) {
  return JobApplication.findByIdAndUpdate(id, { status: status });
}

exports.viewall = function (){
  return JobApplication.find();
}




module.exports = mongoose.model('JobApplication', jobApplicationSchema);