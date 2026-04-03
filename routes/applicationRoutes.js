
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/ApplicationController');
const {requireAdmin } = require("../middleware/auth" );


router.post('/apply/:id', jobController.applyJob);
router.get('/applied-job', jobController.retrieveAppliedJobs);

router.get('/applicants',requireAdmin, jobController.retrieveAllApplicants);
router.get('/delete-application/:id', jobController.deleteApplication);

router.get('/accept-applicant/:id',requireAdmin, jobController.acceptApplicant);

// Reject applicant
router.get('/reject-applicant/:id',requireAdmin, jobController.rejectApplicant);


module.exports = router;