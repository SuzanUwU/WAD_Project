const Hackathon = require('../models/Hackathon');
const HackRegistration = require('../models/HackRegistration');
const RSVP = require('../models/rsvpModel');
const Event = require('../models/eventModel')
const School = require('../models/school-model');

// Helpers
// Returns all schools sorted by displayName
const getSchools = () => School.find({}).sort({ displayName: 1 });
const getPreloadedMajors = (schools) =>
  schools.flatMap(s => s.majors.map(m => ({ ...m.toObject(), schoolCode: s.code })));

// GET /hackathons for display
exports.showHackathons = async (req, res) => {
  try {
    const query = {
      school:  req.query.school  || '',
      major:   req.query.major   || '',
      status:  req.query.status  || '',
      success: req.query.success || null,
      error:   req.query.error   || null,
    };
    const filter = { category: 'Hackathon' };
    if (query.school && query.school !== 'open')
      filter.eligibleSchools = { $in: [query.school, 'open'] };
    if (query.major && query.major !== 'open')
      filter.eligibleMajors = { $in: [query.major, 'open'] };
    if (query.status)
      filter.status = query.status;

    const [hackathons, schools] = await Promise.all([
      Hackathon.findAll(filter),
      getSchools(),
    ]);

    // Build flat major lookup map { code -> name } from embedded majors
    const majorsData = schools.flatMap(s => s.majors);
    res.render('ari/display-hackathon', { hackathons, schools, majorsData, query, user: req.session.user });

  } catch (err) {
    console.error('Error fetching hackathons:', err.message);
    res.status(500).send('Server error: could not load hackathons.');
  }
};

// GET/api/majors?school=xxx for dynamic dropdown
exports.getMajorsBySchool = async (req, res) => {
  try {
    const { school } = req.query;
    if (!school) return res.json([]);
    const schoolDoc = await School.findOne({ code: school }, 'majors'); // Majors are embedded, just find the school and return its majors array
    if (!schoolDoc) return res.json([]);
    return res.json(schoolDoc.majors);

  } catch (err) {
    console.error('Error fetching majors:', err.message);
    return res.status(500).json([]);
  }
};

// GET /new — blank create form
exports.showCreateForm = async (req, res) => {
  try {
    const schools = await getSchools(); // preloadedMajors: all majors from all schools for the form checkboxes
    res.render('ari/create-hackathon', {
      hackathon: {}, schools, preloadedMajors: getPreloadedMajors(schools), errors: [],
    });

  } catch (err) {
    console.error('Error loading create form:', err.message);
    res.status(500).send('Server error: could not load create form.');
  }
};

