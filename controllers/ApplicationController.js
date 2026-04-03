const Job = require('../models/jobModel');
const JobApplication = require('../models/JobApplicationModel');

// Apply to a job
exports.applyJob = async (req, res) => {
    const userId = req.session.userId;
    const jobId = req.params.id;

    try {
        const findJob = await Job.findById(jobId);
        if (!findJob)
             return res.send('Job not found');

        const startDate = new Date(findJob.startDate);
        const endDate = new Date(findJob.endDate);

        // Check overlapping accepted jobs
        const acceptedJobs = await JobApplication.findByStatus(userId, 'accepted');
        for (const j of acceptedJobs) {
            const existingStart = new Date(j.jobid.startDate);
            const existingEnd = new Date(j.jobid.endDate);
            if (startDate <= existingEnd && endDate >= existingStart) {
                return  res.send('You cannot apply because the job dates overlap with a job you are currently working for');
            }
        }

        
        const duplicates = await JobApplication.retrieveduplicates(userId, jobId);
        if (duplicates.length > 0) 
            return res.send('You have already applied for this job');


        await JobApplication.create
        ({ userid: userId, jobid: jobId });
        return res.send('Application successfully created');
    } catch (error) {
        console.error(error);
    }
};

// Retrieve all applications for a user
exports.retrieveAllApplication = async (req, res) => {
    const userId = req.session.userId;
    const user = req.session.user;

    try {
        const accepted = await JobApplication.findByStatus(userId, 'accepted');
        const rejected = await JobApplication.findByStatus(userId, 'rejected');
        const pending = await JobApplication.findByStatus(userId, 'pending');

        res.render('rowena/applied-job', { accepted, rejected, pending, user });
    } catch (error) {
        res.send('Error retrieving applied jobs');
    }
};

// Retrieve all job applications (admin view)
exports.retrieveAllJobApplications = async (req, res) => {
    try {
        const applicationList = await JobApplication.displayall();
        const user = req.session.user; 
        res.render('rowena/view-applicants', { record: applicationList, user });
    } catch (error) {
        res.send('Error retrieving job applications');
    }
};

// Delete an application
exports.deleteApplication = async (req, res) => {
    try {
        await JobApplication.findByIdAndDelete(req.params.id);
        res.redirect('/part-time-jobs/applied-job');
    } catch (error) {
        res.send('Unable to cancel application');
    }
};

// Accept applicant
exports.acceptApplicant = async (req, res) => {
    const applicationId = req.params.id;

    try {
        const application = await JobApplication.findById(applicationId);
        if (!application) 
            return res.send('Application not found');

        const job = await Job.findById(application.jobid);
        if (!job) 
            return res.send('Job not found');

        if (job.jobcapacity <= 0) 
            return  res.send('Cannot accept applicant: job is full');

        application.status = 'accepted';
        await application.save();

        job.jobcapacity -= 1;
        await job.save();

        res.redirect('/part-time-jobs/applicants');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to accept applicant');
    }
};

// Reject applicant
exports.rejectApplicant = async (req, res) => {
    try {
        await JobApplication.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        res.redirect('/part-time-jobs/applicants');
    } catch (error) {
        console.error(error);
        res.send('Failed to reject applicant');
    }
};

exports.completeReview = async (req, res) => {
    const id = req.params.id;
    try {
        res.send('Review completed (functionality to implement)');
    } catch (error) {
    
        res.send('Failed to complete review');
    }
};