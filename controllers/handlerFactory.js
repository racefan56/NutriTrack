const AppError = require('../utils/appError');
const APIFeatures = require('../utils/APIFeatures');
const helperFunctions = require('../utils/helperFunctions');
const Menu = require('../models/menuModel');
const PatientData = require('../models/patientDataModel');
const Room = require('../models/roomModel');
const PatientOrder = require('../models/patientOrderModel');

//Takes the specified model and deletes the specifided document from it
exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    if (Model.modelName === 'Room') {
      const doc = await PatientData.find({ roomNumber: req.params.id });
      if (doc.length > 0) {
        return next(
          new AppError(
            `That room is currently occuipied by a patient. The room must first be vacant to be deleted.`,
            400
          )
        );
      }
    }
    if (Model.modelName === 'Unit') {
      const doc = await Room.find({ unit: req.params.id });
      if (doc.length > 0) {
        return next(
          new AppError(
            `That unit currently has rooms attached to it. The unit must first be empty to be deleted.`,
            400
          )
        );
      }
    }
    if (Model.modelName === 'MenuItem') {
      const patientOrderDoc = await PatientOrder.find({
        $or: [
          { sides: req.params.id },
          { dessert: req.params.id },
          { drinks: req.params.id },
          { condiments: req.params.id },
          { supplements: req.params.id },
          { entree: req.params.id },
        ],
      });
      if (patientOrderDoc.length > 0) {
        return next(
          new AppError(
            `That menu item is currently being used by one or more patient orders. The menu item must not be in use for it to be deleted.`,
            400
          )
        );
      }
      const menuDoc = await Menu.find({
        $or: [
          { sides: req.params.id },
          { dessert: req.params.id },
          { drinks: req.params.id },
          { condiments: req.params.id },
          { supplements: req.params.id },
          { entree: req.params.id },
        ],
      });
      if (menuDoc.length > 0) {
        return next(
          new AppError(
            `That menu item is currently being used by one or more preset menus. The menu item must not be in use for it to be deleted.`,
            400
          )
        );
      }
    }
    const doc = await Model.findByIdAndDelete(
      Model.modelName === 'PatientOrder' ? req.params.orderId : req.params.id
    );

    if (!doc) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404
        )
      );
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Unable to delete file',
    });
  }
};

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    if (Model.modelName === 'PatientData') {
      const validationError = await helperFunctions.validateRefPatientData(req);
      if (validationError[0] === 'Error') {
        return next(new AppError(validationError[1], validationError[2]));
      }
    }
    if (Model.modelName === 'PatientOrder') {
      const validationError = await helperFunctions.validateRefPatientOrderData(
        req
      );
      if (validationError[0] === 'Error') {
        return next(new AppError(validationError[1], validationError[2]));
      }
    }

    if (Model.modelName === 'MenuItem') {
      const validationError = await helperFunctions.validateRefMenuItemData(
        req
      );
      if (validationError[0] === 'Error') {
        return next(new AppError(validationError[1], validationError[2]));
      }
    }
    const doc = await Model.findByIdAndUpdate(
      Model.modelName === 'PatientOrder' ? req.params.orderId : req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doc) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404
        )
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createOne = (Model) => async (req, res, next) => {
  try {
    //If model is PatientOrder & the req.body is NOT empty, meaning the request is attempting to POST a custom Patientorder. Set the current patientID, day, & mealPeriod on the req body based on the query and params recieved
    if (
      Model.modelName === 'PatientOrder' &&
      Object.keys(req.body).length > 0
    ) {
      //Meal orders can only be submitted for the current or next day of the week. Returns the meal date if it is a valid day, otherwise, returns false
      const isValidOrderDay = helperFunctions.isValidOrderDay(req.query.day);

      //If the meal order being submitted is not for either today or tomorrow, throw an error
      if (!isValidOrderDay) {
        return next(
          new AppError(
            'Meal orders can only be submitted for the current or next day of the week',
            400
          )
        );
      }

      req.body.patientID = req.params.patientId;
      req.body.day = req.query.day;
      req.body.mealPeriod = req.query.mealPeriod;
      req.body.mealDate = helperFunctions.mealDate(
        req.body.mealPeriod,
        isValidOrderDay
      );

      const menuItems = await helperFunctions.validateRefPatientOrderData(
        req,
        next
      );

      const failedItemNames = helperFunctions.checkAllergens(menuItems, req);

      if (failedItemNames.length > 0) {
        return next(
          new AppError(
            `This order was rejected because the following item(s) contain one or more allergen(s) on the patients list of known allergies: ${failedItemNames.toString()}`,
            400
          )
        );
      }
    }

    //If model is PatientOrder & the req.body IS empty, fill the req.body with the default menu for the specified day, mealPeriod, & current patients diet from the query & params recieved
    if (Model.modelName === 'PatientOrder' && !Object.keys(req.body).length) {
      //Meal orders can only be submitted for the current or next day of the week. Returns the meal date if it is a valid day, otherwise, returns false
      const isValidOrderDay = helperFunctions.isValidOrderDay(req.query.day);

      //If the meal order being submitted is not for either today or tomorrow, throw an error
      if (!isValidOrderDay) {
        return next(
          new AppError(
            'Meal orders can only be submitted for the current or next day of the week',
            400
          )
        );
      }

      //Get the default menu that matches the patient diet, day, mealPeriod, & option (A unique compound index)
      const meal = await Menu.findOne({
        dietAvailability: req.currentDiet,
        day: `${req.query.day}`,
        mealPeriod: `${req.query.mealPeriod}`,
        option: `${req.query.option}`,
      });

      //If no meal is found, throw an error
      if (!meal) {
        return next(
          new AppError(
            'No default meal order was found for the specified day, meal period, diet, & option.',
            400
          )
        );
      }

      //Auto fill the req body with the default menu found above
      req.body = {
        patientID: req.params.patientId,
        mealDate: helperFunctions.mealDate(meal.mealPeriod, isValidOrderDay),
        day: meal.day,
        mealPeriod: meal.mealPeriod,
        option: meal.option,
        entree: meal.entree,
        sides: [...meal.sides],
        dessert: [...meal.dessert],
        drinks: [...meal.drinks],
        condiments: [...meal.condiments],
      };

      //gather menu items in an array for allergy check below
      const menuItems = [
        meal.entree,
        ...meal.sides,
        ...meal.dessert,
        ...meal.drinks,
        ...meal.condiments,
      ];

      //check if any of the requested menu items contain a major allergen that the current patient is allergic to.
      const failedItemNames = helperFunctions.checkAllergens(menuItems, req);

      if (failedItemNames.length > 0) {
        return next(
          new AppError(
            `This order was rejected because the following item(s) contain one or more allergen(s) on the patients list of known allergies: ${failedItemNames.toString()}`,
            400
          )
        );
      }
    }

    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getOne = (Model, popOptions) => async (req, res, next) => {
  try {
    const doc = await Model.findById(
      Model.modelName === 'PatientOrder' ? req.params.orderId : req.params.id
    ).populate(popOptions);

    if (!doc) {
      return next(
        new AppError(
          `No ${Model.modelName.toLowerCase()} found with that ID`,
          404
        )
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getAll = (Model) => async (req, res) => {
  try {
    //If the model being used is MenuItem & req.currentDiet exists on the req object, asign that value to req.query.dietAvailability
    if (Model.modelName === 'MenuItem' && req.currentDiet) {
      req.query.dietAvailability = req.currentDiet;
    }
    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
