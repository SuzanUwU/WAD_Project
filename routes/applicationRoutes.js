const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/ApplicationController');
const { requireLogin, requireAdmin } = require('../middleware/auth');



// user 
router.post('/apply/:id', requireLogin, ApplicationController.applyJob);
router.get('/applied-job', requireLogin, ApplicationController.retrieveAllApplication);
router.get('/cancel/:id', requireLogin, ApplicationController.deleteApplication);
router.get('/complete-review/:id', requireAdmin, ApplicationController.completeReview);



// admin 
router.get('/applicants', requireAdmin, ApplicationController.retrieveAllJobApplications);

router.get('/accept/:id', requireAdmin, ApplicationController.acceptApplicant);

router.get('/reject/:id', requireAdmin, ApplicationController.rejectApplicant);


module.exports = router;