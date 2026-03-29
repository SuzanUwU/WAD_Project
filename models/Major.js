const mongoose = require('mongoose');
const majorSchema = new mongoose.Schema({
  code:   { type: String, required: true, unique: true }, // e.g. "ple"
  name:   { type: String, required: true },               // e.g. "Politics, Law and Economics"
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
});

const Major = mongoose.model('Major', majorSchema, 'major') // 'major'
module.exports = Major