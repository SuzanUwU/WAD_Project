const Job = require('../models/jobModel');
const JobApplication = require('../models/JobApplicationModel');

exports.applyJob = async (req, res) => {
    const userId = req.session.userId 
    const jobId = req.params.id;
    try {
    
        const findjob = await Job.findById(jobId);
        if (!findjob) {
            return res.send('Job could not be found');
        }

        const newStartDate = new Date(findjob.startDate);
        const newEndDate = new Date(findjob.endDate);

    
        // get all accepted jobs for this user
        const acceptedApplications = await JobApplication.findByStatus(userId,'accepted');
            

        for (let j of acceptedApplications) {
            if (!j.jobId) {
                continue;
            }

            const existingStartDate = new Date(j.jobId.startDate);
            const existingEndDate = new Date(j.jobId.endDate);


            if (newStartDate <= existingEndDate && newEndDate >= existingStartDate) {
                return res.send('You cannot apply because the job dates overlap with a job that you are currently working for ');
            }
        }

        await JobApplication.create({
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

// retrieve jobs for user 
exports.retrieveAppliedJobs = async (req, res) => {
    const userId = req.session.userId || req.session.user?.id;

    try {
        
     const appliedrecords = await JobApplication.findByStatus(userId,'pending');
        
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


// retrieve applicants 

exports.retrieveAllApplicants = async (req, res) => {
    try {
        const applicants = await JobApplication.retrieveApplicants()

        res.render('rowena/view-applicants', {
            applicants: applicants || [],
            user: req.session.user || null
        });
    } catch (error) {
        console.log(error);
        res.send('Unable to retrieve applicants');
    }
};


// user interface to delete application 
exports.deleteApplication = async (req, res) => {
    try {
        await JobApplication.findByIdAndDelete(req.params.id);
        res.redirect('/events/part-time-jobs/applied-job');
    } catch (error) {
        console.log(error);
        res.send('Unable to cancel application');
    }
};


// ACCEPT APPLICANT 
exports.acceptApplicant = async (req, res) => {
    const id = req.params.id;   // application _id

    try {
        await JobApplication.updateStatus(id, {
            status: 'accepted'
        });

        res.redirect('/events/part-time-jobs/applicants');
    } catch (error) {
        console.log(error);
        res.send('Failed to accept applicant');
    }
};


exports.rejectApplicant = async (req, res) => {
    const id = req.params.id;   

    try {
        await JobApplication.updateStatus(id, {
            status: 'rejected'
        });

        res.redirect('/events/part-time-jobs/applicants');
    } catch (error) {
        console.log(error);
        res.send('Failed to accept applicant');
    }
};




