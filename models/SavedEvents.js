const mongoose = require('mongoose');

const savedEventSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    
    // Updated: Now it stores an array of objects!
    events: [{
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
        title: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('SavedEvent', savedEventSchema);