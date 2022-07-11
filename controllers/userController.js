const express = require('express');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  console.log(allowedFields);
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+isActive');

    if (!user || user.isActive === false) {
      return next(new AppError('There is no user with that ID.', 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateCurrentUser = async (req, res, next) => {
  try {
    //Prevent user from attempting to update their password using this function
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This page is not for updating your password. Please use the change password page to update your password.',
          400
        )
      );
    }

    //Update user data
    const filteredBody = filterObj(req.body, 'email');
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateOtherUser = async (req, res, next) => {
  try {
    //Prevent user from attempting to update the other users password using this function
    if (req.body.password || req.body.passwordConfirm) {
      return next(new AppError('You can only update your own password.', 400));
    }

    //Update user data
    const filteredBody = filterObj(req.body, 'email', 'role');
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteCurrentUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isActive: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
