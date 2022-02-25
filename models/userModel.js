const crypto = require('crypto');

const mongoose = require('mongoose');

const validator = require('validator');

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    minLength: 3,
    maxLength: 40,
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'An email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: { values: ['nca', 'lead-nca', 'dietitian', 'nurse', 'admin'] },
    default: 'nca',
  },
  password: {
    type: String,
    required: [true, 'A password is required'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please reenter your password'],
    minlength: 8,
    validate: {
      // This only works on CREATE & SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiresAt: Date,
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // only run if password was modified
  if (!this.isModified('password')) return next();

  //the higher the number, the better the encryption (12 is the current recommendation)
  //hash is asynchronous, so we must use an async function
  //stores an encrypted version of the password
  this.password = await bcrypt.hash(this.password, 12);

  //clears this field so it is not saved in the database
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  //IF the password has not been updated OR the user is NEW move on to the next middleware
  if (!this.isModified('password') || this.isNew) return next();

  //IF the password has been updated then update this field
  // subtracting 2.5 seconds to prevent a possible issue of the JWT being issued before this field gets updated in the DB. Which would cause an error preventing login due to the password appearing to have been updated after the JWT was issued
  this.passwordChangedAt = Date.now() - 2500;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to current query
  this.find({ active: { $ne: false } });
  next();
});

// INSTANCE METHOD. Available on all user documents
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // will return true if passwords are the same, false if not
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPassAfterJWTIssued = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //if the token was created before the password was changed, this is true
    return JWTTimestamp < changedTimeStamp;
  }
  // False means NOT changed, meaning the password hasn't been updated since the token was created
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //sets now + 10 minutes
  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
