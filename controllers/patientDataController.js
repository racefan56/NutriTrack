const express = require('express');

const PatientData = require('../models/patientDataModel');
const Room = require('../models/roomModel');

const factory = require('./handlerFactory');

//CREATE new patient
exports.createPatient = factory.createOne(PatientData);

//READ all patients data
exports.getAllPatients = factory.getAll(PatientData);

//READ one patients data
exports.getPatient = factory.getOne(PatientData, 'mealOrders');

//UPDATE one patients data by ID
exports.updatePatientData = factory.updateOne(PatientData);

//DELETE one patient by ID
exports.deletePatient = factory.deleteOne(PatientData);

//NEW & UPDATED DIETS FROM THE PAST SPECIFIED NUMBER OF MINUTES
exports.getPatientUpdates = async (req, res) => {
  try {
    //multiply to convert value to a number
    const range = req.query.range * 1;
    const now = new Date();
    now.setMinutes(now.getMinutes() - range);
    const updates = await PatientData.aggregate([
      {
        $match: {
          updatedAt: {
            $gte: now,
          },
        },
      },
      {
        $group: {
          _id: '$unit',
          numPatients: { $sum: 1 },
          rooms: {
            $push: {
              $concat: [
                { $toString: '$roomNumber' },
                ' ',
                '$firstName',
                ' ',
                '$lastName',
                ' ',
                '$currentDiet',
              ],
            },
          },
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        updates,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

//CENSUS (TOTAL PATIENT COUNT BY STATUS & UNIT)
exports.getCensus = async (req, res) => {
  try {
    const npo = await PatientData.aggregate([
      {
        $match: {
          status: {
            $ne: 'Eating',
          },
        },
      },
      {
        $group: {
          _id: '$unit',
          numPatients: { $sum: 1 },
        },
      },
    ]);
    const eating = await PatientData.aggregate([
      {
        $match: {
          status: {
            $ne: 'NPO',
          },
        },
      },
      {
        $group: {
          _id: '$unit',
          numPatients: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        npo,
        eating,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

//RISK LOG: aggregate of all patients with supplements, allergies, and/or on a Puree or Mechanical soft diet
exports.getRiskLog = async (req, res) => {
  try {
    const riskLog = await PatientData.aggregate([
      {
        $match: {
          isHighRisk: {
            $ne: false,
          },
        },
      },
      {
        $group: {
          _id: '$unit',
          patients: {
            $push: {
              $concat: [
                { $toString: '$roomNumber' },
                ' ',
                '$firstName',
                ' ',
                '$lastName',
                ' ',
                '$knownAllergies',
                ' ',
                '$supplements',
                ' ',
                {
                  $cond: {
                    if: { $eq: ['$currentDiet', 'Puree'] },
                    then: '$currentDiet',
                    else: {
                      $cond: {
                        if: { $eq: ['$currentDiet', 'Mechanical'] },
                        then: '$currentDiet',
                        else: '',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
      {
        $addFields: {
          unit: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        riskLog,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getPatientDietAllergies = async (req, res, next) => {
  try {
    const currentPatient = await PatientData.findById(req.params.patientId);

    req.currentDiet = currentPatient.currentDiet._id;
    req.currentDietName = currentPatient.currentDiet.name;
    req.knownAllergies = currentPatient.knownAllergies;

    next();
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
