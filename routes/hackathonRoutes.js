const express = require('express');
const router = express.Router();
const multer  = require('multer');

const hackathonController = require('./../controllers/hackathonController');
const hackRegisterController = require('./../controllers/hackRegisterController');

// Multer config — store file in memory as a Buffer (matches image.data schema)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed.'));
    }
  },
});

// ----- API routes — must be before /:id routes -----
// GET /api/majors?school=xxx — dynamic major dropdown (called by frontend JS fetch)
router.get('/api/majors', hackathonController.getMajorsBySchool);
// GET  /api/lookup-teammate — validate teammate email before form submission
router.get('/api/lookup-teammate', hackRegisterController.lookupTeammate);

// ----- CRUD routes -----
// GET /hackathons — main listing page
router.get('/hackathons', hackathonController.showHackathons)
// GET  /hackathons/new — show blank create form
router.get('/new', hackathonController.showCreateForm);
// POST /hackathons/new  — validate and save new hackathon
router.post('/new', upload.single('bannerImage'), hackathonController.createHackathon);
// GET  /hackathons/:id/edit — show pre-filled edit form
router.get('/:id/edit', hackathonController.showEditForm);
// POST /hackathons/:id/edit — submit edits, validate, update in DB
router.post('/:id/edit', upload.single('bannerImage'), hackathonController.updateHackathon);
// POST /hackathons/:id/delete — delete hackathon
router.post('/:id/delete', hackathonController.deleteHackathon);

// ----- Registration routes -----
// GET  /hackathons/:id/signup   — show sign-up form
router.get('/:id/signup', hackRegisterController.showSignupForm);
// POST /hackathons/:id/signup   — submit sign-up with smart registration logic
router.post('/:id/signup', hackRegisterController.registerAttendee);
// GET  /hackathons/:id/attendees — view attendee list
router.get('/:id/attendees', hackRegisterController.showAttendees);

module.exports = router;
