const mongoose = require('mongoose');
const Unit = require('./unitModel');
const AppError = require('../utils/appError');

const roomSchema = new mongoose.Schema({
  unit: {
    type: mongoose.Schema.ObjectId,
    ref: 'Unit',
    immutable: true,
    required: [true, 'A unit is required'],
  },
  roomNumber: {
    type: Number,
    unique: true,
    required: [true, 'A room number is required'],
    min: 1,
    max: 9999,
  },
});

//Pre save middleware that will take the unit ID given when a room is created, and check if the unit exists
roomSchema.pre('save', async function (next) {
  //since the unit needs to be retrieved from the DB, we need to await the response
  const unit = await Unit.findById(this.unit);
  //Check if unit ID provided on the request macthed a unit in the DB
  if (!unit) {
    return next(new AppError());
  }
  //Check if the room number provided is within the range specified in the unit
  if (
    unit.roomStartEnd[0] > this.roomNumber ||
    unit.roomStartEnd[1] < this.roomNumber
  ) {
    return next(new AppError());
  }
  next();
});

roomSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'unit',
    //Show only specified fields
    select: 'unitName',
  });
  next();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
