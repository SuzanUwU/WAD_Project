const mongoose = require("mongoose");
const CCA = require("../models/CCA");
const RSVP = require("../models/RSVP");
const Review = require("../models/Review");

// CCA Events List
exports.getCCAEvents = async (req, res) => {
  try {
    let ccaEvents = await CCA.find({ category: "CCA" });

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

    res.render("khin/ccaEvents", {
      events: ccaEvents,
      search: search || "",
      club: club || "All"
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading CCA events");
  }
};


// Show Registration Form
exports.showRegisterForm = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.send("Invalid event ID");
    }

    const eventId = new mongoose.Types.ObjectId(req.params.id);

    const event = await CCA.findById(eventId);

    if (!event) {
      return res.send("Event not found");
    }

    const { studentId } = req.query; 

    const registration = await RSVP.findOne({ eventId, studentId });

    res.render("khin/registerEvent", {
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
      return res.redirect("/my-events");
    }

    const newRegistration = new RSVP({
      eventId,
      name,
      studentId,
      email,
      rsvp: false
    });

    await newRegistration.save();

    res.render("khin/registrationSuccess", {
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

    res.render("khin/myEvents", { events: myEvents });

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
    const { studentId } = req.body;

    const registration = await RSVP.findOne({ eventId, studentId });

    if (registration) {
      registration.rsvp = true;
      await registration.save();
    }

    res.redirect("/my-events");

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
    const { studentId } = req.body;

    const registration = await RSVP.findOne({ eventId, studentId });

    if (registration) {
      registration.rsvp = false;
      await registration.save();
    }

    res.redirect("/my-events");

  } catch (err) {
    console.error(err);
    res.send("Error cancelling RSVP");
  }
};


exports.getEventDetail = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.send("Invalid event ID");
    }

    const eventId = new mongoose.Types.ObjectId(req.params.id);

    const event = await CCA.findById(eventId);

    if (!event) {
      return res.send("Event not found");
    }

    const { studentId } = req.query;

    const registration = await RSVP.findOne({ eventId, studentId });

    const reviews = await Review.find({ eventId: req.params.id });

    res.render("khin/eventDetail", {
      event,
      registered: registration ? true : false,
      reviews,
      studentId   
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading event detail");
  }
};

exports.showReviewForm = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { studentId } = req.query;

    if (!studentId) {
      return res.send("Student ID is required.");
    }

    const registration = await RSVP.findOne({ eventId, studentId });

    if (!registration || !registration.rsvp) {
      return res.send("Only confirmed attendees can leave a review.");
    }

    res.render('khin/reviewForm', { 
      eventId,
      studentId
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading review form");
  }
};

exports.submitReview = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { studentId, name, rating, comment } = req.body;

    if (!studentId) {
      return res.send("Student ID is required.");
    }

    const registration = await RSVP.findOne({ eventId, studentId });

    if (!registration || !registration.rsvp) {
      return res.send("Only confirmed attendees can leave a review.");
    }

    const existingReview = await Review.findOne({ eventId, studentId });

    if (existingReview) {
      return res.send("You have already submitted a review.");
    }

    const newReview = new Review({
      eventId,
      studentId,
      name,
      rating,
      comment
    });

    await newReview.save();

    res.redirect(`/events/${eventId}`);

  } catch (err) {
    console.error(err);
    res.send("Error submitting review");
  }
};