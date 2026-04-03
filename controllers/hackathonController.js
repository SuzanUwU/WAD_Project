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

const validate = (data) => {
  const { title, name, description, location, eligibleSchools, eligibleMajors, teamSizeMin, teamSizeMax, capacity, startDate, endDate, registrationDeadline, status, image} = data;
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
  
  return { 
    errors, 
    parsed: {
      title: title?.trim() || '',
      name: name?.trim() || '',
      description: description?.trim() || '',
      location: location?.trim() || '',
      eligibleSchools: Array.isArray(eligibleSchools) ? eligibleSchools : [eligibleSchools],
      eligibleMajors: Array.isArray(eligibleMajors) ? eligibleMajors : [eligibleMajors],
      status,
      image: image?.trim() || '', 
      min,
      max,
      cap,
      start,
      end,
      deadline
    }
  };
}


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
  const { errors, parsed } = validate(req.body);
  if (errors.length > 0) {
    const schools = await getSchools();
    return res.status(422).render('ari/create-hackathon', {
      hackathon: req.body, schools, preloadedMajors: getPreloadedMajors(schools), errors,
    });
  }

  try {
    const newEvent = await Event.create({
      title: parsed.title,           
      organizer: parsed.name,        
      category: 'Hackathon',
      description: parsed.description, 
      startDate: parsed.start,       
      endDate: parsed.end,           
      location: parsed.location,     
      capacity: parsed.cap,          
      image: parsed.image
    });

    // Create Hackathon doc with parsed values
    await Hackathon.createHackathon({
      eventId: newEvent._id,
      title: parsed.title,
      name: parsed.name,
      description: parsed.description,
      location: parsed.location,
      category: 'Hackathon',
      eligibleSchools: parsed.eligibleSchools,  
      eligibleMajors: parsed.eligibleMajors,    
      teamSizeMin: parsed.min,      
      teamSizeMax: parsed.max,      
      capacity: parsed.cap,         
      startDate: parsed.start,
      endDate: parsed.end,    
      registrationDeadline: parsed.deadline,
      status: parsed.status,
      image: parsed.image
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
// POST /:id/edit — validate and update
exports.updateHackathon = async (req, res) => {
  const { errors, parsed } = validate(req.body);
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
      title: parsed.title,
      name: parsed.name,
      description: parsed.description,
      location: parsed.location,
      category: 'Hackathon',
      eligibleSchools: parsed.eligibleSchools,  
      eligibleMajors: parsed.eligibleMajors,    
      teamSizeMin: parsed.min,      
      teamSizeMax: parsed.max,      
      capacity: parsed.cap,         
      startDate: parsed.start,
      endDate: parsed.end,    
      registrationDeadline: parsed.deadline,
      status: parsed.status,
      image: parsed.image
    };

    await Hackathon.updateById(req.params.id, updateData);
    
    // Keep Event doc in sync (use existing hackathon.eventId)
    if (hackathon.eventId) {
      await Event.updateById(hackathon.eventId, {
        title: parsed.title,           
        organizer: parsed.name,        
        category: 'Hackathon',
        description: parsed.description, 
        startDate: parsed.start,       
        endDate: parsed.end,           
        location: parsed.location,     
        capacity: parsed.cap,          
        image: parsed.image 
      });
    }

    res.redirect('/hack-events/hackathons?success=updated');

  } catch (err) {
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