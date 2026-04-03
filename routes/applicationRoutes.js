const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/ApplicationController');
const { requireLogin, requireAdmin } = require('../middleware/auth');


// Apply for a job
router.post('/apply/:id', requireLogin, ApplicationController.applyJob);
router.get('/applied-job', requireLogin, ApplicationController.retrieveAppliedJobs);
router.get('/cancel/:id', requireLogin, ApplicationController.deleteApplication);
router.get('/complete-review/:id', requireAdmin, ApplicationController.completeReview);


// View all applicants
router.get('/applicants', requireAdmin, ApplicationController.retrieveAllApplicants);

// Accept an applicant
router.get('/accept/:id', requireAdmin, ApplicationController.acceptApplicant);

// Reject an applicant
router.get('/reject/:id', requireAdmin, ApplicationController.rejectApplicant);

module.exports = router;