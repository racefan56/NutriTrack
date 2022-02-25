const fs = require('fs');
const express = require('express');

const unitController = require('./../controllers/unitController');
const roomController = require('./../controllers/roomController');
const authController = require('./../controllers/authController');

const router = express.Router();

////ROOM ROUTES////
router
  .route('/rooms')
  .get(roomController.getAllRooms)
  .post(authController.restrictTo('admin'), roomController.createRoom);

router
  .route('/rooms/:id')
  .get(roomController.getRoom)
  .patch(authController.restrictTo('admin'), roomController.updateRoom)
  .delete(authController.restrictTo('admin'), roomController.deleteRoom);

////UNIT ROUTES////
router
  .route('/')
  .get(unitController.getAllUnits)
  .post(authController.restrictTo('admin'), unitController.createUnit);

router
  .route('/:id')
  .get(unitController.getUnit)
  .patch(authController.restrictTo('admin'), unitController.updateUnit)
  .delete(authController.restrictTo('admin'), unitController.deleteUnit);

module.exports = router;
