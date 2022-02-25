const express = require('express');

const Unit = require('../models/unitModel');

const factory = require('./handlerFactory');

//CREATE new unit
exports.createUnit = factory.createOne(Unit);

//READ all units
exports.getAllUnits = factory.getAll(Unit);

//READ one unit
exports.getUnit = factory.getOne(Unit);

//UPDATE one unit by ID
exports.updateUnit = factory.updateOne(Unit);

//DELETE one unit by ID
exports.deleteUnit = factory.deleteOne(Unit);
