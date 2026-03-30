const CCA    = require("../models/CCA");
const Review = require("../models/CCAReview");
const RSVP   = require("../models/rsvpModel");

// ================= CCA EVENTS LIST =================
exports.getCCAEvents = async (req, res) => {
  try {
    const search = req.query.search || "";
    const club   = req.query.club   || "All";
    const status = req.query.status || "All";
    const sort   = req.query.sort   || "default";

    const query = {};
    if (club !== "All") query.clubType = club;

    const ccas   = await CCA.find(query).populate("eventId");
    const userId = req.session.user?.userId;
    const today  = new Date();
    today.setHours(0, 0, 0, 0);

    let registeredEventIds = [];
    if (userId) {
      const rsvps = await RSVP.getUserRSVP(userId);
      registeredEventIds = rsvps.map(r => r.event.toString()); // Event _id strings
    }

    const filtered = ccas.map(cca => {
      const event = cca.eventId;
      if (!event) return null;

      if (!event.title.toLowerCase().includes(search.toLowerCase())) return null;

      const start = cca.startDate ? new Date(cca.startDate) : new Date(event.startDate);
      const end   = cca.endDate   ? new Date(cca.endDate)   : new Date(event.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      let eventStatus = "N/A";
      if (!isNaN(start)) {
        if (today < start)                       eventStatus = "Upcoming";
        else if (today >= start && today <= end) eventStatus = "Ongoing";
        else                                     eventStatus = "Past";
      }

      if (status !== "All" && eventStatus !== status) return null;

      const registered = registeredEventIds.includes(event._id.toString()); // ← Event _id

      return { ...cca.toObject(), registered, eventDate: start, eventStatus };
    }).filter(Boolean);

    filtered.sort((a, b) => {
      const dA = a.eventDate || new Date(0);
      const dB = b.eventDate || new Date(0);
      if (sort === "newest") return dB - dA;
      if (sort === "oldest") return dA - dB;
      return 0;
    });

    res.render("khin/ccaEvents", { events: filtered, search, club, status, sort, user: req.session.user });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// ================= SHOW REGISTER FORM =================
exports.showRegisterForm = async (req, res) => {
  try {
    const cca = await CCA.findOne({ eventId: req.params.id }).populate("eventId");
    if (!cca?.eventId) return res.status(404).send("Event not found");

    const userId = req.session.user?.userId;
    const rsvp   = userId ? await RSVP.isAlreadyRsvp(req.params.id, userId) : null; // ← Event _id

    res.render("khin/ccaRegister", {
      event:      cca.eventId,
      cca,
      registered: !!rsvp,
      user:       req.session.user
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// ================= REGISTER EVENT =================
// Delegates to joinRsvp — just redirect to the shared RSVP join route
exports.registerEvent = async (req, res) => {
  try {
    const cca = await CCA.findOne({ eventId: req.params.id });
    if (!cca) return res.status(404).send("Event not found");
    // req.params.id is already the Event _id — forward it to joinRsvp
    req.body.eventId = req.params.id;
    return require('./profileController').joinRsvp(req, res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// ================= MY EVENTS =================
exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.session.user?.userId;
    const rsvps  = await RSVP.getUserRSVP(userId);
    const eventIds = rsvps.map(r => r.event);
    const ccas   = await CCA.find({ eventId: { $in: eventIds } }).populate("eventId");
    res.render("khin/myCcaEvents", { events: ccas, user: req.session.user });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// ================= EVENT DETAIL =================
exports.getEventDetail = async (req, res) => {
  try {
    const cca = await CCA.findOne({ eventId: req.params.id });
    if (!cca) return res.status(404).send("Event not found");

    const event      = cca.eventId;
    const userId     = req.session.user?.userId;
    const editingReviewId = req.query.edit || null;

    const rsvp           = userId ? await RSVP.isAlreadyRsvp(req.params.id, userId) : null;
    const confirmedCount = await RSVP.getDocCount(req.params.id, 'confirmed');
    const waitlistCount  = await RSVP.getDocCount(req.params.id, 'waitlist');

    const reviews = await Review.find({ eventId: cca._id }).sort({ createdAt: -1 });
    const hasReviewed = userId
      ? !!(await Review.findOne({ eventId: cca._id, userId }))
      : false;
    console.log(cca);
    res.render("khin/ccaEventDetails", {
      event,
      cca,
      registered:        rsvp?.status || null,
      confirmedCount,
      waitlistCount,
      reviews,
      hasReviewed,
      user:         req.session.user,
      editingReviewId,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// ================= SUBMIT REVIEW =================
exports.submitReview = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect("/login");

    const cca = await CCA.findOne({ eventId: req.params.id });
    if (!cca) return res.status(404).send("Event not found");

    await Review.create({
      userId:  req.session.user.userId,
      name:    req.session.user.username,
      eventId: cca._id,
      rating:  req.body.rating,
      comment: req.body.comment,
    });

    res.redirect(`/cca-events/${req.params.id}`);
  } catch (err) {
    if (err.code === 11000) return res.send("You already reviewed this event");
    res.status(500).send(err.message);
  }
};

// ================= SHOW EDIT REVIEW FORM =================
exports.showEditReviewForm = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).send("Review not found");
    if (review.userId !== req.session.user.userId) return res.status(403).send("Unauthorized");
    res.render("khin/editReview", { review, user: req.session.user });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// ================= UPDATE REVIEW =================
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).send("Review not found");
    if (review.userId !== req.session.user.userId) return res.status(403).send("Unauthorized");

    review.rating  = req.body.rating;
    review.comment = req.body.comment;
    await review.save();

    const cca = await CCA.findById(review.eventId);
    res.redirect(`/cca-events/${cca.eventId}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// ================= DELETE REVIEW =================
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).send("Review not found");
    if (review.userId !== req.session.user.userId) return res.status(403).send("Unauthorized");

    const cca = await CCA.findById(review.eventId);
    await Review.findByIdAndDelete(req.params.reviewId);
    res.redirect(`/cca-events/${cca.eventId}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
};