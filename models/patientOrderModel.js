const mongoose = require('mongoose');

const patientOrderSchema = new mongoose.Schema(
  {
    patientID: {
      type: mongoose.Schema.ObjectId,
      ref: 'PatientData',
      immutable: true,
      required: [true, 'A patient ID is required.'],
    },
    day: {
      type: String,
      immutable: true,
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
      immutable: true,
      required: [true, 'The meal period is required'],
      enum: {
        values: ['Breakfast', 'Lunch', 'Dinner'],
        message: 'Must be either Breakfast, Lunch, or Dinner',
      },
    },
    entree: {
      type: mongoose.Schema.ObjectId,
      ref: 'MenuItem',
    },
    sides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
      },
    ],
    dessert: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
      },
    ],
    drinks: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
      },
    ],
    condiments: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
      },
    ],
    supplements: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'MenuItem',
      },
    ],
    comments: {
      type: String,
      trim: true,
    },
    createdOn: {
      type: Date,
      default: Date.now(),
    },
    mealDate: {
      type: Date,
    },
    expiresOn: {
      type: Date,
      default: Date.now() + 5 * 1000 * 60 * 60 * 24,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

patientOrderSchema.index(
  { patientID: 1, day: 1, mealPeriod: 1 },
  { unique: true }
);

//All patient orders are automatically deleted from the DB 5 days after they are created. This helps ensure the above unique compound index of patientID, day, & mealPeriod functions as intended
patientOrderSchema.index({ expiresOn: 1 }, { expireAfterSeconds: 0 });

patientOrderSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: 'patientID',
      select: '_id currentDiet status',
    },
    {
      path: 'entree',
      select: 'name portionSize portionUnit carbsInGrams sodiumInMG',
    },
    {
      path: 'sides',
      select: 'name portionSize portionUnit carbsInGrams sodiumInMG',
    },
    {
      path: 'dessert',
      select: 'name portionSize portionUnit carbsInGrams sodiumInMG',
    },
    {
      path: 'drinks',
      select: 'name portionSize portionUnit carbsInGrams sodiumInMG',
    },
    {
      path: 'condiments',
      select: 'name portionSize portionUnit carbsInGrams sodiumInMG',
    },
    {
      path: 'supplements',
      select: 'name',
    },
  ]);
  next();
});

patientOrderSchema.virtual('totalMealCarbCount').get(function () {
  //convert entree to an array
  const entreeArr = [this.entree];
  const concatItemArrs = entreeArr.concat(
    this.sides,
    this.dessert,
    this.drinks,
    this.condiments
  );

  const mapArr = concatItemArrs.map((item) => item.carbsInGrams);

  const totalCarbCount = mapArr.reduce((result, item) => result + item);

  return totalCarbCount;
});

patientOrderSchema.virtual('totalMealSodiumCount').get(function () {
  //convert entree to an array
  const entreeArr = [this.entree];
  const concatItemArrs = entreeArr.concat(
    this.sides,
    this.dessert,
    this.drinks,
    this.condiments
  );

  const mapArr = concatItemArrs.map((item) => item.sodiumInMG);

  const totalSodiumCount = mapArr.reduce((result, item) => result + item);

  return totalSodiumCount;
});

const PatientOrder = mongoose.model('PatientOrder', patientOrderSchema);

module.exports = PatientOrder;
