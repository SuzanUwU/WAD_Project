const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  organizer:  { type: String, required: true },
  category:   { type: String, enum: ['CCA', 'Career','Hackathon', 'Part Time Jobs'], required: true },
  description:{ type: String },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  location:   { type: String },
  image:      { type: String },
  capacity:   { type: Number, default: Infinity },
});

const Event = mongoose.model('Event', eventSchema,'events');

// Export the model AND the helper functions
module.exports = Event; // → this makes Event.find() work in routes

exports.retrieveAll = function() {
  return Event.find();
}
//career or cca or 
exports.findByCategory = function(category) {
  return Event.find({ category:category });
}

exports.deleteById = function(id) {
  return Event.deleteOne({ _id: id });
}

exports.findManyByIds = function(ids) {
  return Event.find({ _id: { $in: ids } });
}

exports.findById = function(id) {
  return Event.findOne({ _id: id });
}

exports.findWithFilter = function(filter) {
  return Event.find(filter);
}

exports.create = function(data) {
  return Event.create(data);
}

exports.updateById = function(id, data) {
  return Event.updateOne({_id:id}, data);
}