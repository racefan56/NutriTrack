const express = require('express');

const PatientOrder = require('../models/patientOrderModel');

const PatientData = require('../models/patientDataModel');

const factory = require('./handlerFactory');

//CREATE new patient order
exports.createOrder = factory.createOne(PatientOrder);

//READ all patients orders
exports.getAllOrders = factory.getAll(PatientOrder);

//READ one patient order
exports.getOrder = factory.getOne(PatientOrder);

//UPDATE one patient order by ID
exports.updateOrder = factory.updateOne(PatientOrder);

//DELETE one patient order by ID
exports.deleteOrder = factory.deleteOne(PatientOrder);

exports.getMenuItemsByPatientDiet = async (req, res, next) => {
  try {
    const patient = await PatientData.findById(req.body.patientId);
    req.query.dietAvailability = patient.currentDiet.name;
    next();
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getPrepLists = async (req, res) => {
  try {
    const { day, mealPeriod, productionArea } = req.query;

    //Find only orders that are for the queried day and mealperiod
    const orders = await PatientOrder.find({
      day: day,
      mealPeriod: mealPeriod,
    });

    //From those orders create an array of all of the items ordered that are for patients that have a status of "Eating". Meaning all patient order items for patients that have a status of "NPO" will NOT be added to the array as they will not be served a meal.
    let concatItemArrs = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const order of orders) {
      if (order.patientID.status === 'Eating') {
        concatItemArrs = concatItemArrs.concat(
          [order.entree],
          order.sides,
          order.dessert,
          order.drinks,
          order.condiments
        );
      }
    }

    //Separate the items based on their productionArea
    const areaSpecificItems = concatItemArrs.filter(
      (arr) => arr.productionArea.areaName === productionArea
    );

    //Count how many of each item are present in the areaSpecificItems array, producing the final preplist for the production area
    const itemsAndCounts = areaSpecificItems.map((curItem) => {
      const count = areaSpecificItems.filter(
        (item) => item.name === curItem._doc.name
      );
      const itemCount = { ...curItem._doc, count: count.length };
      return itemCount;
    });

    const itemNamesSet = new Set(itemsAndCounts.map((item) => item.name));

    const prepList = [...itemNamesSet].map((name) => {
      const found = itemsAndCounts.find((el) => el.name === name);
      return found;
    });

    res.status(200).json({
      status: 'success',
      data: {
        prepList,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
