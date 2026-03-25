const express = require('express');
const User = require('../models/user-model');
const authController = require('../controllers/authController'); // added by John 21 March
const router = express.Router();

// Expecting POST requests because we are sending sensitive form data
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// // GET requests to display the EJS pages
router.get('/signup', authController.renderSignup);
router.get('/login', authController.renderLogin);

// ✅ NEW LOGOUT ROUTE
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/all-events');
  });
});

module.exports = router;
