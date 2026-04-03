const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    appliedDate: { type: Date, required: true },
    status: { type: String, required: true, enum: ['pending', 'accepted', 'rejected'] }
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

exports.createApplication = function (applicationData) {
    return JobApplication.create(applicationData);
}

exports.findById = function (id) {
    return JobApplication.findById(id)
        .populate('userId')
        .populate('jobId');
}

exports.findByStatus = function (userId, status) {
    return JobApplication.find({ userId, status })
        .populate('jobId');
}

exports.findByUserId = function (userId) {
    return JobApplication.find({ userId })
        .populate('jobId');
}

exports.updateById = function (id, data) {
    return JobApplication.updateOne({ _id: id }, data);
}

exports.deleteById = function (id) {
    return JobApplication.findByIdAndDelete(id);
}

exports.findAcceptedApplications = function (userId) {
    return JobApplication.find({ userId, status: 'accepted' })
        .populate('jobId');
}

exports.findAllApplications = function () {
    return JobApplication.find().populate('userId') .populate('jobId');
}




