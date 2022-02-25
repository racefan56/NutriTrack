const mongoose = require('mongoose');

const dietSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A diet name is required'],
    unique: true,
    enum: {
      values: [
        'Regular',
        'Cardiac',
        'Heart Healthy',
        'GI Soft',
        'Mechanical Soft',
        'Puree',
        'Full Liquid',
        'Clear Liquid',
      ],
      message:
        'Invalid input. Please use a diet from the available options of "Regular", "Cardiac", "Heart Healthy", "GI Soft", "Mechanical Soft", "Puree", "Full Liquid", "Clear Liquid".',
    },
  },
  calories: {
    type: Number,
  },
  totalFat: {
    type: Number,
  },
  cholesterol: {
    type: Number,
  },
  sodium: {
    type: Number,
  },
  totalCarbs: {
    type: Number,
  },
  protein: {
    type: Number,
  },
});

const Diet = mongoose.model('Diet', dietSchema);

module.exports = Diet;
