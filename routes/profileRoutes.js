const express = require('express');

const profileController = require('../controllers/profileController')
const router = express.Router(); // sub application

// router.get('ejs',xController.renderthis)
router.post('/rsvp-join', profileController.joinRsvp)
router.get('/',profileController.displayUser)
router.get('/rsvp',profileController.showRsvp)
router.post('/rsvp-update',profileController.updateRsvp)
router.post('/rsvp-delete',profileController.deleteRsvp)
router.post('/rsvp-replace',profileController.replaceRsvp)
module.exports = router;