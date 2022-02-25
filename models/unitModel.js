const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unitName: {
    type: String,
    required: [true, 'A unit name is required'],
    trim: true,
    unique: true,
  },
  roomStartEnd: {
    type: Array,
    required: [
      true,
      'Please enter the starting and ending room numbers for this unit',
    ],
  },
  description: {
    type: String,
    required: [true, 'description is required'],
    trim: true,
  },
});

const Unit = mongoose.model('Unit', unitSchema);

module.exports = Unit;
