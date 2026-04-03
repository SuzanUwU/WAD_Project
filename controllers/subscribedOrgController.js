const SubscribedOrg = require('../models/subscribed-org-model');
const Event = require('../models/eventModel');


const toggleSubscription = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { organizerName } = req.body;
        const userId = req.session.user.userId;
        const username = req.session.user.username;

        let subDoc = await SubscribedOrg.findOne({ userId: userId });

        if (!subDoc) {
            subDoc = new SubscribedOrg({
                userId: userId,
                username: username,
                subscribedOrganizers: [organizerName]
            });
            await subDoc.save();
            return res.json({ success: true, isSubscribed: true });
        }

        const isAlreadySubscribed = subDoc.subscribedOrganizers.includes(organizerName);

        if (isAlreadySubscribed) {
            subDoc.subscribedOrganizers = subDoc.subscribedOrganizers.filter(org => org !== organizerName);
            await subDoc.save();
            return res.json({ success: true, isSubscribed: false });
        } else {
            subDoc.subscribedOrganizers.push(organizerName);
            await subDoc.save();
            return res.json({ success: true, isSubscribed: true });
        }

    } catch (error) {
        console.error("Subscription Error:", error);
        res.status(500).json({ error: "Server error." });
    }
};


const viewSubscribedEvents = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.user.userId;
        const subDoc = await SubscribedOrg.findOne({ userId: userId });
        
        let tailoredEvents = [];

        if (subDoc && subDoc.subscribedOrganizers.length > 0) {
            tailoredEvents = await Event.find({ 
                organizer: { $in: subDoc.subscribedOrganizers } 
            }).sort({ date: -1 });
        }

        res.render('subscribed-events', { 
            events: tailoredEvents, 
            username: req.session.user.username 
        });

    } catch (error) {
        console.error("Error fetching subscribed events:", error);
        res.render('subscribed-events', { events: [], username: req.session.user.username });
    }
};

module.exports = { toggleSubscription, viewSubscribedEvents };