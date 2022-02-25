const express = require('express');

const ProductionArea = require('../models/productionAreaModel');

const factory = require('./handlerFactory');

//CREATE new menu item
exports.createProductionArea = factory.createOne(ProductionArea);

//READ all menu items
exports.getAllProductionAreas = factory.getAll(ProductionArea);

//READ one menu item by ID
exports.getProductionArea = factory.getOne(ProductionArea);

//UPDATE one menu item by ID
exports.updateProductionArea = factory.updateOne(ProductionArea);

//DELETE one menu item by ID
exports.deleteProductionArea = factory.deleteOne(ProductionArea);
