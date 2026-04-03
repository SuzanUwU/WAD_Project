const Job = require('../models/jobModel');
const JobApplication = require('../models/JobApplicationModel');

exports.applyJob = async (req, res) => {
    const userId = req.session.userId || req.session.user?.id;
    const jobId = req.params.id;

    try {
        const findjob = await Job.findById(jobId);
        if (!findjob) {
            return res.send('Job could not be found');
        }

        const newStartDate = new Date(findjob.startDate);
        const newEndDate = new Date(findjob.endDate);

    
        const acceptedApplications = await JobApplication.findByStatus(userId, 'accepted');

        for (let app of acceptedApplications) {
            if (!app.jobId) {
                continue;
            }

            const existingStartDate = new Date(app.jobId.startDate);
            const existingEndDate = new Date(app.jobId.endDate);

            // Check if the job dates overlap
            if (newStartDate <= existingEndDate && newEndDate >= existingStartDate) {
                return res.send('You cannot apply because the job dates overlap with a job that you are currently working for.');
            }
        }

        // Use the `createApplication` method to create a new application
        await JobApplication.createApplication({
            userId: userId,
            jobId: jobId,
            appliedDate: new Date(),
            status: 'pending'
        });

        return res.send('Application submitted successfully');

    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.send('You have already applied for this job');
        }

        return res.send('Unable to apply for job');
    }
};

// Retrieve jobs for the user
exports.retrieveAppliedJobs = async (req, res) => {
    const userId = req.session.userId || req.session.user?.id;

    try {
        // Use the `findByStatus` method to get pending applications
        const appliedrecords = await JobApplication.findByStatus(userId, 'pending');

        const user = req.session.user;
        res.render('rowena/applied-job', {
            records: appliedrecords,
            user: user
        });

    } catch (error) {
        console.log(error);
        res.send('Error retrieving applied jobs');
    }
};

// Retrieve all applicants
exports.retrieveAllApplicants = async (req, res) => {
    try {
        // Use the `find` method to get all applicants
        const applicants = await JobApplication.retrieveall()

        res.render('rowena/view-applicants', {
            applicants: applicants || [],
            user: req.session.user || null
        });
    } catch (error) {
        console.log(error);
        res.send('Unable to retrieve applicants');
    }
};

// User interface to delete application
exports.deleteApplication = async (req, res) => {
    try {
        await JobApplication.findByIdAndDelete(req.params.id);
        res.redirect('/events/part-time-jobs/applied-job');
    } catch (error) {
        console.log(error);
        res.send('Unable to cancel application');
    }
};

// Retrieve applications with accepted status
exports.retrieveActiveJobs = async (req, res) => {
    const userId = req.session.userId || req.session.user?.id;

    try {
        const activerecords = await JobApplication.findByStatus(userId, 'accepted');

        const user = req.session.user;
        res.render('rowena/active-jobs', {
            records: activerecords,
            user: user
        });

    } catch (error) {
        console.log(error);
        res.send('Error retrieving active jobs');
    }
};

// Accept applicant
exports.acceptApplicant = async (req, res) => {
    const id = req.params.id;  // application _id

    try {
        await JobApplication.updateStatus(id, 'accepted');

        res.redirect('/events/part-time-jobs/applicants');
    } catch (error) {
        console.log(error);
        res.send('Failed to accept applicant');
    }
};

// Reject applicant
exports.rejectApplicant = async (req, res) => {
    const id = req.params.id;

    try {
        // Use the `updateStatus` method to change the application status to 'rejected'
        await JobApplication.updateStatus(id, 'rejected');

        res.redirect('/part-time-jobs/applicants');
    } catch (error) {
        console.log(error);
        res.send('Failed to reject applicant');
    }
};