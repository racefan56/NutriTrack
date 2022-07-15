const AppError = require('./appError');
const Room = require('../models/roomModel');
const Diet = require('../models/dietModel');
const MenuItem = require('../models/menuItemModel');
const ProductionArea = require('../models/productionAreaModel');

exports.validateRefPatientData = async function (req) {
  //If attempting to update patientData, check if these fields are supplied on the req body, if they are, check if they are valid
  if (req.body.roomNumber) {
    const room = await Room.findById(req.body.roomNumber);
    //Check if room ID provided on the request macthed a room in the DB
    if (!room) {
      return ['Error', 'No room was found with that ID', 404];
    }
    //Set unit based on the room number data
    //This is needed for the "getCensus" & "getPatientUpdates" functions in the patientDataController
    req.body.unit = room.unit.unitName;
  }
  if (req.body.currentDiet) {
    const diet = await Diet.findById(req.body.currentDiet);

    if (!diet) {
      return ['Error', 'No diet was found with that ID', 404];
    }
  }
  //If the data didn't fail validation
  return false;
};

exports.validateRefPatientOrderData = async function (req, next) {
  //Gather a unique set of menu items from the req body
  //convert entree to an array
  const entreeArr = [req.body.entree];
  //combine all menu item ids in the req into a single array
  const reqMenuItemsArr = entreeArr.concat(
    req.body.sides,
    req.body.dessert,
    req.body.drinks,
    req.body.condiments,
    req.body.supplements
  );
  //Make a set of only the unique menu items from the above array
  const reqMenuItemSet = [...new Set(reqMenuItemsArr)];
  //Filter out a potential undefined value caused by an item not being on the req body
  const reqMenuItemSetFiltered = reqMenuItemSet.filter(
    (item) => item !== undefined
  );

  //get menu items from the DB using the reqMenuItemSetFiltered
  const menuItems = await MenuItem.find({
    _id: { $in: reqMenuItemSetFiltered },
  });

  if (menuItems.length !== reqMenuItemSetFiltered.length) {
    return next(
      new AppError(['Error', 'One or more menu item(s) was not found', 404])
    );
  }
  //Get patients current diet & allergies from the req object. This was added to the req object by the getPatientDietAllergies function in the patientDataController
  const patientCurrentDiet = req.currentDietName;

  //filter the DB results by menu items allowed on the patients current diet
  const allowedMenuItemsArr = [];
  menuItems.forEach((menuItem) =>
    menuItem.dietAvailability.forEach((diet) => {
      if (diet.name === patientCurrentDiet) {
        allowedMenuItemsArr.push(diet.name);
      }
    })
  );

  //if the DB returned more documents than the number of elements in the allowedMenuItems array, send an error. This must mean at least one menu item from the request is not allowed by the patients diet, and is in that case, invalid
  if (menuItems.length !== allowedMenuItemsArr.length) {
    return [
      'Error',
      'One or more menu item(s) is not allowed by the patients current diet',
      400,
    ];
  }

  //Pass the cleared menuItems list on to be used by another function if needed
  return menuItems;
};

exports.checkAllergens = function (menuItemsArr, req) {
  //Check if any of the items in the order contain an allergen listed for the current patient. If they do, add them to the "failedAllergenTest" array
  const patientKnownAllergies = req.knownAllergies;
  const failedAllergenTest = [];
  menuItemsArr.forEach((menuItem) =>
    menuItem.majorAllergens.forEach((allergen) => {
      if (patientKnownAllergies.includes(allergen)) {
        failedAllergenTest.push(menuItem);
      }
    })
  );

  if (failedAllergenTest.length > 0) {
    const failedItemNames = [];
    failedAllergenTest.forEach((item) => failedItemNames.push(item.name));
    return failedItemNames;
  }
  return [];
};

exports.isValidOrderDay = function (dayOfOrder) {
  const getTomorrow = (today) => {
    // In the case where today is saturday, adding one would give an index outside of the daysArr. So it must loop back to index 0 for Sunday
    if (today === 6) {
      return 0;
    }
    return today + 1;
  };
  const getTwoDaysFromNow = (today) => {
    // In the case where today is friday, adding two would give an index outside of the daysArr. So it must loop back to index 0 for Sunday
    if (today === 5) {
      return 0;
    }
    // In the case where today is saturday, adding two would give an index outside of the daysArr. So it must loop back to index 1 for Monday
    if (today === 6) {
      return 1;
    }
    // else return today plus 2
    return today + 2;
  };

  const daysArr = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const now = new Date();
  const today = now.getDay();
  const tomorrow = getTomorrow(today);
  const twoDaysFromNow = getTwoDaysFromNow(today);

  const dayOfOrderIndex = daysArr.indexOf(dayOfOrder);

  if (dayOfOrderIndex === today) {
    //return todays date
    return now;
  }

  if (dayOfOrderIndex === tomorrow) {
    //return tomorrows date
    return now.setDate(now.getDate() + 1);
  }

  if (dayOfOrderIndex === twoDaysFromNow) {
    //return two days from nows date
    return now.setDate(now.getDate() + 2);
  }

  return false;
};

//Combines the date the meal is for, along with an hour of day associated with the mealPeriod the meal is for. This will make sorting meal orders easier.
exports.mealDate = (mealPeriod, date) => {
  let mealDate;
  if (mealPeriod === 'Breakfast') {
    mealDate = new Date(date);
    mealDate.setHours(7, 0, 0, 0);
    return mealDate;
  }
  if (mealPeriod === 'Lunch') {
    mealDate = new Date(date);
    mealDate.setHours(12, 0, 0, 0);
    return mealDate;
  }
  mealDate = new Date(date);
  mealDate.setHours(17, 0, 0, 0);
  return mealDate;
};

exports.validateRefMenuItemData = async function (req) {
  //If attempting to update a menuItem, check if these fields are supplied on the req body, if they are, check if they are valid

  if (req.body.dietAvailability) {
    //Check if all diet IDs provided on the request macth a diet in the DB
    const dietsPromises = req.body.dietAvailability.map(
      async (dietId) => await Diet.findById(dietId)
    );
    const allDiets = await Promise.all(dietsPromises);

    if (allDiets.includes(null)) {
      return [
        'Error',
        'One or more diets were not found with the provided ID(s)',
        404,
      ];
    }
  }

  if (req.body.productionArea) {
    const productionArea = await ProductionArea.findById(
      req.body.productionArea
    );
    //Check if productionArea ID provided on the request macthed a productionArea in the DB
    if (!productionArea) {
      return ['Error', 'No production area was found with that ID', 404];
    }
  }
  //If the data didn't fail validation
  return false;
};
