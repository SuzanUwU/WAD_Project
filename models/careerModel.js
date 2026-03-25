const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  eventId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },//addition not guaranteed avoid using
  title:      { type: String, required: true },
  organizer:  { type: String, required: true },
  category:   { type: String, default: 'Career'},
  description:{ type: String },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  location:   { type: String },
  image:      { type: String },
  deadline:   { type: Date },
  createdAt:  { type: Date, default: Date.now },
  salary:     { type: Number },
  applyLink:  { type: String },
  careerType: { type: String, enum: ['full-time', 'internship', 'workshop'] },
  sector:     { type: String, enum: ['Information Technology', 'Banking', 'Marketing', 'Accounting', 'Human Resources', 'Consulting', 'Legal', 'Operations', 'Other'] }
});

// 'careers' matches your actual collection name
const Career = mongoose.model('Career', careerSchema,'careers');

exports.retrieveAll = function() {
  return Career.find();
}

exports.findByCategory = function(type) {
  return Career.find({ careerType: type });
}

exports.findManyByIds = function(ids) {
  return Career.find({ _id: { $in: ids } });
}

exports.findById = function(id) {
  return Career.findOne({ _id: id });
}

exports.findByEventId = function (ev) {
  return Career.findOne({ eventId: ev });
}

exports.findWithFilter = function(filter) {
  return Career.find(filter);
}