// POST /new — validate and save new hackathon
exports.createHackathon = async (req, res) => {
  const { title, name, description, location, eligibleSchools, eligibleMajors, teamSizeMin, teamSizeMax, capacity, startDate, endDate, registrationDeadline, status,image} = req.body;
  const errors = [];
  if (!title || title.trim() === '') errors.push('Title is required.');
  if (!name || name.trim() === '') errors.push('Name is required.');
  if (!description || description.trim() === '') errors.push('Description is required.');
  if (!location || location.trim() === '') errors.push('Location is required.');
  if (!eligibleSchools || eligibleSchools.length === 0) errors.push('At least one eligible school must be selected.');
  if (!eligibleMajors  || eligibleMajors.length  === 0) errors.push('At least one eligible major must be selected.');

  const min = parseInt(teamSizeMin), max = parseInt(teamSizeMax);
  if (isNaN(min) || min < 1) errors.push('Minimum team size must be at least 1.');
  if (isNaN(max) || max < 1) errors.push('Maximum team size must be at least 1.');
  if (!isNaN(min) && !isNaN(max) && min > max) errors.push('Minimum team size cannot be greater than maximum.');

  const cap = parseInt(capacity);
  if (isNaN(cap) || cap < 1) errors.push('Capacity must be at least 1.');

  const start = new Date(startDate), end = new Date(endDate), deadline = new Date(registrationDeadline);
  if (!startDate || isNaN(start)) errors.push('A valid start date is required.');
  if (!endDate   || isNaN(end)) errors.push('A valid end date is required.');
  if (!registrationDeadline || isNaN(deadline)) errors.push('A valid registration deadline is required.');
  if (!isNaN(start) && !isNaN(end) && end <= start) errors.push('End date must be after start date.');
  if (!isNaN(deadline) && !isNaN(start) && deadline >= start) errors.push('Registration deadline must be before the start date.');

  const validStatuses = ['upcoming', 'open', 'closed', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) errors.push('A valid status must be selected.');

  if (errors.length > 0) {
    const schools = await getSchools();
    return res.status(422).render('ari/create-hackathon', {
      hackathon: req.body, schools, preloadedMajors: getPreloadedMajors(schools), errors,
    });
  }

  try {    
    
    const newEvent = await Event.create({ // Create Event doc first to get its _id
      title: title.trim(),
      organizer: name.trim(), // hackathon.name maps to Event.organizer
      category: 'Hackathon',
      description: description.trim(),
      startDate: start,
      endDate: end,
      location: location.trim(),
      capacity: cap,
      image: image.trim()? image.trim():'placeholder.jpg'
    });

    // Create Hackathon doc with eventId reference
    await Hackathon.createHackathon({
      eventId: newEvent._id,
      title: title.trim(), 
      name: name.trim(), 
      description: description.trim(),
      location: location.trim(),
      category: 'Hackathon',
      eligibleSchools: Array.isArray(eligibleSchools) ? eligibleSchools : [eligibleSchools],
      eligibleMajors:  Array.isArray(eligibleMajors)  ? eligibleMajors  : [eligibleMajors],
      teamSizeMin: min, teamSizeMax: max, capacity: cap,
      startDate: start, endDate: end, registrationDeadline: deadline,
      status,
      image: image.trim()? image.trim():'placeholder.jpg'
    });
    res.redirect('/hack-events/hackathons?success=created');

  } catch (err) {
    const isDup = err.code === 11000 && err.keyPattern?.title;
    const schools = await getSchools();
    return res.status(500).render('ari/create-hackathon', {
      hackathon: req.body, schools, preloadedMajors: getPreloadedMajors(schools),
      errors: [isDup ? 'A hackathon with that title already exists.' : 'An unexpected server error occurred.'],
    });
  }
};

// GET /:id/edit — pre-filled edit form
exports.showEditForm = async (req, res) => {
  try {
    const [hackathon, schools] = await Promise.all([
      Hackathon.findById(req.params.id),
      getSchools(),
    ]);
    if (!hackathon) return res.status(404).send('Hackathon not found.');
    res.render('ari/edit-hackathon', {
      hackathon, schools, preloadedMajors: getPreloadedMajors(schools), errors: [],
    });

  } catch (err) {
    console.error('Error loading edit form:', err.message);
    res.status(500).send('Server error: could not load edit form.');
  }
};

