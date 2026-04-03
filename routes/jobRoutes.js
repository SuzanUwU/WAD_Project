const express = require('express');
const router = express.Router();
const JobController = require('../controllers/ptController');

const {requireAdmin } = require("../middleware/auth");


router.get('/',JobController.displayalljob);

router.post('/create', requireAdmin,JobController.createNewJob);
router.get('/create',requireAdmin,JobController.displayJobform)


router.get('/update-job',requireAdmin, JobController.retrieveJob);
router.post('/update-job',requireAdmin, JobController.editJob);


router.get('/delete-job',requireAdmin, JobController.getDeleteJob);

router.post('/search-job',JobController.searchJob);




module.exports = router;