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

// ensures no duplicated records for jobcreation

jobSchema.index({ companyname: 1, jobtitle: 1, startDate: 1 },
    { unique: true }
);

const Job = mongoose.model('Job', jobSchema);

exports.displayJob = function(){
    return Job.find()
}
exports.createJob = function (createJob){
    return Job.create(createJob)
}


exports.findById = function (id){
    return Job.findById({_id:id})

};



exports.findByEventId = function(eventId) {
  return Job.find({ eventId }).populate('eventId');
}


exports.updateById = function(id, data) {
  return Job.updateOne({_id:id}, data);
}

exports.deletejob = function (id){ 
    return Job.findByIdAndDelete({_id:id})
}


exports.searchJob = function (keyword,salary) {
  let search = {} 

  if(keyword){
    search.$or= [  //works for string values only 
      { companyname: { $regex: keyword, $options: 'i' } },  // case insensitve
      { jobtitle: { $regex: keyword, $options: 'i' } },
      { jobdescription: { $regex: keyword, $options: 'i' } }
    ]
  }
  if (salary){
    search.salary= {$gte:salary}; // retrieve salary that is greater than entered amount
  }
  return Job.find(search);
}

