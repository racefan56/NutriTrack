const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unitName: {
    type: String,
    required: [true, 'A unit name is required'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'description is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

const Unit = mongoose.model('Unit', unitSchema);

module.exports = Unit;
