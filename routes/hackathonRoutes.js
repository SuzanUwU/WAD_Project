const express = require('express');
const router = express.Router();
const multer  = require('multer');

const hackathonController = require('./../controllers/hackathonController');

// Multer config — store file in memory as a Buffer (matches image.data schema)
// Limits enforced server-side as a safety net alongside client-side validation
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

// GET /hackathons — main listing page
router.get('/hackathons', hackathonController.showHackathons)
 
// GET /api/majors?school=xxx — dynamic major dropdown (called by frontend JS fetch)
router.get('/api/majors', hackathonController.getMajorsBySchool);

// GET  /hackathons/new — show blank create form
// NOTE: /new must be declared BEFORE /:id routes, otherwise Express matches "new" as an :id parameter and calls the wrong handler
router.get('/new', hackathonController.showCreateForm);

// POST /hackathons/new  — validate and save new hackathon
router.post('/new', upload.single('bannerImage'), hackathonController.createHackathon);

// GET  /hackathons/:id/edit — show pre-filled edit form
router.get('/:id/edit', hackathonController.showEditForm);

// POST /hackathons/:id/edit — submit edits, validate, update in DB
router.post('/:id/edit', upload.single('bannerImage'), hackathonController.updateHackathon);

// POST /hackathons/:id/delete — delete hackathon
router.post('/:id/delete', hackathonController.deleteHackathon);

// GET  /hackathons/:id/signup   — show sign-up form
// NOTE: must be before /:id/edit so Express doesn't confuse 'signup' with an edit subroute
router.get('/:id/signup',     hackathonController.showSignupForm);

// POST /hackathons/:id/signup   — submit sign-up with smart registration logic
router.post('/:id/signup',    hackathonController.registerAttendee);

// GET  /hackathons/:id/attendees — view attendee list
router.get('/:id/attendees',  hackathonController.showAttendees);
 
module.exports = router;

