
const Job =require('../models/jobModel')
const Event = require('../models/eventModel')

//displays all job records 

exports.displayalljob = async (req, res) => {
    try {
        const joblist = await Job.find();
        res.render('rowena/view-job', { joblist });
    } catch (error) {
        console.log(error);
        res.send('Unable to retrieve records');
    }
};

exports.displayJobform = async (req, res) => {
    res.render('rowena/create-job', { msg: '', output: '' });
};

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
            image: data.companylogo
        });

        await Job.create({
            eventId: event._id,
            companyname: data.companyname,
            companylogo: data.companylogo,
            jobtitle: data.jobtitle,
            jobdescription: data.jobdescription,
            salary: Number(data.salary),
            startDate: startDate,
            endDate: endDate,
            hiringDate: hiringDate
        });

        return res.render('rowena/create-job', {
            msg: '',
            output: 'Created job successfully'
        });
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
        const _id = req.query._id;

        if (!_id) {
            return res.render('rowena/update-job', {
                found: null,
                msg: 'No job id provided'
            });
        }

        const result = await Job.findById(_id);

        if (!result) {
            return res.render('rowena/update-job', {
                found: null,
                msg: 'Job could not be found'
            });
        }

        res.render('rowena/update-job', {
            found: result,
            msg: ''
        });

    } catch (error) {
        res.render('rowena/update-job', {
            found: null,
            msg: 'failed to retrieve record'
        });
    }
};


// edit job 
exports.editJob = async (req, res) => {
    let findjob = null;

    try {
        const id = req.body._id;
        const data = req.body;

        if (!id) {
            return res.render('rowena/update-job', {
                found: null,
                msg: 'No job id submitted'
            });
        }

        findjob = await Job.findById(id);

        if (!findjob) {
            return res.render('rowena/update-job', {
                found: null,
                msg: 'failed to retrieve job'
            });
        }

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

        if (hiringDate >= endDate) {
            return res.render('rowena/update-job', {
                found: findjob,
                msg: 'Hiring Date must be before End Date'
            });
        }

        await Event.updateById(
            { _id: findjob.eventId },
            {
                title: data.jobtitle,
                organizer: data.companyname,
                category: 'Part Time Jobs',
                description: data.jobdescription,
                startDate: startDate,
                endDate: endDate,
                image: data.companylogo
            }
        );

        await Job.updateOne(
            { _id: id },
            {
                eventId: findjob.eventId,
                companyname: data.companyname,
                companylogo: data.companylogo,
                jobtitle: data.jobtitle,
                jobdescription: data.jobdescription,
                salary: Number(data.salary),
                startDate: startDate,
                endDate: endDate,
                hiringDate: hiringDate
            }
        );

        const updatedJob = await Job.findById(id);

        res.render('rowena/update-job', {
            found: updatedJob,
            msg: 'updated successfully'
        });

    } catch (error) {
        console.log('editJob error:', error);
        res.render('rowena/update-job', {
            found: findjob,
            msg: 'failed to update'
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
        }

        await Job.findByIdAndDelete(_id);

        await Event.deleteById({ _id: jobtobedeleted.eventId });
        
        res.redirect('/events/part-time-jobs');

        }catch (error) {
        console.log(error);
    
    }
};

// search function 
