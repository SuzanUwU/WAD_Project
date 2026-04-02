const express = require('express');
const multer = require('multer'); 

const router = express.Router(); // sub application

const eventController = require('../controllers/eventController');

const Event = require('../models/eventModel');
const SavedEvents = require('../models/SavedEvents');
const savedEventController = require('../controllers/savedeventsController');
const Organizer = require('../models/Organizer');
const subscribedOrgController = require('../controllers/subscribedOrgController');
const SubscribedOrg = require('../models/subscribed-org-model');

// configure multer
const upload = require('multer')({ storage: multer.memoryStorage() });

// router to get/read data about all events
router.get('/', async (req, res) => {
  try {
    // 1. Fetch all standard events
    const events = await Event.find().sort({ date: -1 }); 
    
    // 2. Set up an empty array just in case they aren't logged in
    let mySavedEvents = [];
    let mySubscribedOrgs = [];

    // 3. If they ARE logged in, fetch their specific saved list
    if (req.session && req.session.user) {
      const savedDoc = await SavedEvents.findOne({ userId: req.session.user.userId });
      if (savedDoc) {
        mySavedEvents = savedDoc.events; // Grab the array of saved events
      }

      const subDoc = await SubscribedOrg.findOne({ userId: req.session.user.userId });
      if (subDoc) mySubscribedOrgs = subDoc.subscribedOrganizers;
    }

    // 4. Pass BOTH the events and mySavedEvents to the EJS page
    res.render('suzan/all-events', { 
        events: events, 
        mySavedEvents: mySavedEvents,
        mySubscribedOrgs: mySubscribedOrgs 
    });
    
  } catch (err) {
    console.error("Error loading events page:", err);
    res.render('suzan/all-events', { events: [], mySavedEvents: [], mySubscribedOrgs: [] });
  }
});

// create a new event with image 
// might have to delete and reroute
router.post('/', upload.single('eventImage'), async (req, res) => {
  try {
    const newEvent = new Event({
      title: req.body.title,
      category: req.body.category,
      date: new Date(req.body.date), // need to adjust the date to have start and end
      location: req.body.location || '',
      description: req.body.description || '',
      image: req.file ? {
        data: req.file.buffer,
        contentType: req.file.mimetype
      } : null
    });
    
    await newEvent.save();
    res.redirect('/events');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});



router.get('/saved-events', savedEventController.viewSavedEvents);

// Save event (POST)
router.post('/save-event', async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    
    // Safety check just in case the event doesn't exist
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const userId = req.session.user.userId;     // 'S001'
    const username = req.session.user.username; 
    
    let savedDoc = await SavedEvents.findOne({ userId: userId });

    // SCENARIO 1: User has never saved an event before
    if (!savedDoc) {
      const newSavedDoc = new SavedEvents({
        userId: userId,
        username: username,
        events: [{                  // ✅ strictly using 'events' array
          title: event.title,       // ✅ strictly using 'title'
          eventId: event._id
        }]
      });
      
      await newSavedDoc.save();
      return res.json({ success: true }); // Use 'return' to stop the function here!
    } 
    
    // SCENARIO 2: User already has a saved list
    // Check for duplicates first
    const exists = savedDoc.events.some(se => 
      se.eventId.toString() === eventId
    );
    
    if (exists) {
      return res.json({ error: 'Already saved' });
    }
    
    // It's not a duplicate, so push the new event to the array
    savedDoc.events.push({        
      title: event.title,         
      eventId: event._id
    });
    
    await savedDoc.save();
    return res.json({ success: true });

  } catch (error) {
    console.error("Save Event Error:", error);
    res.status(500).json({ error: 'Server error while saving.' });
  }
});

// Remove saved event
router.delete('/unsave-event/:eventId', savedEventController.unsaveEvent);
router.delete('/unsave/:eventId', async (req, res) => {
  const result = await SavedEvents.updateOne(
    { userId: 'user001' },
    { 
      $pull: { 
        savedEvents: { eventId: req.params.eventId }
      },
      $set: { 
        totalSaved: { $expr: { $size: '$savedEvents' } },
        lastUpdated: new Date()
      }
    }
  );
  res.json({ success: true, removed: result.modifiedCount > 0 });
});

router.get('/saved/:userId', async (req, res) => {
  try {
    const savedDoc = await SavedEvents.findOne({ userId: req.params.userId });
    if (!savedDoc) {
      return res.json({ savedEvents: [], totalSaved: 0 });
    }
    res.json(savedDoc);
  } catch (err) {
    console.error('Error fetching saved events:', err);
    res.json({ savedEvents: [], totalSaved: 0 });
  }
});

router.post('/toggle-subscription', subscribedOrgController.toggleSubscription);
router.get('/subscribed-events', subscribedOrgController.viewSubscribedEvents);


// ------------- EDIT EVENT -------------

// GET /events/editevent - show form with all events\
// Delete this and let the sub categories edit and update to the all-events 
router.get('/editevent', async (req, res) => {
  try {
    const events = await Event.retrieveAll();  // get ALL fields
    console.log('📋 Events with ALL fields:');
    events.forEach(e => console.log('→', e._id, e.title, e.organizer, e.category));
    res.render('suzan/edit-event', { events });
  } catch (err) {
    console.error(err);
    res.render('suzan/edit-event', { events: [] });
  }
});

// GET /events/edit/:eventId - show single event form (optional detail page)
router.get('/edit/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.redirect('/events/editevent');
    res.render('suzan/edit-event-form', { event });
  } catch (err) {
    console.error('❌ Event not found:', err);
    res.redirect('/events/editevent');
  }
});

// POST /events/editevent - handle update 
// delete this as well 
router.post('/editevent', upload.single('eventImage'), async (req, res) => {
  try {
    const { eventId, title, category, date, location, description } = req.body;

    if (!eventId) {
      console.log('❌ Missing eventId in form');
      return res.redirect('/events/editevent');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found:', eventId);
      return res.redirect('/events/editevent');
    }

    // Update fields
    event.title = title || event.title;
    event.category = category || event.category;
    event.date = date ? new Date(date) : event.date;
    event.location = location || event.location;
    event.description = description || event.description;

    // Update image if new file uploaded
    if (req.file) {
      event.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    await event.save();
    console.log('✅ Updated event:', eventId, '→', event.title);
    res.redirect('/events');
  } catch (err) {
    console.error('❌ Edit event error:', err);
    res.status(500).send('Error: ' + err.message);
  }
});

// ------------- EDIT EVENT END -------------

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