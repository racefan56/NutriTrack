const fs = require('fs');
const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/login').post(authController.login);

router.route('/register').post(authController.registerUser);

router.route('/forgotPassword').post(authController.forgotPassword);

router.route('/resetPassword/:token').patch(authController.resetPassword);

router
  .route('/updatePassword')
  .patch(authController.protect, authController.updatePassword);

router
  .route('/updateUser')
  .patch(authController.protect, userController.updateCurrentUser);

router
  .route('/deleteUser')
  .patch(authController.protect, userController.deleteCurrentUser);

router.route('/:id').get(authController.protect, userController.getUser);

// router.route('/').get(authController.protect, userController.getAllUsers);
router.route('/').get(userController.getAllUsers);

module.exports = router;
