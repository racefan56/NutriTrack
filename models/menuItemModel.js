const mongoose = require('mongoose');

const AppError = require('../utils/appError');

const ProductionArea = require('./productionAreaModel');

const Diet = require('./dietModel');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 40,
  },
  dietAvailability: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Diet',
      required: [true, 'Menu item diet availability is required'],
    },
  ],
  majorAllergens: {
    type: [String],
    default: 'none',
    enum: {
      values: [
        'none',
        'milk',
        'eggs',
        'fish',
        'shellfish',
        'tree nuts',
        'peanuts',
        'wheat',
        'soybean',
      ],
      message: 'Please select from the available list of major allergens',
    },
  },
  category: {
    type: String,
    required: [true, 'A category is required'],
    enum: {
      values: ['entree', 'side', 'drink', 'dessert', 'condiment', 'supplement'],
      message: 'Please select one of the available categories',
    },
    minlength: 3,
    maxlength: 40,
  },
  productionArea: {
    type: mongoose.Schema.ObjectId,
    ref: 'ProductionArea',
    required: [true, 'Select which production area makes this item'],
  },
  isLiquid: {
    type: Boolean,
    required: [true, 'Please specify whether this item is a liquid'],
  },
  portionSize: {
    type: Number,
    required: [true, 'Please select a portion size'],
  },
  portionUnit: {
    type: String,
    required: [true, 'Please select a portion unit type'],
    enum: {
      values: ['each', 'cup', 'ounce'],
      message:
        'Please select from the available options of "each", "cup", or "ounce"',
    },
  },
  description: {
    type: String,
    required: [true, 'A description is required'],
    trim: true,
    minlength: 3,
    maxlength: 60,
  },
  carbsInGrams: {
    type: Number,
    required: [true, 'Please specify total carb count per portion in grams'],
  },
  sodiumInMG: {
    type: Number,
    required: [
      true,
      'Please specify total sodium count per portion in milligrams',
    ],
  },
  image: {
    type: String,
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
});

menuItemSchema.pre('save', async function (next) {
  const productionArea = await ProductionArea.findById(this.productionArea);
  //Check if productionArea ID provided on the request macthed a productionArea in the DB
  if (!productionArea) {
    return next(new AppError('No production area was found with that ID', 404));
  }

  //Check if all diet IDs provided on the request macthed a diet in the DB
  const dietsPromises = this.dietAvailability.map(
    async (dietId) => await Diet.findById(dietId)
  );
  const allDiets = await Promise.all(dietsPromises);

  if (allDiets.includes(null)) {
    return next(
      new AppError('One or more diets were not found with the provided ID(s)')
    );
  }
  next();
});

menuItemSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: 'dietAvailability',
      select: '_id name',
    },
    {
      path: 'productionArea',
      select: 'areaName',
    },
  ]);
  next();
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
