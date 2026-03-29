// const { schoolsData, majorsData, getMajorsBySchoolCode } = require('../data/schools-majors-data');
const Hackathon = require('../models/Hackathon');
const School = require('../models/school-model');
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
 
    res.redirect('/hack-events?success=created');
 
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
 
    res.redirect('/hack-events?success=updated');
 
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


// POST /hacka-events/:id/delete — delete hackathon
exports.deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.redirect('/hack-events?error=notfound');

    await Hackathon.findByIdAndDelete(req.params.id);
    res.redirect('/hack-events?success=deleted');

  } catch (err) {
    console.error('Error deleting hackathon:', err.message);
    res.redirect('/hack-events?error=deletefailed');
  }
};







// REGISTER MOVE TO ANOTHER CONTROLLER PLS RMB TO CHANGE ROUTES

// Helpers for registration logic
const HackRegistration = require('../models/HackRegistration');
const User = require('../models/user-model');
 
function datesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}
 
// Builds the currentUser placeholder object — replace with req.session when ready
function getSessionUser(req) {
  return {
    userId:     req.session?.userId   || 'placeholder_uid_001',
    username:   req.session?.username || 'placeholder_user',
    email:      req.session?.email    || 'placeholder@smu.edu.sg',
    school:     req.session?.school   || 'scis',
    major:      req.session?.major    || 'fb',
    // Display names resolved in the controller from School/Major collections
    schoolName: req.session?.schoolName || 'School of Computing & Information Systems',
    majorName:  req.session?.majorName  || 'Information Systems',
  };
}

// GET /hackathons/:id/signup — show sign-up form
exports.showSignupForm = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon)             return res.status(404).send('Hackathon not found.');
    if (hackathon.status !== 'open')
      return res.status(403).send('Registration is not open for this hackathon.');
 
    res.render('ari/signup-hackathon', {
      hackathon,
      currentUser: getSessionUser(req),
      errors:      [],
      success:     null,
      formData:    {},
    });
  } catch (err) {
    console.error('Error loading signup form:', err.message);
    res.status(500).send('Server error: could not load sign-up form.');
  }
};

// Sorry for users, can they have their school and major as a param 🙏 i think i need it for my hackathon registration validation
// POST /hackathons/:id/signup — team registration logic
exports.registerAttendee = async (req, res) => {
  const hackathonId = req.params.id;
 
  // Pull leader details from hidden form fields (sourced from session placeholder)
  const { userId, username, email, school, major, teamSize } = req.body;
 
  // teammateEmails[] comes as an array (or undefined if solo)
  const rawTeammateEmails = req.body['teammateEmails[]'] || [];
  const teammateEmails    = Array.isArray(rawTeammateEmails)
    ? rawTeammateEmails.filter(e => e && e.trim() !== '')
    : [rawTeammateEmails].filter(e => e && e.trim() !== '');
 
  const parsedTeamSize = parseInt(teamSize) || 1;
  const errors         = [];
 
  // ── Load hackathon ──
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) return res.status(404).send('Hackathon not found.');
 
  // ── Gate 1: Status check ──
  if (hackathon.status !== 'open')
    errors.push('Registration is not currently open for this hackathon.');
 
  // ── Gate 2: Leader eligibility check (school and major only) ──
  if (school && !hackathon.eligibleSchools.includes('open') &&
      !hackathon.eligibleSchools.includes(school))
    errors.push('Your school is not eligible for this hackathon.');
 
  if (major && !hackathon.eligibleMajors.includes('open') &&
      !hackathon.eligibleMajors.includes(major))
    errors.push('Your major is not eligible for this hackathon.');
 
  // ── Gate 3: Duplicate registration check ──
  const alreadyRegistered = await HackRegistration.findOne({ hackathonId, userId });
  if (alreadyRegistered)
    errors.push('You are already registered for this hackathon.');
 
  // ── Gate 4: Scheduling conflict check ──
  const existingRegs = await HackRegistration.find({ userId });
  if (existingRegs.length > 0) {
    const existingIds     = existingRegs.map(r => r.hackathonId);
    const existingHacks   = await Hackathon.find({ _id: { $in: existingIds } });
    const conflicts       = existingHacks.filter(h =>
      h._id.toString() !== hackathonId &&
      datesOverlap(hackathon.startDate, hackathon.endDate, h.startDate, h.endDate)
    );
    if (conflicts.length > 0)
      errors.push(`This hackathon overlaps with: ${conflicts.map(h => h.name).join(', ')}.`);
  }
 
  // ── Gate 5: Team size range check ──
  if (parsedTeamSize < hackathon.teamSizeMin || parsedTeamSize > hackathon.teamSizeMax)
    errors.push(`Team size must be between ${hackathon.teamSizeMin} and ${hackathon.teamSizeMax}.`);
 
  // ── Gate 6: Teammate lookup — find each by email, must be role=student ──
  const resolvedTeammates = [];
  if (errors.length === 0) { // only run if earlier gates passed
    for (const tEmail of teammateEmails) {
      const normalised = tEmail.trim().toLowerCase();
 
      // Prevent leader from adding themselves
      if (normalised === email.trim().toLowerCase()) {
        errors.push(`You cannot add yourself (${normalised}) as a teammate.`);
        continue;
      }
 
      const userDoc = await User.findOne({ email: normalised, role: 'student' });
      if (!userDoc) {
        errors.push(`No student account found for: ${normalised}`);
      } else {
        resolvedTeammates.push({
          userId:   userDoc._id.toString(),
          email:    normalised,
          username: userDoc.username || '',
        });
      }
    }
  }
 
  // ── Re-render if any errors ──
  if (errors.length > 0) {
    return res.status(422).render('ari/signup-hackathon', {
      hackathon,
      currentUser: getSessionUser(req),
      errors,
      success:  null,
      formData: req.body,
    });
  }
 
  // ── Insert registration ──
  try {
    await HackRegistration.create({
      hackathonId,
      eventId:      null,
      userId,
      username:     username.trim(),
      email:        email.trim().toLowerCase(),
      school,
      major,
      teamMembers:  resolvedTeammates,
      teamSize:     parsedTeamSize,
    });
 
    return res.render('ari/signup-hackathon', {
      hackathon,
      currentUser: getSessionUser(req),
      errors:      [],
      success:     'You have successfully registered your team!',
      formData:    {},
    });
 
  } catch (err) {
    if (err.code === 11000) {
      return res.status(422).render('ari/signup-hackathon', {
        hackathon,
        currentUser: getSessionUser(req),
        errors:      ['You are already registered for this hackathon.'],
        success:     null,
        formData:    req.body,
      });
    }
    console.error('Registration error:', err.message);
    res.status(500).send('Server error: could not complete registration.');
  }
};

// GET /hackathons/:id/attendees — view attendee list
exports.showAttendees = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.status(404).send('Hackathon not found.');
 
    const [schools, allMajors, registrations] = await Promise.all([
      School.find({}).sort({ name: 1 }),
      Major.find({}),
      HackRegistration.find({ hackathonId: req.params.id }).sort({ registeredAt: 1 }),
    ]);
 
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.code] = s.name; });
 
    const majorMap = {};
    allMajors.forEach(m => { majorMap[m.code] = m.name; });
 
    res.render('ari/attendees-hackathon', {
      hackathon,
      registrations,
      schoolMap,
      majorMap,
    });
 
  } catch (err) {
    console.error('Error loading attendees:', err.message);
    res.status(500).send('Server error: could not load attendees.');
  }
};