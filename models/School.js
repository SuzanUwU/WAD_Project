const mongoose = require('mongoose');
const schoolSchema = new mongoose.Schema({
  code:     { type: String, required: true, unique: true }, // e.g. "soss"
  name:     { type: String, required: true },               // e.g. "School of Social Sciences"
  majors:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Major' }]
});

const School = mongoose.model('School', schoolSchema, 'school') // ,school (options)
module.exports = School