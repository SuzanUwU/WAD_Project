const express = require("express");
const router = express.Router();

const ccaController = require("../controllers/ccaController");
const ccaAdminController = require("../controllers/ccaAdminController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });


// ================= USER ROUTES =================
router.get("/cca", ccaController.getCCAEvents);

router.get("/my-events", ccaController.getMyEvents);

router.get("/:id/register", ccaController.showRegisterForm);
router.post("/:id/register", ccaController.registerEvent);

router.post("/:id/rsvp", ccaController.rsvpEvent);
router.post("/:id/cancel-rsvp", ccaController.cancelRsvp);


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

router.get("/:id/review", ccaController.showReviewForm);
router.post("/:id/review", ccaController.submitReview);


module.exports = router;