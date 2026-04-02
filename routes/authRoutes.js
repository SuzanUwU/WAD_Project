const express = require('express');
const User = require('../models/user-model');
const authController = require('../controllers/authController'); 
const settingsController = require('../controllers/usersettingsController');
const router = express.Router();

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/signup', upload.none(), authController.signup);
router.post('/login', authController.login);

router.get('/signup', authController.renderSignup);
router.get('/login', authController.renderLogin);

router.get('/usersettings', settingsController.renderSettings);

router.post('/usersettings/profile', settingsController.updateProfile);
router.post('/usersettings/password', settingsController.updatePassword);
router.post('/usersettings/delete', settingsController.deleteAccount);

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/all-events');
  });
});

module.exports = router;