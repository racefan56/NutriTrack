const express = require('express');

const Diet = require('../models/dietModel');

const factory = require('./handlerFactory');

//CREATE new diet
exports.createDiet = factory.createOne(Diet);

//READ all diets
exports.getAllDiets = factory.getAll(Diet);

//READ one diet by ID
exports.getDiet = factory.getOne(Diet);

//UPDATE one diet by ID
exports.updateDiet = factory.updateOne(Diet);

//DELETE one diet by ID
exports.deleteDiet = factory.deleteOne(Diet);
