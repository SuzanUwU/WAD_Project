const express = require('express');

const careerController = require('../controllers/careerController');
const router = express.Router(); // sub application

// router.get('ejs',xController.renderthis)
router.get('/',careerController.displayCareers)
router.get('/form', careerController.showCareerForm);
router.post('/career-create', careerController.createCareer);
router.post('/career-update', careerController.updateCareer);
router.post('/career-delete', careerController.deleteCareer);
router.get('/:id',careerController.careerDetail)

module.exports = router;