const express = require('express');

const careerController = require('../controllers/careerController');
const profileController = require('../controllers/profileController')
const router = express.Router(); // sub application

// router.get('ejs',xController.renderthis)
router.get('/career-events',careerController.displayCareers)
router.get('/career/detail',careerController.careerDetail)
router.post('/rsvp-join', profileController.joinRsvp)
router.get('/dashboard',profileController.displayUser)
router.get('/dashboard/rsvp',profileController.showRsvp)
router.post('/rsvp-update',profileController.updateRsvp)
router.post('/rsvp-delete',profileController.deleteRsvp)
router.post('/rsvp-replace',profileController.replaceRsvp)
module.exports = router;