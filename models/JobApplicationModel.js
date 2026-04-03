const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema ({
    userid: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    jobid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true 
    },
    appliedDate:{
        type:Date,
        default:Date.now
    }, status:{
        type:String,
        enum:['pending','accepted','rejected','completed'],
        default:'pending'
    },
    jobreview:{
        ratings:{
            type:Number,
            min:0,
            max:5
        },
        comments:{
            type:String,
        }
    }

    });

jobApplicationSchema.index({userid:1,jobid:1}, {unique:true});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);


// retrieve all applied applications 

exports.displayall = function (){
    return jobApplicationSchema.find()
}

//create new record 

exports.createApplication = function (createApp){
    return jobApplicationSchema.create(createApp)
}
// retrieve any duplicate records 

exports.retrieveduplicates = function (userid,jobid){
    return jobApplicationSchema.find({userid,jobid})
}

//retrieve application based on status 
exports.findByStatus = function(userid, status) {
    return jobApplicationSchema.find({ userid, status }).populate('jobid'); // match schema field
}


// delete job application 

exports.findByIdAndDelete = function(id) {
    return jobApplicationSchema.findByIdAndDelete(id);
}

// update status
exports.updateStatus = function (id,status){
    return jobApplicationSchema.findByIdandUpdate(id,{status:status})
}

exports.updateReview = function (id,review){
    return jobApplicationSchema.findByIdandUpdate(id,{jobreview:review})
}


