const express = require('express');
const router = express.Router();
const JobController = require('../controllers/ptController.js');

const { requireLogin, requireAdmin } = require("../middleware/auth");


router.get('/part-time-jobs',JobController.displayalljob);

router.get('/part-time-jobs/create', requireAdmin,JobController.displayJobform);
router.post('/part-time-jobs/create', requireAdmin,JobController.createNewJob);

router.get('/part-time-jobs/update-job',requireAdmin, JobController.retrieveJob);
router.post('/part-time-jobs/update-job',requireAdmin, JobController.editJob);


router.get('/part-time-jobs/delete-job',requireAdmin, JobController.getDeleteJob);




module.exports = router;