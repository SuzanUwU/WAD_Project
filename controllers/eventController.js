// controllers/eventController.js
const fs = require('fs/promises');

// Get Service model
const Event = require('../models/Event');

exports.listEvents = async (req, res, next) => {
  try {
    // You can sort by date or createdAt if you have that field
    const events = await Event.find().sort({ date: 1 });

    res.render('events-list', {
      title: 'All Events',
      events, // pass array to view
    });
  } catch (err) {
    next(err); // or res.status(500).send('Error fetching events');
  }
};



