const mongoose = require('mongoose');
const hackathonSchema = new mongoose.Schema({
  eventId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true}, // linked Event doc
  title: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true }, 
  category: { type: String, required: true }, // "Hackathon"
  location: { type: String, required: true },
  eligibleSchools: {type: Array, required: true}, // array of selected school codes e.g.[scis, soe, sob]
  eligibleMajors: {type: Array, required: true}, // array of selected majors from each school
  teamSizeMin: {type: Number, required: true},
  teamSizeMax: {type: Number, required: true},
  capacity:   { type: Number, default: Infinity },
  startDate: {type: Date, required: true},
  endDate: {type: Date, required: true},
  registrationDeadline: {type: Date, required: true},
  status: { type: String, required: true },
  image: {data: Buffer, contentType: String},
});

const Hackathon = mongoose.model('Hackathon', hackathonSchema, 'hackathon')
// exports.model = Hackathon;  // export the model itself under a key
// module.exports = Hackathon; // old

// query helpers
exports.findAll = function (filter = {}) {
  return Hackathon.find(filter).sort({ startDate: 1 });
};
 
exports.findById = function (id) {
  return Hackathon.findOne({ _id: id });
};
 
exports.findManyByIds = function (ids) {
  return Hackathon.find({ _id: { $in: ids } });
};
 
exports.createHackathon = function (data) {
  return Hackathon.create(data);
};
 
exports.updateById = function (id, data) {
  return Hackathon.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
};
 
exports.deleteById = function (id) {
  return Hackathon.findByIdAndDelete(id);
};
 
exports.findByEventId = function (eventId) {
  return Hackathon.findOne({ eventId });
};