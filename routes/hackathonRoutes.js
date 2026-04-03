const express = require('express');
const router = express.Router();

const hackathonController = require('./../controllers/hackathonController');
const hackRegisterController = require('./../controllers/hackRegisterController');
const { requireHackAdmin } = require('../middleware/auth');

// ----- API routes — must be before /:id routes -----
// GET /api/majors?school=xxx — dynamic major dropdown (called by frontend JS fetch)
router.get('/api/majors', hackathonController.getMajorsBySchool);
// GET  /api/lookup-teammate — validate teammate email before form submission
router.get('/api/lookup-teammate', hackRegisterController.lookupTeammate);

// ----- CRUD routes -----
// GET /hackathons — main listing page
router.get('/hackathons', hackathonController.showHackathons)

// GET  /hackathons/new — show blank create form
router.get('/new', requireHackAdmin, hackathonController.showCreateForm);

// POST /hackathons/new  — validate and save new hackathon
router.post('/new', requireHackAdmin, hackathonController.createHackathon);

// GET  /hackathons/:id/edit — show pre-filled edit form
router.get('/:id/edit', hackathonController.showEditForm);

// POST /hackathons/:id/edit — submit edits, validate, update in DB
router.post('/:id/edit', hackathonController.updateHackathon);

// POST /hackathons/:id/delete — delete hackathon
router.post('/:id/delete', hackathonController.deleteHackathon);

// ----- Registration routes -----
// GET  /hackathons/:id/attendees — view attendee list, hackathon id as param
router.get('/:id/attendees', hackRegisterController.showAttendees);

//these two use eventId in param
// GET  /hackathons/:id   — show sign-up form
router.get('/:id', hackRegisterController.showSignupForm);
// POST /hackathons/:id   — submit sign-up with smart registration logic
router.post('/:id', hackRegisterController.registerAttendee);

module.exports = router;
