const express = require('express');
const router = express.Router();
const JobController = require('../controllers/ptController.js');

const { requireLogin, requireAdmin } = require("../middleware/auth");


// ================= USER ROUTES =================

// view jobs (students)
router.get('/part-time-jobs', JobController.displayalljob);


// ================= ADMIN ROUTES =================

// admin dashboard (NEW)
router.get('/admin', requireAdmin, JobController.displayalljob);

// create job
router.get('/admin/create', requireAdmin, JobController.displayJobform);
router.post('/admin/create', requireAdmin, JobController.createNewJob);

// update job
router.get('/admin/update', requireAdmin, JobController.retrieveJob);
router.post('/admin/update', requireAdmin, JobController.editJob);

// delete job
router.get('/admin/delete', requireAdmin, JobController.getDeleteJob);


module.exports = router;