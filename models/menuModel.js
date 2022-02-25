const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: [true, 'The day of the week is required'],
      enum: {
        values: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        message: 'Invalid input. Please input a day of the week, I.E. Monday',
      },
    },
    mealPeriod: {
      type: String,
      required: [true, 'The meal period is required'],
      enum: {
        values: ['Breakfast', 'Lunch', 'Dinner'],
        message: 'Must be either Breakfast, Lunch, or Dinner',
      },
    },
    option: {
      type: String,
      required: [true, 'The meal option type is required'],
      enum: {
        values: ['Hot', 'Cold'],
        message: 'Invalid input. Please select either Hot or Cold.',
      },
    },
    dietAvailability: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Diet',
        required: [true, 'The diet is required'],
      },
    ],
    entree: {
      type: mongoose.Schema.ObjectId,
      ref: 'MenuItem',
      trim: true,
    },
    sides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
        trim: true,
      },
    ],
    dessert: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
        trim: true,
      },
    ],
    drinks: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
        trim: true,
      },
    ],
    condiments: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
        trim: true,
      },
    ],
    createdOn: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

menuSchema.index(
  { day: 1, mealPeriod: 1, option: 1, dietAvailability: 1 },
  { unique: true }
);

//Everytime a query is made on the tour model (any find type), the guides will be populated by the user information obtained by the references made with their IDs
menuSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: 'dietAvailability',
      select: '_id name',
    },
    {
      path: 'entree',
      select:
        'name portionSize portionUnit carbsInGrams sodiumInMG majorAllergens',
    },
    {
      path: 'sides',
      select:
        'name portionSize portionUnit carbsInGrams sodiumInMG majorAllergens',
    },
    {
      path: 'dessert',
      select:
        'name portionSize portionUnit carbsInGrams sodiumInMG majorAllergens',
    },
    {
      path: 'drinks',
      select:
        'name portionSize portionUnit carbsInGrams sodiumInMG majorAllergens',
    },
    {
      path: 'condiments',
      select:
        'name portionSize portionUnit carbsInGrams sodiumInMG majorAllergens',
    },
  ]);
  next();
});

const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu;
