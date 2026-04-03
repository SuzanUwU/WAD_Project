const mongoose = require('mongoose');

// Define the JobApplication schema
const jobApplicationSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobid: {
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
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    jobreview: {
        ratings: {
            type: Number,
            min: 0,
            max: 5
        },
        comments: {
            type: String,
        }
    }
});
// ensures that no duplicated jobs records will be found
jobApplicationSchema.index({ userid: 1, jobid: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);


// display all jobs 
exports.displayAll = function () {
    return JobApplication.find(); 
};

//create jobs 
exports.createApplication = function (createApp) {
    return JobApplication.create(createApp); 
};

//retrieve any duplicates 
exports.retrieveduplicates = function (userid, jobid) {
    return JobApplication.find({ userid, jobid }); 
};

// retrieve individual's job 
exports.findByStatus = function (userid, status) {
    return JobApplication.find({ userid, status }).populate('jobid'); 
};

exports.retrieveApplicants = function () {
    return JobApplication.find() .populate('userId') .populate('jobId');
};




exports.findByIdAndDelete = function (id) {
    return JobApplication.findByIdAndDelete(id);
};


exports.updateStatus = function (id, status) {
    return JobApplication.findByIdAndUpdate(id, { status: status }); 
};


exports.updateReview = function (id, review) {
    return JobApplication.findByIdAndUpdate(id, {
        jobreview: review
    }); 
};


