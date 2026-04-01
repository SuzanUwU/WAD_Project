const SavedEvent = require('../models/SavedEvents');
const Event = require('../models/eventModel');

// --- Helper to check if user is logged in ---
const checkSession = (req, res) => {
    if (!req.session || !req.session.user) {
        res.redirect('/login');
        return false;
    }
    return true;
};

// --- GET: View the user's saved events list ---
const viewSavedEvents = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.user.userId;
        
        // 1. Find the user's saved list document
        const savedDoc = await SavedEvent.findOne({ userId: userId });
        
        let fullEventDetails = [];

        // 2. If they have a saved list, go fetch the full event data!
        if (savedDoc && savedDoc.events.length > 0) {
            // Extract just the raw Event IDs from their saved list
            const eventIds = savedDoc.events.map(savedItem => savedItem.eventId);
            
            // Search the main Event database for ALL events that match those IDs
            // The $in operator is a MongoDB superpower for searching arrays!
            fullEventDetails = await Event.findManyByIds(eventIds);
        }

        // 3. Send the FULL event details to the EJS page
        res.render('saved-events', { 
            events: fullEventDetails, 
            username: req.session.user.username,
            user: req.session.user,
            error: null 
        });

    } catch (error) {
        console.error("Error fetching full saved events:", error);
        res.render('saved-events', { 
            events: [], 
            username: req.session.user.username, 
            error: 'Could not load event details.' 
        });
    }
};

// --- POST: Add an event to the saved list (Now handles JSON fetch requests) ---
const saveEvent = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).send("You must be logged in to save events.");
    }

    try {
        // These match the keys we sent in the JSON stringify!
        const { eventId, eventTitle } = req.body; 
        const { userId, username } = req.session.user;

        let userSavedInfo = await SavedEvent.findOne({ userId });

        if (!userSavedInfo) {
            userSavedInfo = new SavedEvent({ userId, username, events: [] });
        }

        // Check if the user already saved this specific eventId
        const alreadySaved = userSavedInfo.events.some(e => e.eventId.toString() === eventId);
        
        if (alreadySaved) {
             return res.status(400).send("You already saved this event!");
        }

        // Push the object containing the ID and Title
        userSavedInfo.events.push({ eventId: eventId, title: eventTitle });
        await userSavedInfo.save();

        console.log(`✅ ${username} saved the event: "${eventTitle}"`);
        
        // Since we are using fetch(), we just send a success status back, not a full page render!
        res.status(200).send("Saved");

    } catch (error) {
        console.error("Save Event Error:", error);
        res.status(500).send("Server Error");
    }
};

// --- DELETE: Remove an event from the saved list ---
const unsaveEvent = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const eventIdToRemove = req.params.eventId;
        const userId = req.session.user.userId;

        // Use $pull to remove the specific event from the array
        const result = await SavedEvent.updateOne(
            { userId: userId },
            { 
                $pull: { 
                    events: { eventId: eventIdToRemove } 
                } 
            }
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ error: "Event not found in your list." });
        }

    } catch (error) {
        console.error("Unsave Event Error:", error);
        res.status(500).json({ error: "Server error while removing event." });
    }
};

module.exports = { viewSavedEvents, saveEvent, checkSession, unsaveEvent};