const CCA = require("../models/CCA");
const Event = require("../models/eventModel");
const Review = require("../models/CCAReview");
const User = require("../models/user-model");

const RSVP = require("../models/rsvpModel");
const mongoose = require("mongoose");

const RSVPModel = mongoose.model("RSVP");

// ================= VIEW ALL =================
exports.getAllEvents = async (req, res) => {
  try {
    const search = req.query.search || "";
    const club = req.query.club || "All";
    const status = req.query.status || "All";
    const sort = req.query.sort || "default";

    let query = {};
    if (club !== "All") {
      query.clubType = club;
    }

    const ccas = await CCA.find(query).populate("eventId");
    const today = new Date();

    const filtered = ccas
      .map((cca) => {
        const event = cca.eventId;
        if (!event) return null;

        const title = event.title || "";
        if (!title.toLowerCase().includes(search.toLowerCase())) return null;

        let eventDate = event.startDate ? new Date(event.startDate) : null;

        let eventStatus = "N/A";
        if (eventDate && !isNaN(eventDate)) {
          if (eventDate > today) eventStatus = "Upcoming";
          else if (eventDate.toDateString() === today.toDateString()) eventStatus = "Ongoing";
          else eventStatus = "Past";
        }

        if (status !== "All" && eventStatus !== status) return null;

        return {
          ...cca.toObject(),
          eventDate
        };
      })
      .filter(e => e !== null);

    const sortedEvents = filtered.sort((a, b) => {
      const dateA = a.eventDate || new Date(0);
      const dateB = b.eventDate || new Date(0);

      if (sort === "newest") return dateB - dateA;
      if (sort === "oldest") return dateA - dateB;

      return 0;
    });

    res.render("khin/adminCcaList", {
      events: sortedEvents,
      search,
      club,
      status,
      sort,
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading events");
  }
};


// ================= CREATE FORM =================
exports.showCreateForm = (req, res) => {
  res.render("khin/ccaCreate", {
    user: req.session.user
  });
};


// ================= CREATE EVENT =================
exports.createEvent = async (req, res) => {
  try {

    // Event WITHOUT image
    const newEvent = await Event.create({
      title: req.body.title,
      organizer: req.body.organizer,
      category: "CCA",
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      description: req.body.description
    });

    // CCA WITH image
    await CCA.create({
      eventId: newEvent._id,
      title: req.body.title,
      organizer: req.body.organizer,
      category: "CCA",
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,

      image: req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype
          }
        : undefined,

      clubType: req.body.clubType,
      capacity: req.body.capacity || 0
    });

    res.redirect("/cca-events/ccaAdmin");

  } catch (err) {
    console.error(err);
    res.send("Error creating event");
  }
};


// ================= EDIT FORM =================
exports.showEditForm = async (req, res) => {
  try {
    const cca = await CCA.findById(req.params.id).populate("eventId");

    res.render("khin/ccaEdit", {
      cca,
      event: cca.eventId,
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading event");
  }
};


// ================= UPDATE =================
exports.updateEvent = async (req, res) => {
  try {
    const cca = await CCA.findById(req.params.id).populate("eventId");
    if (!cca) return res.send("CCA event not found");

    const oldEvent = cca.eventId;

    const CCANotification = require("../models/CCANotification");
    const rsvps = await RSVPModel.find({ event: cca.eventId._id });

    // ================= CREATE HELPER FUNCTION =================
    const createNotifications = async (field, oldVal, newVal) => {
      for (let r of rsvps) {
        await CCANotification.create({
          userId: r.user,
          eventId: cca.eventId._id,
          eventTitle: oldEvent.title,
          field,
          oldValue: oldVal != null ? oldVal.toString() : "",
          newValue: newVal != null ? newVal.toString() : ""
        });
      }
    };

    // ================= DETECT CHANGES =================

    // LOCATION
    if (oldEvent.location.trim() !== req.body.location.trim()) {
      await createNotifications("location", oldEvent.location, req.body.location);
    }

    // START DATE
    if (
      new Date(oldEvent.startDate).toISOString() !==
      new Date(req.body.startDate).toISOString()
    ) {
      await createNotifications(
        "startDate",
        new Date(oldEvent.startDate).toLocaleDateString(),
        new Date(req.body.startDate).toLocaleDateString()
      );
    }

    // END DATE
    if (
      new Date(oldEvent.endDate).toISOString() !==
      new Date(req.body.endDate).toISOString()
    ) {
      await createNotifications(
        "endDate",
        new Date(oldEvent.endDate).toLocaleDateString(),
        new Date(req.body.endDate).toLocaleDateString()
      );
    }

    // CAPACITY
    if (cca.capacity !== Number(req.body.capacity)) {
      await createNotifications(
        "capacity",
        cca.capacity,
        req.body.capacity
      );
    }

    // ================= UPDATE DATA =================

    const updateEventData = {
      title: req.body.title,
      organizer: req.body.organizer,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      description: req.body.description
    };

    await Event.updateById(cca.eventId._id, updateEventData);

    await CCA.findByIdAndUpdate(req.params.id, {
      ...updateEventData,
      clubType: req.body.clubType,
      capacity: req.body.capacity || 0,

      ...(req.file && {
        image: {
          data: req.file.buffer,
          contentType: req.file.mimetype
        }
      })
    });

    res.redirect("/cca-events/ccaAdmin");

  } catch (err) {
    console.error(err);
    res.send("Error updating event");
  }
};

// ================= DELETE =================
exports.deleteEvent = async (req, res) => {
  try {
    const cca = await CCA.findById(req.params.id).populate("eventId");

    await Event.deleteById(cca.eventId._id);
    await CCA.findByIdAndDelete(req.params.id);

    res.redirect("/cca-events/ccaAdmin");

  } catch (err) {
    console.error(err);
    res.send("Error deleting event");
  }
};


// ================= ATTENDEES =================
exports.getAttendees = async (req, res) => {
  try {
    const eventId = req.params.id;

    const cca = await CCA.findById(eventId);
    const event = await Event.findById(cca.eventId);

    const confirmed = await RSVPModel.find({
      event: event._id,
      status: "confirmed"
    });

    const waitlist = await RSVP.getWaitlist(event._id);

    const userIds = [
      ...confirmed.map(r => r.user),
      ...waitlist.map(r => r.user)
    ];

    const users = await User.find({ userId: { $in: userIds } });

    const userMap = {};
    users.forEach(u => {
      userMap[u.userId] = u;
    });

    res.render("khin/ccaAttendees", {
      event,
      confirmed,
      waitlist,
      userMap,
      capacity: cca.capacity
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading attendees");
  }
};


// ================= VIEW REVIEWS =================
exports.getReviewsByEvent = async (req, res) => {
  try {
    const cca = await CCA.findById(req.params.id).populate("eventId");

    if (!cca) return res.send("Event not found");

    const reviews = await Review.find({ eventId: cca._id })
      .sort({ createdAt: -1 });

    res.render("khin/adminCcaReviews", {
      event: cca.eventId,
      reviews,
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading reviews");
  }
};

