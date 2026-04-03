const express = require('express');
const multer = require('multer'); 

const router = express.Router(); // sub application

const eventController = require('../controllers/eventController');

const Event = require('../models/Event');
const SavedEvents = require('../models/SavedEvents');
const Organizer = require('../models/Organizer');

// configure multer
const upload = require('multer')({ storage: multer.memoryStorage() });

// router to get/read data about all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }); // gets all events
    res.render('suzan/all-events', { events });
  } catch (err) {
    res.render('all-events', { events: [] });
  }
});

// organizers section
// GET /events/addorg
router.get('/addorg', (req, res) => {
  res.render('suzan/add-organizer');
});

// POST /events/addorganizer - Handle form submission
router.post('/addorg', upload.single('eventImage'), async (req, res) => {
  try {
    const { title, category, description } = req.body;
    const organizerId = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const newOrganizer = new Organizer({
      organizerName: title,
      organizerId,
      category,
      description: description || '',
      logo: req.file ? {
        data: req.file.buffer,
        contentType: req.file.mimetype
      } : null,
      organizedEvents: []
    });
    
    await newOrganizer.save();
    res.redirect('/events');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
    res.redirect('/events');
  }
});

// GET /events/removeorg
router.get('/removeorg', async (req, res) => {
    try {
      const organizers = await Organizer.find({}).select('organizerId organizerName');
      res.render('suzan/remove-organizer', { organizers });
    } catch (err) {
      res.render('suzan/remove-organizer', { organizers: [] });
    }
});

// POST /events/removeorg 
router.post('/removeorg', async (req, res) => { 
  try {
    const { organizerId, reason } = req.body || {};
    
    if (!organizerId) {
      // I should add an alert
      return res.redirect('/events');
    }
    const result = await Organizer.deleteOne({ organizerId });
    res.redirect('/events');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
    res.redirect('/events');
  }
});

// organizer update their logo or name
router.get('/updateorg', async (req, res) => {
  try {
    const organizers = await Organizer.find({}, 'organizerId organizerName category description');
    console.log(`📋 Found ${organizers.length} organizers for update`);
    res.render('suzan/update-organizer', { organizers });
  } catch (err) {
    console.error('❌ Update form error:', err);
    res.render('suzan/update-organizer', { organizers: [] });
  }
});

// POST /events/updateorganizer - Handle update
router.post('/updateorg', upload.single('logo'), async (req, res) => {
  try {
    const { organizerId, organizerName, category, description } = req.body;
    
    // Find organizer by ID
    const organizer = await Organizer.findOne({ organizerId });
    if (!organizer) {
      console.log('❌ Organizer not found:', organizerId);
      return res.redirect('/events/updateorganizer');
    }
    
    // Update fields
    organizer.organizerName = organizerName || organizer.organizerName;
    organizer.category = category || organizer.category;
    organizer.description = description || organizer.description;
    
    // Update logo if new file uploaded
    if (req.file) {
      organizer.logo = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    
    await organizer.save();
    console.log('✅ Updated:', organizerId, '→', organizerName);
    res.redirect('/events');
    
  } catch (err) {
    console.error('❌ Update error:', err);
    res.redirect('/events');
  }
});
// organizer section end


module.exports = router;