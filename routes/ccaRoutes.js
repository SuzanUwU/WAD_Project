const express = require("express");
const router = express.Router();

const ccaController = require("../controllers/ccaController");
const ccaAdminController = require("../controllers/ccaAdminController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });


// ================= USER ROUTES =================
router.get("/cca", ccaController.getCCAEvents); // to display all events for each category
    // cca-events
    // hack-events
    // ptjob-events
    // career-events

router.get("/my-events", ccaController.getMyEvents); 
// change to my-cca-events

router.get("/:id/register", ccaController.showRegisterForm); // "/:id/cca-register"
// "/:id/hack-register, career-register, ptjob-register"
router.post("/:id/register", ccaController.registerEvent);

router.post("/:id/rsvp", ccaController.rsvpEvent); // delete for Khin
router.post("/:id/cancel-rsvp", ccaController.cancelRsvp); // delete


// ================= ADMIN ROUTES =================
router.get("/ccaAdmin", ccaAdminController.getAllEvents); 

router.get("/ccaAdmin/create", ccaAdminController.showCreateForm);
router.post("/ccaAdmin/create", upload.single("image"), ccaAdminController.createEvent);

router.get("/ccaAdmin/:id/edit", ccaAdminController.showEditForm);
router.post("/ccaAdmin/:id/edit", upload.single("image"), ccaAdminController.updateEvent);

router.post("/ccaAdmin/delete/:id", ccaAdminController.deleteEvent);

router.get("/ccaAdmin/:id/attendees", ccaAdminController.getAttendees);


// ================= EVENT DETAIL =================
router.get("/:id", ccaController.getEventDetail);

router.get("/:id/review", ccaController.showReviewForm); // cca-review
router.post("/:id/review", ccaController.submitReview);


module.exports = router;