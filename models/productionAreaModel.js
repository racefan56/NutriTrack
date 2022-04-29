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
});

const ProductionArea = mongoose.model('ProductionArea', productionAreaSchema);

module.exports = ProductionArea;
