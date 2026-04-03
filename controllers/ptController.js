
const Job = require('../models/jobModel')
const Event = require('../models/eventModel')
//displays all job records 
exports.displayalljob = async (req, res) => {
    try {
        const joblist = await Job.displayJob();
        res.render('rowena/view-job', { joblist });
    } catch (error) {
        console.log(error);
        res.send('Unable to retrieve records');
    }
};

// filtering
exports.searchJob = async (req, res) => {
  const keyword = req.body.keyword;
  const money=req.body.money;

  try {
    const joblist = await Job.searchJob(keyword,money); 
     res.render('rowena/view-job', {joblist});
  } catch (error) {
    console.log(error);
    res.send("Search failed");
  }
};



exports.displayJobform = async (req, res) => {
    res.render('rowena/create-job', { msg: '', output: '' });
};


// function to create new job
exports.createNewJob = async (req, res) => {
    const data = req.body;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const hiringDate = new Date(data.hiringDate);

    try {
        if (hiringDate >= startDate) {
            return res.render('rowena/create-job', {
                msg: 'Hiring Date must be before Start Date',
                output: ''
            });
        }

        if (startDate >= endDate) {
            return res.render('rowena/create-job', {
                msg: 'Start Date of Job must be before End Date',
                output: ''
            });
        }

        if (hiringDate >= endDate) {
            return res.render('rowena/create-job', {
                msg: 'Hiring Date must be before End Date',
                output: ''
            });
        }

        const event = await Event.create({
            title: data.jobtitle,
            organizer: data.companyname,
            category: 'Part Time Jobs',
            description: data.jobdescription,
            startDate: startDate,
            endDate: endDate,
            image: data.companylogo || '/images/placeholder.png'
        });

         const job=await Job.createJob({
            eventId: event._id,
            companyname: data.companyname,
            companylogo: data.companylogo || '/images/placeholder.png',
            jobtitle: data.jobtitle,
            jobdescription: data.jobdescription,
            salary: Number(data.salary),
            startDate: startDate,
            endDate: endDate,
            hiringDate: hiringDate
        });
        if (job&&event){
            return res.render('rowena/create-job', {
            msg: '',
            output: 'Created job successfully'
        });

        }else {
            return res.render('rowena/create-job',{msg:'',output:'failed to create job'})
        }

      
    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.render('rowena/create-job', {
                msg: '',
                output: 'This job already exists'
            });
        }

        return res.render('rowena/create-job', {
            msg: '',
            output: 'Error creating job'
        });
    }
};



// retrieve job 
exports.retrieveJob = async (req, res) => {
    try {
        const id = req.query._id;
        const result = await Job.findById(id);

        if (!result) {
            return res.render('rowena/update-job', {
                found: null,
                msg: 'Job could not be found'
            });
        }else{

            res.render('rowena/update-job', {
            found: result,
            msg: ''
        });
        }

    
    } catch (error) {
        res.render('rowena/update-job', {
            found: null,
            msg: 'failed to retrieve record'
        });
    }
};

exports.editJob = async (req, res) => {
    try {
        const id = req.body._id;
        const data = req.body;

        const findjob = await Job.findById(id);

        if (!findjob) {
            return res.render('rowena/update-job', {
                found: null,
                msg: 'Job could not be found'
            });
        } else {

            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            const hiringDate = new Date(data.hiringDate);

            if (hiringDate >= startDate) {
                return res.render('rowena/update-job', {
                    found: findjob,
                    msg: 'Hiring Date must be before Start Date'
                });
            }

            if (startDate >= endDate) {
                return res.render('rowena/update-job', {
                    found: findjob,
                    msg: 'Start Date of Job must be before End Date'
                });
            }

            const updatedevents = await Event.updateById(
                findjob.eventId,
                {
                    title: data.jobtitle,
                    organizer: data.companyname,
                    category: 'Part Time Jobs',
                    description: data.jobdescription,
                    startDate: startDate,
                    endDate: endDate,
                    image:  data.companylogo || '/images/placeholder.png'
                }
            );

            const updatedjobs = await Job.updateById(
                id,
                {
                    eventId: findjob.eventId,
                    companyname: data.companyname,
                    companylogo:  data.companylogo || '/images/placeholder.png',
                    jobtitle: data.jobtitle,
                    jobdescription: data.jobdescription,
                    salary: Number(data.salary),
                    startDate: startDate,
                    endDate: endDate,
                    hiringDate: hiringDate
                }
            );

            if (updatedevents && updatedjobs) {
                return res.render('rowena/update-job', {
                    found: updatedjobs,
                    msg: 'Updated successfully'
                });
            } else {
                return res.render('rowena/update-job', {
                    found: findjob,
                    msg: 'Failed to update'
                });
            }
        }

    } catch (error) {
        console.log(error);
        return res.render('rowena/update-job', {
            found: null,
            msg: 'Failed to update record'
        });
    }
};

// delete job 

exports.getDeleteJob = async (req, res) => {
    const _id = req.query._id;

    try {
        const jobtobedeleted = await Job.findById(_id);

        if (!jobtobedeleted) {
            return res.send('Job not found');
        }else{ 
            const deletejob =await Job.deletejob(_id);
            const deleteevent = await Event.deleteById({ _id: jobtobedeleted.eventId });

            if (deletejob&&deleteevent){
                 res.redirect('/part-time-jobs');
        }
    }
        
        }catch (error) {
        console.log(error);
    
    }

};








