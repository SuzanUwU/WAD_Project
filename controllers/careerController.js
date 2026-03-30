const Career = require('../models/careerModel');
const RSVP = require('../models/rsvpModel');
const Event = require('../models/eventModel');
const User = require('../models/user-model');
const categories = ['full-time', 'internship', 'workshop'];
const sectors = ['Information Technology', 'Banking', 'Marketing', 'Accounting', 'Human Resources', 'Consulting', 'Legal', 'Operations', 'Other'];

//handle incoming career/form req.body
function clean(body) {
  return {
    title: body.title?.trim(),
    organizer: body.organizer?.trim(),
    careerType: body.careerType?.trim(),
    description: body.description?.trim() || undefined,
    location: body.location?.trim() || undefined,
    image: body.image?.trim() || undefined,
    applyLink: body.applyLink?.trim() || undefined,
    sector: body.sector || undefined,
    salary: body.salary ? Number(body.salary) : undefined,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
    deadline: body.deadline ? new Date(body.deadline) : undefined,
    capacity: body.capacity ? Number(body.capacity) : undefined,
  };
}

function validate(data) {
  const error = [];
  if (!data.description) error.push('Description cannot be empty');
  if (data.startDate && data.endDate && data.startDate > data.endDate) error.push('End date must be later than start date.');
  if (data.deadline && data.startDate && data.deadline >= data.startDate) error.push('Deadline must be before start date.');
  return error;
}

// GET /career-events
exports.displayCareers = async (req, res) => {
  const careerType = req.query.careerType;
  const dateFrom = req.query.dateFrom;
  const dateTo = req.query.dateTo;
  const q = req.query.q?.trim() || '';
  const selectedSectors = Array.isArray(req.query.selectedSectors)
  ? req.query.selectedSectors
  : req.query.selectedSectors ? [req.query.selectedSectors] : [];
  let msg = req.query.msg || '';
  try {
    if (req.query.filtered && !careerType && !dateFrom && !dateTo && !q && !selectedSectors.length) {
      msg = 'No filters have been applied';
    }

    const filter = {};
    if (careerType) filter.careerType = careerType;
    if (selectedSectors.length) filter.sector = { $in: selectedSectors };
    if (dateFrom || dateTo) {
      filter.startDate = {};
      if (dateFrom) filter.startDate.$gte = new Date(dateFrom);
      if (dateTo) filter.startDate.$lte = new Date(dateTo);
    }
    if (q) filter.title = { $regex: q, $options: 'i' };

    const careerEvents = await Career.findWithFilter(filter);
    const rsvps = await RSVP.getUserRSVP(req.session.user.userId);
    const pinnedIDs = rsvps.map(r => r.event.toString());
    // const user = await User.findById(req.session.user.id); //add later when we have career admin
    // const isCareerAdmin = user?.admin_type === 'career-admin';
    res.render('career', {
      jobs: careerEvents.filter(e => e.careerType !== 'workshop'),
      workshops: careerEvents.filter(e => e.careerType === 'workshop'),
      pinned: careerEvents.filter(e => pinnedIDs.includes(e.eventId.toString())),
      rsvps,
      categories,
      sectors,
      selectedSectors,
      msg,
      careerType: careerType || '',
      dateFrom: dateFrom || '',
      dateTo: dateTo || '',
      q,
      isCareerAdmin:true
    });
  } catch (error) {
    res.status(500).send(error.message)
  }
};

// GET /career-events/detail
exports.careerDetail = async (req, res) => {
  try {
    const event = await Career.findByEventId(req.query.id);
    const registered = await RSVP.isAlreadyRsvp(req.query.id, req.session.user.userId);
    const confirmedCount = await RSVP.getDocCount(event.eventId,'confirmed');
    const waitlistCount = await RSVP.getDocCount(event.eventId,'waitlist');
    console.log(event,confirmedCount,waitlistCount)
    res.render('event-detail', { event, state: registered?.status, confirmedCount,waitlistCount });
  } catch (error) {
    res.status(500).send(error.message)
  }
};

// GET /career-events/form
exports.showCareerForm = async (req, res) => {
  try {
    const event = req.query.id ? await Career.findById(req.query.id) : null;
    res.render('career-form', {
      event,
      action: req.query.id ? '/career-events/career-update' : '/career-events/career-create',
      error: [],
      categories,
      sectors
    });
  } catch (error) {
    res.status(500).send(error.message)
  }
};

// POST /career-create
exports.createCareer = async (req, res) => {
  try {
    const data  = clean(req.body);
    const error = validate(data);
    if (await Career.findWithFilter({...data})) {
    error.push('An event with the same details already exists');
    }
    if (error.length > 0) {
      console.log(error);
      return res.render('career-form', { event: data, action: '/career-events/career-create', categories, sectors, error });
    }
    const event = await Event.create({
      title:       data.title,
      organizer:   data.organizer,
      category:    'Career',
      description: data.description,
      startDate:   data.startDate,
      endDate:     data.endDate,
      location:    data.location,
      image:       data.image,
      capacity:    data.capacity,
    });
    await Career.create({ eventId: event._id, ...data });
    res.redirect('/career-events?msg=Event+created');
  } catch (error) {
    res.send(error.message);
  }
};
// POST /career-events/career-update
exports.updateCareer = async (req, res) => {
  const { careerID } = req.body;
  try {
    const data  = clean(req.body);
    const error = validate(data);
    if (error.length > 0) {
      console.log(error);
      const event = await Career.findById(careerID);
      return res.render('career-form', { event, action: '/career-events/career-update', categories, sectors, error });
    }
    const career = await Career.findById(careerID);
    await Career.updateById(careerID, data);
    await Event.updateById(career.eventId, {
      title:       data.title,
      organizer:   data.organizer,
      category:    'Career',
      description: data.description,
      startDate:   data.startDate,
      endDate:     data.endDate,
      location:    data.location,
      image:       data.image,
      capacity:    data.capacity,
    });
    res.redirect('/career-events?msg=Event+updated');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// POST /career-events/career-delete
exports.deleteCareer = async (req, res) => {
  try {
    const career = await Career.findById(req.body.careerID);
    await RSVP.deleteByEventId(career.eventId);//maybe send a notification to affected user
    await Career.deleteById(req.body.careerID);
    await Event.deleteById(career.eventId);
    res.redirect('/career-events?msg=Event+deleted');
  } catch (error) {
    res.status(500).send(error.message)
  }
};