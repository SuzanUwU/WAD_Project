const Job = require('../models/jobModel');
const eventModel = require('../models/eventModel');

// ================= DISPLAY ALL =================
exports.displayalljob = async (req, res) => {
    try {
        const joblist = await Job.find();
        res.render('rowena/view-job', { joblist });
    } catch (error) {
        console.log(error);
        res.send('Unable to retrieve records');
    }
};

// ================= SEARCH =================
exports.searchJob = async (req, res) => {
    const keyword = req.body.keyword;
    const money = req.body.money;

    try {
        const joblist = await Job.searchJob(keyword, money);
        res.render('rowena/view-job', { joblist });
    } catch (error) {
        console.log(error);
        res.send("Search failed");
    }
};

// ================= SHOW FORM =================
exports.displayJobform = async (req, res) => {
    res.render('rowena/create-job', { msg: '', output: '' });
};

// ================= CREATE =================
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
                msg: 'Start Date must be before End Date',
                output: ''
            });
        }

        if (hiringDate >= endDate) {
            return res.render('rowena/create-job', {
                msg: 'Hiring Date must be before End Date',
                output: ''
            });
        }

        const event = await eventModel.create({
            title: data.jobtitle,
            organizer: data.companyname,
            category: 'Part Time Job',
            description: data.jobdescription,
            startDate,
            endDate,
            image: data.companylogo || '/images/placeholder.png'
        });

        const job = await Job.create({
            eventId: event._id,
            companyname: data.companyname,
            companylogo: data.companylogo || '/images/placeholder.png',
            jobtitle: data.jobtitle,
            jobdescription: data.jobdescription,
            salary: Number(data.salary),
            startDate,
            endDate,
            hiringDate
        });

        if (job && event) {
            return res.render('rowena/create-job', {
                msg: '',
                output: 'Created job successfully'
            });
        } else {
            return res.render('rowena/create-job', {
                msg: '',
                output: 'Failed to create job'
            });
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

// ================= RETRIEVE =================
exports.retrieveJob = async (req, res) => {
    try {
        const id = req.query._id;
        const result = await Job.findById(id);

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
            msg: 'Failed to retrieve record'
        });
    }
};

// ================= UPDATE =================
exports.editJob = async (req, res) => {
    try {
        const id = req.body._id;
        const data = req.body;

        const findjob = await Job.findById(id);

        if (!findjob) {
            return res.render('rowena/update-job', {
                found: null,
                msg: 'Job not found'
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
                msg: 'Start Date must be before End Date'
            });
        }

        await eventModel.updateById(findjob.eventId, {
            title: data.jobtitle,
            organizer: data.companyname,
            category: 'Part Time Job',
            description: data.jobdescription,
            startDate,
            endDate,
            image: data.companylogo || '/images/placeholder.png'
        });

        const updatedjob = await Job.findByIdAndUpdate(id, {
            companyname: data.companyname,
            companylogo: data.companylogo || '/images/placeholder.png',
            jobtitle: data.jobtitle,
            jobdescription: data.jobdescription,
            salary: Number(data.salary),
            startDate,
            endDate,
            hiringDate
        }, { new: true });

        return res.render('rowena/update-job', {
            found: updatedjob,
            msg: 'Updated successfully'
        });

    } catch (error) {
        console.log(error);
        return res.render('rowena/update-job', {
            found: null,
            msg: 'Failed to update'
        });
    }
};

// ================= DELETE =================
exports.getDeleteJob = async (req, res) => {
    const _id = req.query._id;

    try {
        const job = await Job.findById(_id);

        if (!job) {
            return res.send('Job not found');
        }

        await Job.findByIdAndDelete(_id);

        await eventModel.deleteById(job.eventId);

        res.redirect('/part-time-jobs'); 

    } catch (error) {
        console.log(error);
    }
};