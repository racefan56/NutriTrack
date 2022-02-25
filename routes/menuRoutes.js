const fs = require('fs');
const express = require('express');

const dietController = require('../controllers/dietController');

const menuController = require('../controllers/menuController');

const menuItemController = require('../controllers/menuItemController');

const productionAreaController = require('../controllers/productionAreaController');

const authController = require('../controllers/authController');

const router = express.Router();

////PRODUCTION AREA ROUTES////
router
  .route('/productionAreas')
  .get(productionAreaController.getAllProductionAreas)
  .post(
    authController.restrictTo('admin'),
    productionAreaController.createProductionArea
  );

router
  .route('/productionAreas/:id')
  .get(productionAreaController.getProductionArea)
  .patch(
    authController.restrictTo('admin'),
    productionAreaController.updateProductionArea
  )
  .delete(
    authController.restrictTo('admin'),
    productionAreaController.deleteProductionArea
  );

////MENU ITEM ROUTES////
router
  .route('/menuItems')
  .get(menuItemController.getAllMenuItems)
  .post(authController.restrictTo('admin'), menuItemController.createMenuItem);

router
  .route('/menuItems/:id')
  .get(menuItemController.getMenuItem)
  .patch(
    authController.restrictTo('admin', 'dietitian'),
    menuItemController.updateMenuItem
  )
  .delete(
    authController.restrictTo('admin'),
    menuItemController.deleteMenuItem
  );

// router
//   .route('/menuItems/patient/:id')
//   .get(
//     menuItemController.getMenuItemsByPatientDiet,
//     menuItemController.getAllMenuItems
//   );

////DIET ROUTES////
router
  .route('/diets')
  .get(dietController.getAllDiets)
  .post(authController.restrictTo('admin'), dietController.createDiet);

router
  .route('/diets/:id')
  .get(dietController.getDiet)
  .patch(authController.restrictTo('admin'), dietController.updateDiet)
  .delete(authController.restrictTo('admin'), dietController.deleteDiet);

////MENU ROUTES////
router
  .route('/')
  .get(menuController.getFullMenu)
  .post(authController.restrictTo('admin'), menuController.createMeal);

router
  .route('/:id')
  .get(menuController.getMeal)
  .patch(authController.restrictTo('admin'), menuController.updateMeal)
  .delete(authController.restrictTo('admin'), menuController.deleteMeal);

module.exports = router;
