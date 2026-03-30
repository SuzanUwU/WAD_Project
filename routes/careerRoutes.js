const express = require('express');

const careerController = require('../controllers/careerController');
const router = express.Router(); // sub application
const { requireCareerAdmin } = require('../middleware/auth');

// router.get('ejs',xController.renderthis)
router.get('/',careerController.displayCareers)
router.get('/detail',careerController.careerDetail) //use this ejs for all /cca/detail /hackathon/detail pages
router.get('/form', careerController.showCareerForm);
router.post('/career-create', careerController.createCareer);
router.post('/career-update', careerController.updateCareer);
router.post('/career-delete', careerController.deleteCareer);

module.exports = router;