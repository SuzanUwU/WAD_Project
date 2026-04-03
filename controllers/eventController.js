// need to check the Events vs AllEvents renaming thing here when it comes to the model


// controllers/eventController.js
const fs = require('fs/promises');

// Get Service model
const Subscribed = require('../models/SavedEvents');
const Event = require('../models/eventModel');

const renderAllEvents = async (req, res) => {
    try {
        // 1. Fetch ALL the standard events for the main dashboard
        const allEvents = await Event.retrieveAll(); 
        const latestEvents = events.slice(0, 6)
        // 2. Set up an empty array for subscriptions just in case
        let mySubscriptions = [];

        // 3. IF the user is logged in, fetch their specific subscription list!
        if (req.session && req.session.user) {
            const userSubDoc = await Subscribed.findOne({ userId: req.session.user.userId });
            if (userSubDoc) {
                mySubscriptions = userSubDoc.events;
            }
        }
     
        // 4. Send BOTH arrays to the EJS page
        res.render('all-events', { 
            events: allEvents, 
            mySubscriptions: mySubscriptions, // <--- We pass this new array!
            user: req.session ? req.session.user : null 
        });

    } catch (error) {
        console.error("Error loading events page:", error);
        res.status(500).send("Server Error");
    }
};

module.exports = { renderAllEvents };