// POST /:id/edit — validate and update
exports.updateHackathon = async (req, res) => {
  const { title, name, description, location, eligibleSchools, eligibleMajors, teamSizeMin, teamSizeMax, capacity, startDate, endDate, registrationDeadline, status, image} = req.body;
  const errors = [];
  if (!title || title.trim() === '') errors.push('Title is required.');
  if (!name || name.trim() === '') errors.push('Name is required.');
  if (!description || description.trim() === '') errors.push('Description is required.');
  if (!location || location.trim() === '') errors.push('Location is required.');
  if (!eligibleSchools || eligibleSchools.length === 0) errors.push('At least one eligible school must be selected.');
  if (!eligibleMajors  || eligibleMajors.length  === 0) errors.push('At least one eligible major must be selected.');

  const min = parseInt(teamSizeMin), max = parseInt(teamSizeMax);
  if (isNaN(min) || min < 1) errors.push('Minimum team size must be at least 1.');
  if (isNaN(max) || max < 1) errors.push('Maximum team size must be at least 1.');
  if (!isNaN(min) && !isNaN(max) && min > max) errors.push('Minimum team size cannot be greater than maximum.');

  const cap = parseInt(capacity);
  if (isNaN(cap) || cap < 1) errors.push('Capacity must be at least 1.');

  const start = new Date(startDate), end = new Date(endDate), deadline = new Date(registrationDeadline);
  if (!startDate || isNaN(start)) errors.push('A valid start date is required.');
  if (!endDate   || isNaN(end)) errors.push('A valid end date is required.');
  if (!registrationDeadline || isNaN(deadline)) errors.push('A valid registration deadline is required.');
  if (!isNaN(start) && !isNaN(end) && end <= start) errors.push('End date must be after start date.');
  if (!isNaN(deadline) && !isNaN(start) && deadline >= start) errors.push('Registration deadline must be before the start date.');

  const validStatuses = ['upcoming', 'open', 'closed', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) errors.push('A valid status must be selected.');

  if (errors.length > 0) {
    const [hackathon, schools] = await Promise.all([Hackathon.findById(req.params.id), getSchools()]);
    return res.status(422).render('ari/edit-hackathon', {
      hackathon: { ...hackathon.toObject(), ...req.body },
      schools, preloadedMajors: getPreloadedMajors(schools), errors,
    });
  }

  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.status(404).send('Hackathon not found.');

    const updateData = {
      title: title.trim(), name: name.trim(), description: description.trim(), location: location.trim(),
      eligibleSchools: Array.isArray(eligibleSchools) ? eligibleSchools : [eligibleSchools],
      eligibleMajors:  Array.isArray(eligibleMajors)  ? eligibleMajors  : [eligibleMajors],
      teamSizeMin: min, teamSizeMax: max, capacity: cap,
      startDate: start, endDate: end, registrationDeadline: deadline, status,
      image: image.trim()? image.trim():'placeholder.jpg'
    };

    await Hackathon.updateById(req.params.id, updateData);
    
    // Keep Event doc in sync if it exists
    if (hackathon.eventId) {
      await Event.updateById(hackathon.eventId , {
        title: title.trim(), organizer: name.trim(), description: description.trim(),
        startDate: start, endDate: end, location: location.trim(), capacity: cap, image: image.trim()? image.trim():'placeholder.jpg'
      });
    }

    res.redirect('/hack-events/hackathons?success=updated');

  } catch (err) {
    // console.error('updateHackathon ERROR:', err);
    const isDup = err.code === 11000 && err.keyPattern?.title;
    const [hackathon, schools] = await Promise.all([Hackathon.findById(req.params.id), getSchools()]);
    return res.status(500).render('ari/edit-hackathon', {
      hackathon: { ...hackathon.toObject(), ...req.body },
      schools, preloadedMajors: getPreloadedMajors(schools),
      errors: [isDup ? 'That title is already taken.' : 'An unexpected server error occurred.'],
    });
  }
};

// POST /:id/delete — delete hackathon
exports.deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.redirect('/hack-events/hackathons?error=notfound');
 
    // Delete all team registrations for this hackathon
    await HackRegistration.deleteByHackathon(hackathon._id);
 
    // Delete linked Event doc and its RSVPs if they exist
    if (hackathon.eventId) {
      await RSVP.deleteByEventId(hackathon.eventId);
      await Event.deleteById( hackathon.eventId );
    }
    await Hackathon.deleteById(req.params.id);
    res.redirect('/hack-events/hackathons?success=deleted');

  } catch (err) {
    console.error('Error deleting hackathon:', err.message);
    res.redirect('/hack-events/hackathons?error=deletefailed');
  }
};