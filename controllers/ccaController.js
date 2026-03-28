const CCA = require("../models/CCA");
const Registration = require("../models/CCARegistration");
const Review = require("../models/CCAReview");


// ================= CCA EVENTS LIST =================
exports.getCCAEvents = async (req, res) => {
  try {
    const search = req.query.search || "";
    const club = req.query.club || "All";
    const status = req.query.status || "All";
    const sort = req.query.sort || "default";

    let query = {};
    if (club !== "All") query.clubType = club;

    const ccas = await CCA.find(query).populate("eventId");

    const userId = req.session.user?.userId;
    const today = new Date();

    let registeredEventIds = [];

    if (userId) {
      const registrations = await Registration.find({ userId });
      registeredEventIds = registrations.map(r => r.eventId.toString());
    }

    const filtered = ccas
      .map((cca) => {
        const event = cca.eventId;
        if (!event) return null;

        const title = event.title || "";
        if (!title.toLowerCase().includes(search.toLowerCase())) return null;

        let eventDate = event.startDate ? new Date(event.startDate) : null;

        let eventStatus = "N/A";
        if (eventDate) {
          if (eventDate > today) eventStatus = "Upcoming";
          else if (eventDate.toDateString() === today.toDateString()) eventStatus = "Ongoing";
          else eventStatus = "Past";
        }

        if (status !== "All" && eventStatus !== status) return null;

        const registered = registeredEventIds.includes(cca._id.toString());

        return { ...cca.toObject(), registered, eventDate };
      })
      .filter(e => e !== null);

    const sortedEvents = filtered.sort((a, b) => {
      const dateA = a.eventDate || new Date(0);
      const dateB = b.eventDate || new Date(0);

      if (sort === "newest") return dateB - dateA;
      if (sort === "oldest") return dateA - dateB;
      return 0;
    });

    res.render("khin/ccaEvents", {
      events: sortedEvents,
      search,
      club,
      status,
      sort,
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading CCA events");
  }
};



// ================= SHOW REGISTER FORM =================
exports.showRegisterForm = async (req, res) => {
  try {
    // 🔥 FIX: find using eventId (NOT _id)
    const cca = await CCA.findOne({ eventId: req.params.id }).populate("eventId");

    if (!cca || !cca.eventId) {
      return res.send("Event not found");
    }

    const userId = req.session.user?.userId;

    const registration = await Registration.findOne({
      eventId: cca._id,
      userId
    });

    res.render("khin/ccaRegister", {
      event: cca.eventId,
      cca,
      registered: !!registration,
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading registration form");
  }
};



// ================= REGISTER EVENT =================
exports.registerEvent = async (req, res) => {
  try {
    // 🔥 FIX HERE
    const cca = await CCA.findOne({ eventId: req.params.id });

    if (!cca) return res.send("Event not found");

    const userId = req.session.user?.userId;

    const existing = await Registration.findOne({
      eventId: cca._id,
      userId
    });

    if (existing) return res.redirect(`/cca-events/${req.params.id}`);

    await Registration.create({
      eventId: cca._id,
      userId
    });

    res.redirect(`/cca-events/${req.params.id}`);

  } catch (err) {
    console.error(err);
    res.send("Error registering event");
  }
};



// ================= MY EVENTS =================
exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.session.user?.userId;

    const registrations = await Registration.find({ userId });
    const eventIds = registrations.map(r => r.eventId);

    const events = await CCA.find({ _id: { $in: eventIds } });

    res.render("khin/myCcaEvents", {
      events,
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading my events");
  }
};



// ================= EVENT DETAIL =================
exports.getEventDetail = async (req, res) => {
  try {
    // 🔥 FIX HERE
    const cca = await CCA.findOne({ eventId: req.params.id }).populate("eventId");
    const editingReviewId = req.query.edit || null;

    if (!cca) return res.send("Event not found");

    const event = cca.eventId;
    const userId = req.session.user?.userId;

    let registered = false;
    if (userId) {
      const reg = await Registration.findOne({
        eventId: cca._id,
        userId
      });
      registered = !!reg;
    }

    let hasReviewed = false;
    if (userId) {
      const existingReview = await Review.findOne({
        eventId: cca._id,
        userId
      });
      hasReviewed = !!existingReview;
    }

    const reviews = await Review.find({ eventId: cca._id }).sort({ createdAt: -1 });

    res.render("khin/ccaEventDetails", {
      event,
      cca,
      registered,
      reviews,
      hasReviewed,
      user: req.session.user,
      editingReviewId
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading event detail");
  }
};



// ================= SUBMIT REVIEW =================
exports.submitReview = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) return res.redirect("/login");

    const cca = await CCA.findOne({ eventId: req.params.id });

    if (!cca) return res.send("Event not found");

    const { rating, comment } = req.body;

    await Review.create({
      userId: user.userId,
      name: user.username,
      eventId: cca._id,
      rating,
      comment
    });

    res.redirect(`/cca-events/${req.params.id}`);

  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.send("You already reviewed this event");
    }

    res.send("Error submitting review");
  }
};


// ================= SHOW EDIT REVIEW FORM =================
exports.showEditReviewForm = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) return res.send("Review not found");

    // 🔥 check owner
    if (review.userId !== req.session.user.userId) {
      return res.send("Unauthorized");
    }

    res.render("khin/editReview", { review, user: req.session.user });

  } catch (err) {
    console.error(err);
    res.send("Error loading edit form");
  }
};



// ================= UPDATE REVIEW =================
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) return res.send("Review not found");

    if (review.userId !== req.session.user.userId) {
      return res.send("Unauthorized");
    }

    review.rating = req.body.rating;
    review.comment = req.body.comment;

    await review.save();

    const cca = await CCA.findById(review.eventId);

    res.redirect(`/cca-events/${cca.eventId}`);

  } catch (err) {
    console.error(err);
    res.send("Error updating review");
  }
};


// ================= DELETE REVIEW =================
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) return res.send("Review not found");

    if (review.userId !== req.session.user.userId) {
      return res.send("Unauthorized");
    }

    const cca = await CCA.findById(review.eventId);

    await Review.findByIdAndDelete(req.params.reviewId);

    res.redirect(`/cca-events/${cca.eventId}`);

  } catch (err) {
    console.error(err);
    res.send("Error deleting review");
  }
};