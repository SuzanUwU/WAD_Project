const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    companyname: { type: String, required: true },
    companylogo: { type: String, required: true },
    jobtitle: { type: String, required: true },
    jobdescription: { type: String, required: true },
    salary: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    hiringDate: { type: Date, required: true }
});

jobSchema.index(
    { companyname: 1, jobtitle: 1, startDate: 1 },
    { unique: true }
);

const Job = mongoose.model('Job', jobSchema);

// ================= SEARCH =================
exports.searchJob = function (keyword, salary) {
  let search = {};

  // KEYWORD SEARCH
  if (keyword && keyword.trim() !== "") {
    search.$or = [
      { jobtitle: { $regex: keyword, $options: 'i' } },
      { companyname: { $regex: keyword, $options: 'i' } },
      { jobdescription: { $regex: keyword, $options: 'i' } }
    ];
  }

  // SALARY FILTER (FIXED)
  if (salary && !isNaN(salary)) {
    search.salary = { $gte: Number(salary) };
  }

  return Job.find(search);
};

module.exports = Job;