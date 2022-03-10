const express = require('express');
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      //convert to miliseconds
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // secure: req.secure || req.headers('x-forwarded-proto') === 'https',
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.registerUser = async (req, res) => {
  try {
    const newUser = await User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      //FOR TESTING ONLY
      role: req.body.role,
    });
    createSendToken(newUser, 201, req, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    //destructering. Access email and password fields of req.body
    const { email, password } = req.body;
    // 1) check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please enter your email and password', 400));
    }
    // 2) check if user exists && if password is correct
    // explicitly add the password field back to the output
    const user = await User.findOne({ email }).select('+password');
    // checks if user exists, and only if it does, if the password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(
        new AppError('The email or password you provided is incorrect.', 401)
      );
    }
    // 3) if everything is ok, send JWT back to client
    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in', 401));
    }

    // 2) verification of token
    const decodedToken = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
    // 3) Check if user still exists
    const currentUser = await User.findById(decodedToken.id);
    if (!currentUser) {
      return next(new AppError('This user no longer exists', 401));
    }

    // 4) Check if the user has changed password after the JWT was issued
    if (currentUser.changedPassAfterJWTIssued(decodedToken.iat)) {
      return next(
        new AppError(
          'Your password has recently changed. Please login again to continue'
        )
      );
    }

    //GRANT access to protected route
    //Adds user info to the req object for later use
    req.user = currentUser;

    next();
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //roles is an array of acceptable user roles ['admin', 'nca']
    //access to the req.user information is added by the PROTECT middleware above
    //Check if the user has a valid role to grant access to the route
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = async (req, res, next) => {
  // 1) get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError('There is no user registered with that email.', 404)
    );
  }

  // 2) Generate the random reset token
  const passwordResetToken = user.createPasswordResetToken();
  // Prevent mongoose from running the user model validators on save
  await user.save({ validateBeforeSave: false });

  // 3) Send reset token to the users email
  //reset link
  const passwordResetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${passwordResetToken}`;

  //message
  const emailMessage = `We recieved a password reset request for your ${process.env.PROJECT_NAME} account. Please use the following link to reset your password.\n ${passwordResetURL}\n \nIf you didn't request this, please disregard this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `${process.env.PROJECT_NAME}: Account password reset`,
      emailMessage,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email', 500));
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { $gt: Date.now() },
    });

    // 2) if token has not expired, and there is a user, set new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    // 3) log the user in
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 1 Get user from collection
    // explicitly add the password field back to the output
    const user = await User.findById(req.user.id).select('+password');

    // 2 check if POSTed password is correct
    // checks if password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Your current password is incorrect', 401));
    }

    // 3 if password is correct, update the password
    user.password = req.body.updatedPassword;
    user.passwordConfirm = req.body.updatedPasswordConfirm;

    await user.save();

    // 4 log user in, send JWT
    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
