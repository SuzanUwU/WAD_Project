const mongoose = require("mongoose");
const Event = require("../models/eventModel");
const RSVP = require("../models/rsvpModel");


// CCA Events List
exports.getCCAEvents = async (req, res) => {
  try {
    let ccaEvents = await Event.find({ category: "CCA" });

    const search = req.query.search;
    const club = req.query.club;

    if (search) {
      ccaEvents = ccaEvents.filter(event =>
        event.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (club && club !== "All") {
      ccaEvents = ccaEvents.filter(event =>
        event.clubType === club
      );
    }

    res.render("ccaEvents", {
      events: ccaEvents,
      search: search || "",
      club: club || "All"
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading CCA events");
  }
};



// Event Detail Page
exports.getEventDetail = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.send("Invalid event ID");
    }

    const eventId = new mongoose.Types.ObjectId(req.params.id);

    const event = await Event.findById(eventId);

    if (!event) {
      return res.send("Event not found");
    }

    const { studentId } = req.query; // 🔥 FIXED

    const registration = await RSVP.findOne({ eventId, studentId });

    res.render("eventDetail", {
      event,
      registered: registration ? true : false
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading event detail");
  }
};



// Show Registration Form
exports.showRegisterForm = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.send("Invalid event ID");
    }

    const eventId = new mongoose.Types.ObjectId(req.params.id);

    const event = await Event.findById(eventId);

    if (!event) {
      return res.send("Event not found");
    }

    const { studentId } = req.query; // 🔥 FIXED

    const registration = await RSVP.findOne({ eventId, studentId });

    res.render("registerEvent", {
      event,
      registered: registration ? true : false
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading registration form");
  }
};



// Register Event
exports.registerEvent = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.send("Invalid event ID");
    }

    const eventId = new mongoose.Types.ObjectId(req.params.id);
    const { name, studentId, email } = req.body;

    const existing = await RSVP.findOne({ eventId, studentId });

    if (existing) {
      return res.redirect("/events/my-events");
    }

    const newRegistration = new RSVP({
      eventId,
      name,
      studentId,
      email,
      rsvp: false
    });

    await newRegistration.save();

    res.render("registrationSuccess", {
      name,
      studentId,
      email
    });

  } catch (err) {
    console.error(err);
    res.send("Error registering event");
  }
};



// My Registered Events Page
exports.getMyEvents = async (req, res) => {
  try {
    const registrations = await RSVP.find().populate("eventId");

    const myEvents = registrations.map(reg => {
      return reg.eventId ? {
        ...reg.eventId.toObject(),
        rsvp: reg.rsvp
      } : null;
    }).filter(Boolean);

    res.render("myEvents", { events: myEvents });

  } catch (err) {
    console.error(err);
    res.send("Error loading my events");
  }
};



// RSVP Confirmation
exports.rsvpEvent = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.send("Invalid event ID");
    }

    const eventId = new mongoose.Types.ObjectId(req.params.id);
    const { studentId } = req.body; // 🔥 FIXED

    const registration = await RSVP.findOne({ eventId, studentId });

    if (registration) {
      registration.rsvp = true;
      await registration.save();
    }

    res.redirect("/events/my-events");

  } catch (err) {
    console.error(err);
    res.send("Error updating RSVP");
  }
};



// Cancel RSVP
exports.cancelRsvp = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.send("Invalid event ID");
    }

    const eventId = new mongoose.Types.ObjectId(req.params.id);
    const { studentId } = req.body; // 🔥 FIXED

    const registration = await RSVP.findOne({ eventId, studentId });

    if (registration) {
      registration.rsvp = false;
      await registration.save();
    }

    res.redirect("/events/my-events");

  } catch (err) {
    console.error(err);
    res.send("Error cancelling RSVP");
  }
};