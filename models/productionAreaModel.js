const mongoose = require('mongoose');

const productionAreaSchema = new mongoose.Schema({
  areaName: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
  },
});

const ProductionArea = mongoose.model('ProductionArea', productionAreaSchema);

module.exports = ProductionArea;
