const fs = require('fs');
const express = require('express');

const patientDataController = require('../controllers/patientDataController');

const patientOrderController = require('../controllers/patientOrderController');

const menuItemController = require('../controllers/menuItemController');

const authController = require('../controllers/authController');

const router = express.Router();
////PATIENT UPDATES ROUTE////
router.route('/patient_updates').get(patientDataController.getPatientUpdates);

////CENSUS ROUTE////
router.route('/census').get(patientDataController.getCensus);

////HIGH RISK LOG ROUTE////
router.route('/high_risk_report').get(patientDataController.getRiskLog);

////PATIENT ORDER ROUTES////
//GET ALL patient orders
router.route('/allPatientOrders').get(patientOrderController.getAllOrders);

//GET prep list based on day and mealPeriod query
router.route('/generatePrepLists').get(patientOrderController.getPrepLists);

//POST orders for a patient based on their ID
router
  .route('/:patientId/menu/order')
  .post(
    patientDataController.getPatientDietAllergies,
    patientOrderController.createOrder
  );

//GET, PATCH, DELETE, single order based on patientID & orderID
router
  .route('/:patientId/menu/order/:orderId')
  .get(patientOrderController.getOrder)
  .patch(
    patientDataController.getPatientDietAllergies,
    patientOrderController.updateOrder
  )
  .delete(patientOrderController.deleteOrder);

////PATIENT DATA ROUTES////
router
  .route('/')
  .get(patientDataController.getAllPatients)
  .post(
    authController.restrictTo('admin', 'nurse'),
    patientDataController.createPatient
  );

router
  .route('/:id')
  .get(patientDataController.getPatient)
  .patch(
    authController.restrictTo('admin', 'nurse'),
    patientDataController.updatePatientData
  )
  .delete(
    authController.restrictTo('admin', 'nurse'),
    patientDataController.deletePatient
  );

module.exports = router;
