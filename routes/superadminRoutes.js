const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');

// List admins
router.get('/admins-settings', superadminController.listAdmins);

// Edit admin
router.get('/admins-settings/edit/:id', superadminController.editAdminGet);
router.post('/admins-settings/edit/:id', superadminController.editAdminPost);

// Delete admin (AJAX endpoint)
router.post('/admins-settings/delete/:id', superadminController.deleteAdmin);

module.exports = router;
