const { getAllCCA, getCCAById, getCCAByEventId } = require("../models/ccaModel");
const { getReviewsByEvent, createReview } = require("../models/ccaReviewModel");
const RSVP = require("../models/rsvpModel");
const { getUserNotifications } = require("../models/ccaNotificationModel");


// ================= CCA EVENTS LIST =================
exports.getCCAEvents = async (req, res) => {
  try {
    const search = req.query.search || "";
    const club   = req.query.club   || "All";
    const status = req.query.status || "All";
    const sort   = req.query.sort   || "default";

    const ccas = await getAllCCA();

    const userId = req.session.user?.userId;
    const today  = new Date();
    today.setHours(0, 0, 0, 0);

    let registeredEventIds = [];
    if (userId) {
      const rsvps = await RSVP.getUserRSVP(userId);
      registeredEventIds = rsvps.map(r => r.event.toString());
    }

    let notifications = [];
    if (userId) {
      notifications = await getUserNotifications(userId);
    }

    const filtered = ccas
      // FIX: apply club filter properly
      .filter(cca => {
        if (club !== "All" && cca.clubType !== club) return false;
        return true;
      })
      .map(cca => {
        const event = cca.eventId;
        if (!event) return null;

        // search filter
        if (!event.title.toLowerCase().includes(search.toLowerCase())) return null;

        const start = new Date(cca.startDate);
        const end   = new Date(cca.endDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        // status filter
        let eventStatus = "N/A";
        if (today < start) eventStatus = "Upcoming";
        else if (today >= start && today <= end) eventStatus = "Ongoing";
        else eventStatus = "Past";

        if (status !== "All" && eventStatus !== status) return null;

        const registered = registeredEventIds.includes(event._id.toString());

        const latestNoti = notifications.find(n =>
          n.eventId?.toString() === event._id.toString()
        );

        return { 
          ...cca.toObject(), 
          registered, 
          eventDate: start, 
          eventStatus,
          latestNoti 
        };

      })
      .filter(Boolean);

    // sorting
    filtered.sort((a, b) => {
      const dA = a.eventDate || new Date(0);
      const dB = b.eventDate || new Date(0);
      if (sort === "newest") return dB - dA;
      if (sort === "oldest") return dA - dB;
      return 0;
    });

    res.render("khin/ccaEvents", {
      events: filtered,
      search, club, status, sort,
      user: req.session.user
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
};


// ================= MY EVENTS =================
exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.session.user?.userId;

    const rsvps  = await RSVP.getUserRSVP(userId);
    const eventIds = rsvps.map(r => r.event.toString());

    const ccas = await getAllCCA();

    const filtered = ccas.filter(c =>
      eventIds.includes(c.eventId._id.toString())
    );

    res.render("khin/myCcaEvents", {
      events: filtered,
      user: req.session.user
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
};


// ================= EVENT DETAIL =================
exports.getEventDetail = async (req, res) => {
  try {
    // FIX: use eventId instead of CCA _id
    const cca = await getCCAByEventId(req.params.id);
    if (!cca) return res.status(404).send("Event not found");

    const event  = cca.eventId;
    const userId = req.session.user?.userId;

    const rsvp           = userId ? await RSVP.isAlreadyRsvp(req.params.id, userId) : null;
    const confirmedCount = await RSVP.getDocCount(req.params.id, 'confirmed');
    const waitlistCount  = await RSVP.getDocCount(req.params.id, 'waitlist');

    const reviews = await getReviewsByEvent(cca._id);

    const hasReviewed = userId
      ? reviews.some(r => r.userId === userId)
      : false;

    res.render("khin/ccaEventDetails", {
      event,
      cca,
      registered: rsvp?.status || null,
      confirmedCount,
      waitlistCount,
      reviews,
      hasReviewed,
      user: req.session.user
    });

  } catch (error) {
    res.status(500).send(error.message);
  }
};


// ================= SUBMIT REVIEW =================
exports.submitReview = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect("/login");

    // FIX: use eventId
    const cca = await getCCAByEventId(req.params.id);
    if (!cca) return res.status(404).send("Event not found");

    await createReview({
      userId: req.session.user.userId,
      name: req.session.user.username,
      eventId: cca._id,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    res.redirect(`/cca-events/${req.params.id}`);

  } catch (err) {
    if (err.code === 11000) return res.send("You already reviewed this event");
    res.status(500).send(err.message);
  }
};


// ================= VIEW NOTIFICATIONS =================
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.session.user.userId;

    const notifications = await getUserNotifications(userId);

    res.render("khin/ccaNoti", {
      notifications,
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading notifications");
  }
};


// ================= SHOW EDIT REVIEW FORM =================
exports.showEditReviewForm = async (req, res) => {
  try {
    const Review = require("../models/ccaReviewModel").CCAReview;

    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).send("Review not found");

    if (review.userId !== req.session.user.userId) {
      return res.status(403).send("Unauthorized");
    }

    res.render("khin/editReview", { review, user: req.session.user });

  } catch (err) {
    res.status(500).send(err.message);
  }
};


// ================= UPDATE REVIEW =================
exports.updateReview = async (req, res) => {
  try {
    const Review = require("../models/ccaReviewModel").CCAReview;

    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).send("Review not found");

    if (review.userId !== req.session.user.userId) {
      return res.status(403).send("Unauthorized");
    }

    review.rating  = req.body.rating;
    review.comment = req.body.comment;
    await review.save();

    const cca = await getCCAById(review.eventId);
    res.redirect(`/cca-events/${cca.eventId}`);

  } catch (err) {
    res.status(500).send(err.message);
  }
};


// ================= DELETE REVIEW =================
exports.deleteReview = async (req, res) => {
  try {
    const Review = require("../models/ccaReviewModel").CCAReview;

    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).send("Review not found");

    if (review.userId !== req.session.user.userId) {
      return res.status(403).send("Unauthorized");
    }

    const cca = await getCCAById(review.eventId);

    await Review.findByIdAndDelete(req.params.reviewId);

    res.redirect(`/cca-events/${cca.eventId}`);

  } catch (err) {
    res.status(500).send(err.message);
  }
};