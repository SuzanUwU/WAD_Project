const express = require('express');
const router = express.Router();
const JobController = require('../controllers/ptController.js');

const { requireLogin, requirePtjobAdmin } = require("../middleware/auth");

router.get('/part-time-jobs',JobController.displayalljob);

router.get('/part-time-jobs/create', requirePtjobAdmin, JobController.displayJobform);
router.post('/part-time-jobs/create', requirePtjobAdmin, JobController.createNewJob);

router.get('/part-time-jobs/update-job',requirePtjobAdmin, JobController.retrieveJob);
router.post('/part-time-jobs/update-job', requirePtjobAdmin, JobController.editJob);

router.get('/part-time-jobs/delete-job', requirePtjobAdmin, JobController.getDeleteJob);

module.exports = router;