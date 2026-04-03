const express = require('express');

const router = express.Router(); // sub application

const eventController = require('../controllers/eventController');

const Event = require('../models/eventModel');
const SavedEvents = require('../models/SavedEvents');
const savedEventController = require('../controllers/savedeventsController');
const Organizer = require('../models/Organizer');
const Hackathon = require('../models/Hackathon')
// router to get/read data about all events
router.get('/', async (req, res) => {
  try {
   let events = await Event.retrieveAll().sort({ startDate: -1 });
   const hackathons = await Hackathon.getByStatus('open');
    const openHackathonIds =hackathons.map(h => h.eventId.toString());
    events = events.filter(e => {
      if (e.category !== "Hackathon") {
        return true;
      }
      return openHackathonIds.includes(e._id.toString());
    });
    console.log(events)

    let mySavedEvents = [];

    // 3. If they ARE logged in, fetch their specific saved list
    if (req.session && req.session.user) {
      const savedDoc = await SavedEvents.findOne({ userId: req.session.user.userId });
      if (savedDoc) {
        mySavedEvents = savedDoc.events; // Grab the array of saved events
      }
    }

    // 4. Pass BOTH the events and mySavedEvents to the EJS page
    res.render('suzan/all-events', { 
        events: events, 
        mySavedEvents: mySavedEvents 
    });
    
  } catch (err) {
    console.error("Error loading events page:", err);
    res.render('suzan/all-events', { events: [], mySavedEvents: [] });
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

module.exports = router;