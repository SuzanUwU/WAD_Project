const express = require("express");

const router = express.Router();

const ccaController = require("../controllers/ccaController");

router.get("/cca", ccaController.getCCAEvents);

router.get("/my-events", ccaController.getMyEvents);

router.get("/:id/register", ccaController.showRegisterForm);

router.post("/:id/register", ccaController.registerEvent);

router.post("/:id/rsvp", ccaController.rsvpEvent);

router.post("/:id/cancel-rsvp", ccaController.cancelRsvp);

router.get("/:id", ccaController.getEventDetail);

module.exports = router;