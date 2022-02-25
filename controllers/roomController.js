const express = require('express');

const Room = require('./../models/roomModel');

const APIFeatures = require('./../utils/apiFeatures');

const factory = require('./handlerFactory');

//CREATE new room
exports.createRoom = factory.createOne(Room);

//READ all rooms
exports.getAllRooms = factory.getAll(Room);

//READ one room
exports.getRoom = factory.getOne(Room);

//UPDATE one room by ID
exports.updateRoom = factory.updateOne(Room);

//DELETE one room by ID
exports.deleteRoom = factory.deleteOne(Room);
