const express = require('express');
const router = express.Router(); // sub application
const eventController = require('../controllers/eventController');
const Event = require('../models/Event');
const multer = require('multer'); 

// configure multer
const upload = require('multer')({ storage: multer.memoryStorage() });

// routers
// routes/eventRoutes.js
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }); // ← NO LIMIT
    console.log('📊 Total events:', events.length);
    res.render('main_events', { events });
  } catch (err) {
    console.error('❌ Route error:', err);
    res.render('main_events', { events: [] });
  }
});


router.get('/events/create', (req, res) => {
  res.render('create-event');
});

// create a new event with image
router.post('/', upload.single('eventImage'), async (req, res) => {
  console.log('🔍 POST /events HIT');  // ← DEBUG
  console.log('📋 Form data:', req.body);  // ← DEBUG  
  console.log('🖼️  File:', req.file);  // ← DEBUG
  
  try {
    const newEvent = new Event({
      title: req.body.title,
      category: req.body.category,
      date: new Date(req.body.date),
      location: req.body.location || '',
      description: req.body.description || '',
      image: req.file ? {
        data: req.file.buffer,
        contentType: req.file.mimetype
      } : null
    });
    
    await newEvent.save();
    console.log('✅ SAVED TO MONGODB');
    res.redirect('/events');
  } catch (err) {
    console.error('❌ ERROR:', err);
    res.status(500).send('Error: ' + err.message);
  }
});

module.exports = router;