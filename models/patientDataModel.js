const mongoose = require('mongoose');
const Room = require('./roomModel');
const AppError = require('../utils/appError');

const patientDataSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Patient first name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Patient first name is required'],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    roomNumber: {
      type: mongoose.Schema.ObjectId,
      ref: 'Room',
      required: [true, 'room number is required'],
    },
    unit: {
      type: String,
    },
    currentDiet: {
      type: mongoose.Schema.ObjectId,
      ref: 'Diet',
      required: [true, 'Diet type is required'],
    },
    isHighRisk: {
      type: Boolean,
      required: [true, 'Please select if patient is high risk'],
    },
    knownAllergies: {
      type: [String],
      required: [true, 'Allergy information is required'],
    },
    status: {
      type: String,
      required: [true, 'Patient status is required'],
      enum: {
        values: ['Eating', 'NPO'],
        message: 'Status must be either Eating or NPO',
      },
    },
    supplements: {
      type: String,
    },
    createdOn: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
    collection: 'patientData',
  }
);
patientDataSchema.virtual('mealOrders', {
  ref: 'PatientOrder',
  foreignField: 'patientID',
  localField: '_id',
});

//Prevent multiple patients being assigned to the same room at the same time
patientDataSchema.index({ unit: 1, roomNumber: 1 }, { unique: true });

//Pre save middleware that will take the room ID given when a patient is created, and check if the room exists
patientDataSchema.pre('save', async function (next) {
  //since the room needs to be retrieved from the DB, we need to await the response
  const room = await Room.findById(this.roomNumber);
  //Check if room ID provided on the request macthed a room in the DB
  if (!room) {
    return next(new AppError('No room was found with that ID', 404));
  }
  //Set unit based on the room number data
  //This is needed for the "getCensus" & "getPatientUpdates" functions in the patientDataController
  this.unit = room.unit.unitName;
  next();
});

//Everytime a query is made on the tour model (any find type), the roomNumber will be populated by the room information obtained by the reference made with its IDs
patientDataSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'roomNumber',
    //OMIT unwanted fields during the room data retrieval process
    select: '-__v',
  }).populate({ path: 'currentDiet', select: '-__v' });
  next();
});

const PatientData = mongoose.model('PatientData', patientDataSchema);

module.exports = PatientData;
