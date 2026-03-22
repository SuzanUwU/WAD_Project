// const { schoolsData, majorsData, getMajorsBySchoolCode } = require('../data/schools-majors-data');
const Hackathon = require('../models/Hackathon');
const School = require('./../models/School');
const Major = require('./../models/Major');


// fetch all schools from db
const getSchools = ()=> School.find({}).sort({name: 1})
// fetch all majors from db
const getAllMajors = ()=> major.find({})
// fetch majors for a specific school code
const getMajorsByCode = (schoolCode) =>
  Major.find({}).then(majors => majors.filter(m => {
    // Major.school is an ObjectId — match the school's code by joining through the school documents fetched separately
    return true; 
  }));

// GET /hackathons for display
exports.showHackathons = async (req, res) => {
  try {
    const query = {
      school:  req.query.school  || '',
      major:   req.query.major   || '',
      status:  req.query.status  || '',
      success: req.query.success || null,
      error: req.query.error || null,
    };

    const filter = { category: 'Hackathons' };

    if (query.school && query.school !== 'open')
      filter.eligibleSchools = { $in: [query.school, 'open'] };

    if (query.major && query.major !== 'open')
      filter.eligibleMajors = { $in: [query.major, 'open'] };

    if (query.status)
      filter.status = query.status;

    // Run hackathon query, school fetch, and major fetch in parallel
    const [hackathons, schools, majors] = await Promise.all([
      Hackathon.find(filter).sort({ startDate: 1 }),
      School.find({}).sort({ name: 1 }),
      Major.find({}),
    ]);

    res.render('ari/display-hackathon', { hackathons, schools, majorsData: majors, query });

  } catch (err) { 
    console.error('Error fetching hackathons:', err.message);
    res.status(500).send('Server error: could not load hackathons.');
  }
};

// GET /hackathons/api/majors?school=xxx
exports.getMajorsBySchool = async (req, res) => {
  try {
    const { school } = req.query;
    if (!school) return res.json([]);

    // Find the school document to get its _id
    const schoolDoc = await School.findOne({ code: school });
    if (!schoolDoc) return res.json([]);

    // Find all majors that reference this school's _id
    const majors = await Major.find({ school: schoolDoc._id });
    return res.json(majors);

  } catch (err) {
    console.error('Error fetching majors:', err.message);
    return res.status(500).json([]);
  }

};

// GET /hackathons/new — blank create form
exports.showCreateForm = async (req, res) => {
  try {
    const [schools, preloadedMajors] = await Promise.all([
      School.find({}).sort({ name: 1 }),
      Major.find({}),
    ]);

    res.render('ari/create-hackathon', {
      hackathon:       {},
      schools,
      preloadedMajors,
      errors:          [],
    });

  } catch (err) {
    console.error('Error loading create form:', err.message);
    res.status(500).send('Server error: could not load create form.');
  }

};

// POST /hackathons/new — validate and save new hackathon
exports.createHackathon = async (req, res) => {
  const {
    title, name, description,
    eligibleSchools, eligibleMajors,
    teamSizeMin, teamSizeMax,
    startDate, endDate, registrationDeadline,
    status,
  } = req.body;

  // Form validation
  const errors = [];
 
  if (!title || title.trim() === '')           errors.push('Title is required.');
  if (!name || name.trim() === '')             errors.push('Name is required.');
  if (!description || description.trim() === '') errors.push('Description is required.');
  if (!eligibleSchools || eligibleSchools.length === 0)
    errors.push('At least one eligible school must be selected.');
  if (!eligibleMajors || eligibleMajors.length === 0)
    errors.push('At least one eligible major must be selected.');
 
  const min = parseInt(teamSizeMin);
  const max = parseInt(teamSizeMax);
 
  if (isNaN(min) || min < 1)  errors.push('Minimum team size must be at least 1.');
  if (isNaN(max) || max < 1)  errors.push('Maximum team size must be at least 1.');
  if (!isNaN(min) && !isNaN(max) && min > max)
    errors.push('Minimum team size cannot be greater than maximum team size.');
 
  const start    = new Date(startDate);
  const end      = new Date(endDate);
  const deadline = new Date(registrationDeadline);
 
  if (!startDate || isNaN(start))           errors.push('A valid start date is required.');
  if (!endDate || isNaN(end))               errors.push('A valid end date is required.');
  if (!registrationDeadline || isNaN(deadline)) errors.push('A valid registration deadline is required.');
  if (!isNaN(start) && !isNaN(end) && end <= start)
    errors.push('End date must be after start date.');
  if (!isNaN(deadline) && !isNaN(start) && deadline >= start)
    errors.push('Registration deadline must be before the start date.');
 
  const validStatuses = ['upcoming', 'open', 'closed', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status))
    errors.push('A valid status must be selected.');
 
  if (errors.length > 0) {
    const [schools, preloadedMajors] = await Promise.all([
      School.find({}).sort({ name: 1 }),
      Major.find({}),
    ]);
    return res.status(422).render('ari/create-hackathon', {
      hackathon: req.body,
      schools,
      preloadedMajors,
      errors,
    });
  }
 
  try {
    const imageData = req.file
      ? { data: req.file.buffer, contentType: req.file.mimetype }
      : undefined;
 
    await Hackathon.create({
      title:                title.trim(),
      name:                 name.trim(),
      description:          description.trim(),
      category:             'Hackathons',
      eligibleSchools:      Array.isArray(eligibleSchools) ? eligibleSchools : [eligibleSchools],
      eligibleMajors:       Array.isArray(eligibleMajors)  ? eligibleMajors  : [eligibleMajors],
      teamSizeMin:          min,
      teamSizeMax:          max,
      startDate:            start,
      endDate:              end,
      registrationDeadline: deadline,
      status,
      ...(imageData && { image: imageData }),
    });
 
    res.redirect('/events/hackathons?success=created');
 
  } catch (err) {
    const isDuplicateTitle = err.code === 11000 && err.keyPattern?.title;
    const [schools, preloadedMajors] = await Promise.all([
      School.find({}).sort({ name: 1 }),
      Major.find({}),
    ]);
    return res.status(500).render('ari/create-hackathon', {
      hackathon: req.body,
      schools,
      preloadedMajors,
      errors: [isDuplicateTitle
        ? 'A hackathon with that title already exists. Please choose a different title.'
        : 'An unexpected server error occurred. Please try again.'],
    });
  }
};

