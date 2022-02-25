const express = require('express');

const MenuItem = require('../models/menuItemModel');

const factory = require('./handlerFactory');

//CREATE new menu item
exports.createMenuItem = factory.createOne(MenuItem);

//READ all menu items
exports.getAllMenuItems = factory.getAll(MenuItem);

//READ one menu item by ID
exports.getMenuItem = factory.getOne(MenuItem);

//UPDATE one menu item by ID
exports.updateMenuItem = factory.updateOne(MenuItem);

//DELETE one menu item by ID
exports.deleteMenuItem = factory.deleteOne(MenuItem);
