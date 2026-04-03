const express = require('express');
const router = express.Router();
const JobController = require('../controllers/ptController.js');

const { requireAdmin } = require("../middleware/auth");

// LIST
router.get('/', JobController.displayalljob);

// CREATE
router.get('/create', requireAdmin, JobController.displayJobform);
router.post('/create', requireAdmin, JobController.createNewJob);

// UPDATE
router.get('/update-job', requireAdmin, JobController.retrieveJob);
router.post('/update-job', requireAdmin, JobController.editJob);

// DELETE
router.get('/delete-job', requireAdmin, JobController.getDeleteJob);
router.post('/search', JobController.searchJob);

module.exports = router;