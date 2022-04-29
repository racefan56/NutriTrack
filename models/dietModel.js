const mongoose = require('mongoose');

const dietSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A diet name is required'],
    unique: true,
  },
  carbsInGrams: {
    type: Number,
    required: [true, 'Max total carb count (in grams) per meal is required'],
  },
  sodiumInMG: {
    type: Number,
    required: [
      true,
      'Max total sodium count (in miligrams) per meal is required',
    ],
  },
  description: {
    type: String,
    required: [true, 'A description is required'],
  },
});

const Diet = mongoose.model('Diet', dietSchema);

module.exports = Diet;
