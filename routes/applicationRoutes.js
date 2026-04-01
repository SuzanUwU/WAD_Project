const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/ApplicationController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

router.post('/part-time-jobs/apply/:id', requireLogin, ApplicationController.applyJob);

router.get('/part-time-jobs/applied-job', requireLogin, ApplicationController.retrieveAppliedJobs);
router.get('/part-time-jobs/cancel/:id', requireLogin, ApplicationController.deleteApplication);
router.get('/part-time-jobs/active-jobs', requireLogin, ApplicationController.retrieveActiveJobs);

router.get('/part-time-jobs/applicants', requireAdmin, ApplicationController.retrieveAllApplicants);
router.get('/part-time-jobs/accept/:id', requireAdmin, ApplicationController.acceptApplicant);
router.get('/part-time-jobs/reject/:id', requireAdmin, ApplicationController.rejectApplicant);

module.exports = router;