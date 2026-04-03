const Career = require('../models/careerModel');
const RSVP = require('../models/rsvpModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
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
    image: body.image?.trim() || "default-cover.jpg",
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
  if (!data.title) error.push('Title cannot be empty');
  if (!data.organizer) error.push('Organizer cannot be empty');
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
    res.render('yujia/career', {
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
      user:req.session.user
    });
  } catch (error) {
    res.status(500).send(error.message)
  }
};

// GET /career-events/:id
exports.careerDetail = async (req, res) => {
  try {
    console.log(req.params.id)
    const event = await Career.findByEventId(req.params.id);
    const registered = await RSVP.isAlreadyRsvp(req.params.id, req.session.user.userId);
    const confirmedCount = await RSVP.getDocCount(event.eventId,'confirmed');
    const waitlistCount = await RSVP.getDocCount(event.eventId,'waitlist');
    res.render('yujia/event-detail', { event, state: registered?.status, confirmedCount, waitlistCount });
  } catch (error) {
    res.status(500).send(error.message)
  }
};

// GET /career-events/form
exports.showCareerForm = async (req, res) => {
  try {
    const event = req.query.id ? await Career.findById(req.query.id) : null;
    res.render('yujia/career-form', {
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
    
    if (error.length > 0) {
      console.log(error);
      return res.render('yujia/career-form', { event: data, action: '/career-events/career-create', categories, sectors, error });
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
      return res.render('yujia/career-form', { event, action: '/career-events/career-update', categories, sectors, error });
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