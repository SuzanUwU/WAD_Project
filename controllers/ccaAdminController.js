const CCA = require("../models/CCA");
const Event = require("../models/eventModel");
const Registration = require("../models/CCARegistration");
const User = require("../models/user-model");
const Review = require("../models/CCAReview");

// SendGrid Email function
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, text) {
  try {
    console.log("Sending email to:", to);

    await sgMail.send({
      to,
      from: {
        email: process.env.EMAIL_FROM,
        name: "SMU CCA Event System"
      },

      // email subject
      subject: `SMU Event Update: ${subject}`,

      text: text,

      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          
          <h2 style="color:#4CAF50;">SMU CCA Event Notification</h2>

          <p>Hello,</p>

          <p>${text}</p>

          <hr style="margin:20px 0;">

          <p style="font-size:14px; color:#555;">
            This is an official notification from the SMU Campus Event System.
          </p>

          <p style="font-size:14px;">
            Regards,<br>
            <b>SMU CCA Event Team</b>
          </p>

        </div>
      `
    });

    console.log("Email sent successfully!");

  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
  }
}

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

        // SEARCH
        const title = event.title || "";
        if (!title.toLowerCase().includes(search.toLowerCase())) return null;

        // DATE
        let eventDate = event.startDate ? new Date(event.startDate) : null;

        // STATUS
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

    // SORT
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
    const newEvent = await Event.create({
      title: req.body.title,
      organizer: req.body.organizer,
      category: "CCA",
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      description: req.body.description,
      image: req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype
          }
        : undefined
    });

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

    const oldEvent = cca.eventId;

    const updateEventData = {
      title: req.body.title,
      organizer: req.body.organizer,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      description: req.body.description
    };

    if (req.file) {
      updateEventData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    // ================= CHECK CHANGES =================
    const isDateChanged =
      new Date(req.body.startDate).toISOString() !== new Date(oldEvent.startDate).toISOString() ||
      new Date(req.body.endDate).toISOString() !== new Date(oldEvent.endDate).toISOString();

    const isLocationChanged =
      req.body.location !== oldEvent.location;

    const isCapacityChanged =
      req.body.capacity != cca.capacity;
    // =================================================

    // update Event collection
    await Event.updateById(cca.eventId._id, updateEventData);

    // update CCA collection
    await CCA.findByIdAndUpdate(req.params.id, {
      ...updateEventData,
      clubType: req.body.clubType,
      capacity: req.body.capacity || 0
    });

    // ================= SEND EMAIL (ONLY IF IMPORTANT) =================
    if (isDateChanged || isLocationChanged || isCapacityChanged) {
      console.log("IMPORTANT CHANGE DETECTED");
      const registrations = await Registration.find({
        eventId: cca._id
      });

      console.log("Registrations found:", registrations.length);

      for (let r of registrations) {
        const user = await User.findOne({ userId: r.userId });

        if (user && user.email) {

          // temporary testing
          // let emailToSend = user.email;

          // if (emailToSend.endsWith("@computing.smu.edu.sg")) {
          //   emailToSend = "byunlyra@gmail.com";
          // }

          const emailToSend = user.email;

          await sendEmail(
            emailToSend,
            req.body.title,
            `The event "${req.body.title}" has been updated.

          New Date: ${req.body.startDate}
          Location: ${req.body.location}

          Please check the system for full details.`
          );

        }
      }
    }
    // =================================================================

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

    // get all registered users
    const registrations = await Registration.find({
      eventId: cca._id
    });

    for (let r of registrations) {
      const user = await User.findOne({ userId: r.userId });

      if (user && user.email) {
        
        let emailToSend = user.email;

        if (emailToSend.endsWith("@computing.smu.edu.sg")) {
          emailToSend = "byunlyra@gmail.com";
        }

        await sendEmail(
          emailToSend,
          "Event Cancelled",
          `The event "${cca.eventId.title}" has been cancelled.`
        );
      }
    }

    await Event.updateById(cca.eventId);
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
    const cca = await CCA.findById(req.params.id).populate("eventId");

    const registrations = await Registration.find({
      eventId: cca._id
    });

    const attendees = await Promise.all(
      registrations.map(async (r) => {
        const user = await User.findOne({ userId: r.userId });

        return {
          userId: user || null
        };
      })
    );

    res.render("khin/attendees", {
      event: cca.eventId,
      attendees,
      user: req.session.user,
      capacity: cca.capacity
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading attendees");
  }
};

// ================= VIEW REVIEWS per EVENT =================
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