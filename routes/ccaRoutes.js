const express = require("express");
const router = express.Router();

const ccaController = require("../controllers/ccaController");
const ccaAdminController = require("../controllers/ccaAdminController");

const { requireLogin, requireAdmin } = require("../middleware/auth");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });


// ================= USER ROUTES =================

// Static FIRST
router.get("/cca", ccaController.getCCAEvents);
router.get("/my-cca-events", requireLogin, ccaController.getMyEvents);


// ================= REVIEW ROUTES =================
// MUST be before any /:id routes

router.get("/reviews/:reviewId/edit", requireLogin, ccaController.showEditReviewForm);
router.post("/reviews/:reviewId/edit", requireLogin, ccaController.updateReview);
router.post("/reviews/:reviewId/delete", requireLogin, ccaController.deleteReview);


// ================= ADMIN ROUTES =================
// MUST be BEFORE /:id

router.get("/ccaAdmin", requireAdmin, ccaAdminController.getAllEvents);

router.get("/ccaAdmin/create", requireAdmin, ccaAdminController.showCreateForm);
router.post("/ccaAdmin/create", requireAdmin, upload.single("image"), ccaAdminController.createEvent);

router.get("/ccaAdmin/:id/edit", requireAdmin, ccaAdminController.showEditForm);
router.post("/ccaAdmin/:id/edit", requireAdmin, upload.single("image"), ccaAdminController.updateEvent);

router.post("/ccaAdmin/delete/:id", requireAdmin, ccaAdminController.deleteEvent);

router.get("/ccaAdmin/:id/attendees", requireAdmin, ccaAdminController.getAttendees);

router.get("/ccaAdmin/:id/reviews", requireAdmin, ccaAdminController.getReviewsByEvent);

// ================= USER ACTION ROUTES =================
// These use /:id so must be AFTER review routes

router.get("/:id/cca-register", ccaController.showRegisterForm);
router.post("/:id/cca-register", requireLogin, ccaController.registerEvent);

router.post("/:id/cca-review", requireLogin, ccaController.submitReview);


// ================= GENERIC LAST =================
router.get("/:id", ccaController.getEventDetail);

module.exports = router;