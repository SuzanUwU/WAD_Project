const CCAmodel = require("../models/ccaModel");
const Event = require("../models/eventModel");
const ReviewModel = require("../models/ccaReviewModel");
const NotificationModel = require("../models/ccaNotificationModel");

const RSVP = require("../models/rsvpModel");
const User = require("../models/userModel");


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

    const ccas = await CCAmodel.getAllCCA(query);

    const today = new Date();
    today.setHours(0,0,0,0);

    const filtered = ccas
      .map((cca) => {
        const event = cca.eventId;
        if (!event) return null;

        if (!event.title.toLowerCase().includes(search.toLowerCase())) return null;

        const start = new Date(cca.startDate);
        const end   = new Date(cca.endDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        let eventStatus = "N/A";
        if (today < start) eventStatus = "Upcoming";
        else if (today >= start && today <= end) eventStatus = "Ongoing";
        else eventStatus = "Past";

        if (status !== "All" && eventStatus !== status) return null;

        return {
          ...cca.toObject(),
          eventDate: start
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
    user: req.session.user,
    errors: {},
    formData: {} 
  });
};


// ================= CREATE =================
exports.createEvent = async (req, res) => {
  try {

    const errors = {};

    if (!req.body.title || req.body.title.trim() === "") {
      errors.title = "Title is required";
    }

    if (!req.body.organizer || req.body.organizer.trim() === "") {
      errors.organizer = "Organizer is required";
    }

    if (!req.body.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!req.body.endDate) {
      errors.endDate = "End date is required";
    }

    if (
      req.body.startDate &&
      req.body.endDate &&
      new Date(req.body.endDate) < new Date(req.body.startDate)
    ) {
      errors.endDate = "End date must be after start date";
    }

    if (!req.body.clubType) {
      errors.clubType = "Please select a club type";
    }

    if (
      req.body.deadline &&
      !errors.deadline && 
      req.body.startDate &&
      new Date(req.body.deadline) > new Date(req.body.startDate)
    ) {
      errors.deadline = "Deadline must be before event start date";
    }

    if (req.body.capacity && req.body.capacity < 1) {
      errors.capacity = "Capacity must be at least 1";
    }

    // if got errors → render back
    if (Object.keys(errors).length > 0) {
      return res.render("khin/ccaCreate", {
        user: req.session.user,
        errors,
        formData: req.body   // keep user input
      });
    }

    // CREATE EVENT
    const newEvent = await Event.create({
      title: req.body.title,
      organizer: req.body.organizer,
      category: "CCA",
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      description: req.body.description,
      image: req.body.image || "placeholder.jpg"
    });

    // CREATE CCA
    await CCAmodel.createCCA({
      eventId: newEvent._id,
      title: req.body.title,
      organizer: req.body.organizer,
      category: "CCA",
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      clubType: req.body.clubType,
      capacity: req.body.capacity || 0,
      image: req.body.image || "placeholder.jpg",
      registrationDeadline: req.body.deadline || null
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
    const cca = await CCAmodel.getCCAById(req.params.id);

    res.render("khin/ccaEdit", {
      cca,
      event: cca.eventId,
      user: req.session.user,
      errors: {}
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading event");
  }
};

// =================  UPDATE CCA EVENT =================
exports.updateEvent = async (req, res) => {
  try {

    // get current event
    const cca = await CCAmodel.getCCAById(req.params.id);

    if (!cca || !cca.eventId) {
      return res.send("CCA event not found properly");
    }

    // ================= VALIDATION =================
    const errors = {};

    if (!req.body.title || req.body.title.trim() === "") {
      errors.title = "Title is required";
    }

    if (!req.body.organizer || req.body.organizer.trim() === "") {
      errors.organizer = "Organizer is required";
    }

    if (!req.body.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!req.body.endDate) {
      errors.endDate = "End date is required";
    }

    if (
      req.body.deadline &&
      !errors.deadline && 
      req.body.startDate &&
      new Date(req.body.deadline) > new Date(req.body.startDate)
    ) {
      errors.deadline = "Deadline must be before event start date";
    }

    if (!req.body.clubType) {
      errors.clubType = "Please select a club type";
    }

    if (req.body.capacity && req.body.capacity < 1) {
      errors.capacity = "Capacity must be at least 1";
    }

    if (
      req.body.deadline &&
      req.body.startDate &&
      new Date(req.body.deadline) > new Date(req.body.startDate)
    ) {
      errors.deadline = "Deadline must be before event start date";
    }

    // ================= IF ERROR =================
    if (Object.keys(errors).length > 0) {

      const formData = {
        ...cca.toObject(),
        ...req.body
      };

      return res.render("khin/ccaEdit", {
        cca: formData,
        event: cca.eventId,
        user: req.session.user,
        errors
      });
    }

    // ================= NORMAL UPDATE FLOW =================

    const oldEvent = cca.eventId;
    const eventId = oldEvent._id;

    const rsvps = await RSVP.getByEvent(eventId);

    const createNotifications = async (field, oldVal, newVal) => {
      for (let r of rsvps) {
        await NotificationModel.createNotification({
          userId: r.user,
          eventId: eventId,
          eventTitle: oldEvent.title,
          field,
          oldValue: oldVal != null ? oldVal.toString() : "",
          newValue: newVal != null ? newVal.toString() : ""
        });
      }
    };

    // check changes
    if ((oldEvent.location || "") !== (req.body.location || "")) {
      await createNotifications("location", oldEvent.location, req.body.location);
    }

    if (cca.capacity !== Number(req.body.capacity)) {
      await createNotifications("capacity", cca.capacity, req.body.capacity);
    }

    // update Event
    await Event.updateById(eventId, {
      title: req.body.title,
      organizer: req.body.organizer,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      description: req.body.description,
      image: req.body.image ? req.body.image : cca.image
    });

    // update CCA
    await CCAmodel.updateCCA(req.params.id, {
      title: req.body.title,
      organizer: req.body.organizer,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      description: req.body.description,
      clubType: req.body.clubType,
      capacity: req.body.capacity || 0,
      image: req.body.image ? req.body.image : cca.image,
      registrationDeadline: req.body.deadline ? req.body.deadline : cca.registrationDeadline
    });

    res.redirect("/cca-events/ccaAdmin");

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.send("Error updating event");
  }
};

// ================= DELETE =================
exports.deleteEvent = async (req, res) => {
  try {
    const cca = await CCAmodel.getCCAById(req.params.id);

    if (!cca || !cca.eventId) {
      return res.send("Event not found");
    }

    const eventId = cca.eventId._id;

    await Event.deleteById(eventId);

    await CCAmodel.deleteCCA(req.params.id);

    await RSVP.deleteByEventId(eventId);

    res.redirect("/cca-events/ccaAdmin");

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.send("Error deleting event");
  }
};


// ================= ATTENDEES =================
exports.getAttendees = async (req, res) => {
  try {
    const cca = await CCAmodel.getCCAById(req.params.id);
    const event = cca.eventId;

    const confirmed = await RSVP.getConfirmed(event._id);

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


// ================= REVIEWS =================
exports.getReviewsByEvent = async (req, res) => {
  try {
    const cca = await CCAmodel.getCCAById(req.params.id);

    const reviews = await ReviewModel.getReviewsByEvent(cca._id);

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