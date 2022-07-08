const mongoose = require('mongoose');

const productionAreaSchema = new mongoose.Schema({
  areaName: {
    type: String,
    required: [true, 'An area name is required'],
    unique: true,
  },
  description: {
    type: String,
  },
  isOutOfService: {
    type: Boolean,
    required: [
      true,
      'Please specifify if production area is in service or not',
    ],
  },
});

const ProductionArea = mongoose.model('ProductionArea', productionAreaSchema);

module.exports = ProductionArea;
