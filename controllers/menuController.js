const express = require('express');

const Menu = require('../models/menuModel');

const factory = require('./handlerFactory');

//CREATE new meal
exports.createMeal = factory.createOne(Menu);

//READ all meals (Full menu)
exports.getFullMenu = factory.getAll(Menu);

//READ one meal by ID
exports.getMeal = factory.getOne(Menu);

//UPDATE one meal by ID
exports.updateMeal = factory.updateOne(Menu);

//DELETE one meal by ID
exports.deleteMeal = factory.deleteOne(Menu);
