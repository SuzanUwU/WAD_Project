const mongoose = require('mongoose');
const hackathonSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true }, 
  category: { type: String, required: true }, // "Hackathons"
  eligibleSchools: {type: Array, required: true}, // array of selected school codes e.g.[scis, soe, sob]
  eligibleMajors: {type: Array, required: true}, // array of selected majors from each school
  teamSizeMin: {type: Number, required: true},
  teamSizeMax: {type: Number, required: true},
  startDate: {type: Date, required: true},
  endDate: {type: Date, required: true},
  registrationDeadline: {type: Date, required: true},
  status: { type: String, required: true },
  image: {data: Buffer, contentType: String}
});

const Hackathon = mongoose.model('Hackathon', hackathonSchema, 'hackathon')
module.exports = Hackathon