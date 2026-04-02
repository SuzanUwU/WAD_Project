const mongoose = require('mongoose');

const subscribedOrgSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    
    subscribedOrganizers: [String] 
}, { timestamps: true });

module.exports = mongoose.model('SubscribedOrg', subscribedOrgSchema);