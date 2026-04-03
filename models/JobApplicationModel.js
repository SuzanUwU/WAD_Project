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
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  jobreview: {
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

// Ensures dignity of records (no duplicate user-job combinations)
jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });


const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);


exports.findByStatus = function (userId, status) {
  return JobApplication.find({ userId, status }).populate('jobId');
};


exports.createApplication = function (data) {
  return JobApplication.create(data);
};


exports.updateStatus = function (id, status) {
  return JobApplication.findByIdAndUpdate(id, { status }, { new: true });

};

exports.retrieveall = function (){
  return JobApplication.find().populate('userId').populate('jobId');

}



            



