const CCA = require("../models/CCA");
const RSVP = require("../models/RSVP");


// View all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await CCA.find();
    res.render("khin/adminEvents", { events });
  } catch (err) {
    console.error(err);
    res.send("Error loading events");
  }
};


// Show create form
exports.showCreateForm = (req, res) => {
  res.render("khin/createEvent");
};


// Create event (IMPORTANT: BUFFER IMAGE)
exports.createEvent = async (req, res) => {
  try {
    const newEvent = new CCA({
      title: req.body.title,
      organizer: req.body.organizer,
      description: req.body.description,
      category: req.body.category,
      clubType: req.body.clubType,
      date: req.body.date,
      location: req.body.location,

      image: req.file
      ? {
          data: req.file.buffer,
          contentType: req.file.mimetype
        }
      : undefined
    });

    await newEvent.save();

    res.redirect("/events/ccaAdmin");

  } catch (err) {
    console.error(err);
    res.send("Error creating event");
  }
};


// Show edit form
exports.showEditForm = async (req, res) => {
  try {
    const event = await CCA.findById(req.params.id);
    res.render("khin/editEvent", { event });
  } catch (err) {
    console.error(err);
    res.send("Error loading event");
  }
};


// Update event
exports.updateEvent = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      organizer: req.body.organizer,
      description: req.body.description,
      category: req.body.category,
      clubType: req.body.clubType,
      date: req.body.date,
      location: req.body.location
    };

    if (req.file) {
      updateData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    await CCA.findByIdAndUpdate(req.params.id, updateData);

    res.redirect("/events/ccaAdmin");

  } catch (err) {
    console.error(err);
    res.send("Error updating event");
  }
};


// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    await CCA.findByIdAndDelete(req.params.id);
    res.redirect("/events/ccaAdmin");
  } catch (err) {
    console.error(err);
    res.send("Error deleting event");
  }
};


// Get attendees
exports.getAttendees = async (req, res) => {
  try {
    const event = await CCA.findById(req.params.id);

    const attendees = await RSVP.find({ eventId: req.params.id });

    res.render("khin/attendees", {
      event,
      attendees
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading attendees");
  }
};