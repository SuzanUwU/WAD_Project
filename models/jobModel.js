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


exports.findJob = function (){
  return Job.find()
}


exports.createJob = function (job){
  return Job.create(job)
}


exports.findById = function(id) {
  return Job.findOne({ _id: id });
}


exports.updateById = function(id, data) {
  return Job.updateOne({_id:id}, data);
}

exports.deleteById = function(id) {
  return Job.findByIdAndDelete(id);
};


exports.searchJob = function (keyword,salary) {
  let search = {} 

  if(keyword){
    search.$or= [  //works for string values only 
      { jobtitle: { $regex: keyword, $options: 'i' } },  // case insensitve
      { company: { $regex: keyword, $options: 'i' } },
      { jobdescription: { $regex: keyword, $options: 'i' } }
    ]
  }
  if (salary){
    search.salary= {$gte:salary}; // retrieve salary that is greater than entered amount
  }
  return Job.find(search);
}

module.exports = Job;