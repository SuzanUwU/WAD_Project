const mongoose = require('mongoose');
const schoolSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true }, // e.g. "soss" — used in filters and eligibility checks
  displayName: { type: String, required: true },               // e.g. "SOSS" — shown in dropdowns
  fullName:    { type: String, required: true },               // e.g. "School of Social Sciences" — shown in forms and detail views
  website:     { type: String, default: '' },                  // e.g. "https://socsc.smu.edu.sg/" — linkable on sign-up and detail pages
  majors: [{
    code: { type: String, required: true },                    // e.g. "psych" — stored in eligibleMajors on Hackathon
    name: { type: String, required: true },                    // e.g. "Psychology" — displayed in dropdowns and listings
  }]
});

const School = mongoose.model('School', schoolSchema, 'school');
module.exports = School;