// controllers/eventController.js
const fs = require('fs/promises');

// Get Service model
const Event = require('../models/all-events-model');

exports.listEvents = async (req, res, next) => {
  try {
    // You can sort by date or createdAt if you have that field
    console.log('🔍 SESSION USER:', req.session.user);  // Should show user object
    console.log('🔍 res.locals.user:', res.locals.user); // Should show user object

    const events = await Event.find().sort({ date: 1 });

    res.render('events-list', {
      title: 'All Events',
      events, // pass array to view
      user: req.session?.user || null
    });
  } catch (err) {
    next(err); // or res.status(500).send('Error fetching events');
  }
};



