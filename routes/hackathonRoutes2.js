// routes/hackathonRoutes.js
const express = require('express');
const router  = express.Router();
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

// GET  /hackathons              — listings page
router.get('/',               hackathonController.showHackathons);

// GET  /hackathons/api/majors   — dynamic major dropdown
router.get('/api/majors',     hackathonController.getMajorsBySchool);

// GET  /hackathons/new          — blank create form
router.get('/new',            hackathonController.showCreateForm);

// POST /hackathons/new          — upload.single runs before controller,
//                                 attaches file to req.file if provided
router.post('/new',           upload.single('bannerImage'), hackathonController.createHackathon);

// GET  /hackathons/:id/edit     — pre-filled edit form
router.get('/:id/edit',       hackathonController.showEditForm);

// POST /hackathons/:id/edit     — same Multer middleware for edit
router.post('/:id/edit',      upload.single('bannerImage'), hackathonController.updateHackathon);

// POST /hackathons/:id/delete   — delete hackathon
router.post('/:id/delete',    hackathonController.deleteHackathon);

// GET  /hackathons/:id/signup   — show sign-up form
// NOTE: must be before /:id/edit so Express doesn't confuse 'signup' with an edit subroute
router.get('/:id/signup',     hackathonController.showSignupForm);

// POST /hackathons/:id/signup   — submit sign-up with smart registration logic
router.post('/:id/signup',    hackathonController.registerAttendee);

// GET  /hackathons/:id/attendees — view attendee list
router.get('/:id/attendees',  hackathonController.showAttendees);

module.exports = router;