// GET /hackathons/:id/edit — pre-filled edit form
exports.showEditForm = async (req, res) => {
  try {
    const [hackathon, schools, preloadedMajors] = await Promise.all([
      Hackathon.findById(req.params.id),
      School.find({}).sort({ name: 1 }),
      Major.find({}),
    ]);

    if (!hackathon) return res.status(404).send('Hackathon not found.');

    res.render('ari/edit-hackathon', {
      hackathon,
      schools,
      preloadedMajors,
      errors: [],
    });

  } catch (err) {
    console.error('Error loading edit form:', err.message);
    res.status(500).send('Server error: could not load edit form.');
  }
};


// POST /hackathons/:id/edit — validate and update
exports.updateHackathon = async (req, res) => {
  const {
    title, name, description,
    eligibleSchools, eligibleMajors,
    teamSizeMin, teamSizeMax,
    startDate, endDate, registrationDeadline,
    status,
  } = req.body;

  const errors = [];
 
  if (!title || title.trim() === '')           errors.push('Title is required.');
  if (!name || name.trim() === '')             errors.push('Name is required.');
  if (!description || description.trim() === '') errors.push('Description is required.');
  if (!eligibleSchools || eligibleSchools.length === 0)
    errors.push('At least one eligible school must be selected.');
  if (!eligibleMajors || eligibleMajors.length === 0)
    errors.push('At least one eligible major must be selected.');
 
  const min = parseInt(teamSizeMin);
  const max = parseInt(teamSizeMax);
 
  if (isNaN(min) || min < 1)  errors.push('Minimum team size must be at least 1.');
  if (isNaN(max) || max < 1)  errors.push('Maximum team size must be at least 1.');
  if (!isNaN(min) && !isNaN(max) && min > max)
    errors.push('Minimum team size cannot be greater than maximum team size.');
 
  const start    = new Date(startDate);
  const end      = new Date(endDate);
  const deadline = new Date(registrationDeadline);
 
  if (!startDate || isNaN(start))           errors.push('A valid start date is required.');
  if (!endDate || isNaN(end))               errors.push('A valid end date is required.');
  if (!registrationDeadline || isNaN(deadline)) errors.push('A valid registration deadline is required.');
  if (!isNaN(start) && !isNaN(end) && end <= start)
    errors.push('End date must be after start date.');
  if (!isNaN(deadline) && !isNaN(start) && deadline >= start)
    errors.push('Registration deadline must be before the start date.');
 
  const validStatuses = ['upcoming', 'open', 'closed', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status))
    errors.push('A valid status must be selected.');
 
  if (errors.length > 0) {
    const [hackathon, schools, preloadedMajors] = await Promise.all([
      Hackathon.findById(req.params.id),
      School.find({}).sort({ name: 1 }),
      Major.find({}),
    ]);
    return res.status(422).render('ari/edit-hackathon', {
      hackathon: { ...hackathon.toObject(), ...req.body },
      schools,
      preloadedMajors,
      errors,
    });
  }
 
  try {
    // Build update object
    const updateData = {
      title:                title.trim(),
      name:                 name.trim(),
      description:          description.trim(),
      eligibleSchools:      Array.isArray(eligibleSchools) ? eligibleSchools : [eligibleSchools],
      eligibleMajors:       Array.isArray(eligibleMajors)  ? eligibleMajors  : [eligibleMajors],
      teamSizeMin:          min,
      teamSizeMax:          max,
      startDate:            start,
      endDate:              end,
      registrationDeadline: deadline,
      status,
    };
 
    // Only overwrite the image if a new file was uploaded — otherwise keep existing
    if (req.file) {
      updateData.image = { data: req.file.buffer, contentType: req.file.mimetype };
    }
 
    await Hackathon.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
 
    res.redirect('/events/hackathons?success=updated');
 
  } catch (err) {
    const isDuplicateTitle = err.code === 11000 && err.keyPattern?.title;
    const [hackathon, schools, preloadedMajors] = await Promise.all([
      Hackathon.findById(req.params.id),
      School.find({}).sort({ name: 1 }),
      Major.find({}),
    ]);
    return res.status(500).render('ari/edit-hackathon', {
      hackathon: { ...hackathon.toObject(), ...req.body },
      schools,
      preloadedMajors,
      errors: [isDuplicateTitle
        ? 'That title is already taken by another hackathon. Please choose a different title.'
        : 'An unexpected server error occurred. Please try again.'],
    });
  }
};


// POST /hackathons/:id/delete — delete hackathon
exports.deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.redirect('/events/hackathons?error=notfound');

    await Hackathon.findByIdAndDelete(req.params.id);
    res.redirect('/events/hackathons?success=deleted');

  } catch (err) {
    console.error('Error deleting hackathon:', err.message);
    res.redirect('/events/hackathons?error=deletefailed');
  }
};