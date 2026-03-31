// const { schoolsData, majorsData, getMajorsBySchoolCode } = require('../data/schools-majors-data');
const Hackathon = require('../models/Hackathon');
const School = require('../models/school-model');
const HackRegistration = require('../models/HackRegistration');
const User             = require('../models/user-model');

// Helpers
// Returns all schools sorted by displayName
const getSchools = () => School.find({}).sort({ displayName: 1 });

// Returns all majors flattened from embedded arrays — used for lookup maps
async function getAllMajorsFlat() {
  const schools = await School.find({}, 'majors');
  return schools.flatMap(s => s.majors);
}

// Builds the currentUser object from session — replace placeholders once session stores school/major
function getSessionUser(req) {
  const u = req.session?.user;
  return {
    userId:     u?.userId    || '',
    username:   u?.username  || '',
    email:      u?.email     || '',
    school:     u?.school    || '',     // school code e.g. 'scis'
    major:      u?.major     || '',     // major code  e.g. 'ba'
    schoolName: u?.schoolName || '',    // full name from login session
    majorName:  u?.majorName  || '',    // full name from login session
  };
}

function datesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
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

    const filter = { category: 'Hackathons' };
    if (query.school && query.school !== 'open')
      filter.eligibleSchools = { $in: [query.school, 'open'] };
    if (query.major && query.major !== 'open')
      filter.eligibleMajors = { $in: [query.major, 'open'] };
    if (query.status)
      filter.status = query.status;

    const [hackathons, schools] = await Promise.all([
      Hackathon.find(filter).sort({ startDate: 1 }),
      getSchools(),
    ]);

    // Build flat major lookup map { code -> name } from embedded majors
    const majorsData = schools.flatMap(s => s.majors);

    res.render('ari/display-hackathon', { hackathons, schools, majorsData, query });

  } catch (err) {
    console.error('Error fetching hackathons:', err.message);
    res.status(500).send('Server error: could not load hackathons.');
  }
};

// GET /hackathons/api/majors?school=xxx for dynamic dropdown
exports.getMajorsBySchool = async (req, res) => {
  try {
    const { school } = req.query;
    if (!school) return res.json([]);

    // Majors are now embedded — just find the school and return its majors array
    const schoolDoc = await School.findOne({ code: school }, 'majors');
    if (!schoolDoc) return res.json([]);

    return res.json(schoolDoc.majors);

  } catch (err) {
    console.error('Error fetching majors:', err.message);
    return res.status(500).json([]);
  }
};

// GET /hackathons/new — blank create form
exports.showCreateForm = async (req, res) => {
  try {
    const schools = await getSchools();
    // preloadedMajors: all majors from all schools for the form checkboxes
    // Each major needs a schoolCode so the form partial can group them by school
    const preloadedMajors = schools.flatMap(s =>
      s.majors.map(m => ({ ...m.toObject(), schoolCode: s.code }))
    );

    res.render('ari/create-hackathon', { hackathon: {}, schools, preloadedMajors, errors: [] });

  } catch (err) {
    console.error('Error loading create form:', err.message);
    res.status(500).send('Server error: could not load create form.');
  }
};

// POST /hackathons/new — validate and save new hackathon
exports.createHackathon = async (req, res) => {
  const { title, name, description, eligibleSchools, eligibleMajors,
          teamSizeMin, teamSizeMax, startDate, endDate, registrationDeadline, status } = req.body;

  const errors = [];
  if (!title       || title.trim()       === '') errors.push('Title is required.');
  if (!name        || name.trim()        === '') errors.push('Name is required.');
  if (!description || description.trim() === '') errors.push('Description is required.');
  if (!eligibleSchools || eligibleSchools.length === 0) errors.push('At least one eligible school must be selected.');
  if (!eligibleMajors  || eligibleMajors.length  === 0) errors.push('At least one eligible major must be selected.');

  const min = parseInt(teamSizeMin), max = parseInt(teamSizeMax);
  if (isNaN(min) || min < 1) errors.push('Minimum team size must be at least 1.');
  if (isNaN(max) || max < 1) errors.push('Maximum team size must be at least 1.');
  if (!isNaN(min) && !isNaN(max) && min > max) errors.push('Minimum team size cannot be greater than maximum.');

  const start = new Date(startDate), end = new Date(endDate), deadline = new Date(registrationDeadline);
  if (!startDate || isNaN(start))       errors.push('A valid start date is required.');
  if (!endDate   || isNaN(end))         errors.push('A valid end date is required.');
  if (!registrationDeadline || isNaN(deadline)) errors.push('A valid registration deadline is required.');
  if (!isNaN(start) && !isNaN(end)      && end      <= start)    errors.push('End date must be after start date.');
  if (!isNaN(deadline) && !isNaN(start) && deadline >= start)    errors.push('Registration deadline must be before the start date.');

  const validStatuses = ['upcoming', 'open', 'closed', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) errors.push('A valid status must be selected.');

  if (errors.length > 0) {
    const schools = await getSchools();
    const preloadedMajors = schools.flatMap(s => s.majors.map(m => ({ ...m.toObject(), schoolCode: s.code })));
    return res.status(422).render('ari/create-hackathon', { hackathon: req.body, schools, preloadedMajors, errors });
  }

  try {
    const imageData = req.file ? { data: req.file.buffer, contentType: req.file.mimetype } : undefined;
    await Hackathon.create({
      title: title.trim(), name: name.trim(), description: description.trim(),
      category: 'Hackathons',
      eligibleSchools: Array.isArray(eligibleSchools) ? eligibleSchools : [eligibleSchools],
      eligibleMajors:  Array.isArray(eligibleMajors)  ? eligibleMajors  : [eligibleMajors],
      teamSizeMin: min, teamSizeMax: max,
      startDate: start, endDate: end, registrationDeadline: deadline,
      status,
      ...(imageData && { image: imageData }),
    });
    res.redirect('/hack-events/hackathons?success=created');

  } catch (err) {
    const isDup = err.code === 11000 && err.keyPattern?.title;
    const schools = await getSchools();
    const preloadedMajors = schools.flatMap(s => s.majors.map(m => ({ ...m.toObject(), schoolCode: s.code })));
    return res.status(500).render('ari/create-hackathon', {
      hackathon: req.body, schools, preloadedMajors,
      errors: [isDup ? 'A hackathon with that title already exists.' : 'An unexpected server error occurred.'],
    });
  }
};

// GET /hackathons/:id/edit — pre-filled edit form
exports.showEditForm = async (req, res) => {
  try {
    const [hackathon, schools] = await Promise.all([
      Hackathon.findById(req.params.id),
      getSchools(),
    ]);
    if (!hackathon) return res.status(404).send('Hackathon not found.');

    const preloadedMajors = schools.flatMap(s =>
      s.majors.map(m => ({ ...m.toObject(), schoolCode: s.code }))
    );
    res.render('ari/edit-hackathon', { hackathon, schools, preloadedMajors, errors: [] });

  } catch (err) {
    console.error('Error loading edit form:', err.message);
    res.status(500).send('Server error: could not load edit form.');
  }
};

// POST /hackathons/:id/edit — validate and update
exports.updateHackathon = async (req, res) => {
  const { title, name, description, eligibleSchools, eligibleMajors,
          teamSizeMin, teamSizeMax, startDate, endDate, registrationDeadline, status } = req.body;

  const errors = [];
  if (!title       || title.trim()       === '') errors.push('Title is required.');
  if (!name        || name.trim()        === '') errors.push('Name is required.');
  if (!description || description.trim() === '') errors.push('Description is required.');
  if (!eligibleSchools || eligibleSchools.length === 0) errors.push('At least one eligible school must be selected.');
  if (!eligibleMajors  || eligibleMajors.length  === 0) errors.push('At least one eligible major must be selected.');

  const min = parseInt(teamSizeMin), max = parseInt(teamSizeMax);
  if (isNaN(min) || min < 1) errors.push('Minimum team size must be at least 1.');
  if (isNaN(max) || max < 1) errors.push('Maximum team size must be at least 1.');
  if (!isNaN(min) && !isNaN(max) && min > max) errors.push('Minimum team size cannot be greater than maximum.');

  const start = new Date(startDate), end = new Date(endDate), deadline = new Date(registrationDeadline);
  if (!startDate || isNaN(start))       errors.push('A valid start date is required.');
  if (!endDate   || isNaN(end))         errors.push('A valid end date is required.');
  if (!registrationDeadline || isNaN(deadline)) errors.push('A valid registration deadline is required.');
  if (!isNaN(start) && !isNaN(end)      && end      <= start)    errors.push('End date must be after start date.');
  if (!isNaN(deadline) && !isNaN(start) && deadline >= start)    errors.push('Registration deadline must be before the start date.');

  const validStatuses = ['upcoming', 'open', 'closed', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) errors.push('A valid status must be selected.');

  if (errors.length > 0) {
    const [hackathon, schools] = await Promise.all([Hackathon.findById(req.params.id), getSchools()]);
    const preloadedMajors = schools.flatMap(s => s.majors.map(m => ({ ...m.toObject(), schoolCode: s.code })));
    return res.status(422).render('ari/edit-hackathon', {
      hackathon: { ...hackathon.toObject(), ...req.body }, schools, preloadedMajors, errors,
    });
  }

  try {
    const updateData = {
      title: title.trim(), name: name.trim(), description: description.trim(),
      eligibleSchools: Array.isArray(eligibleSchools) ? eligibleSchools : [eligibleSchools],
      eligibleMajors:  Array.isArray(eligibleMajors)  ? eligibleMajors  : [eligibleMajors],
      teamSizeMin: min, teamSizeMax: max,
      startDate: start, endDate: end, registrationDeadline: deadline, status,
    };
    if (req.file) updateData.image = { data: req.file.buffer, contentType: req.file.mimetype };

    await Hackathon.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.redirect('/hack-events/hackathons?success=updated');

  } catch (err) {
    const isDup = err.code === 11000 && err.keyPattern?.title;
    const [hackathon, schools] = await Promise.all([Hackathon.findById(req.params.id), getSchools()]);
    const preloadedMajors = schools.flatMap(s => s.majors.map(m => ({ ...m.toObject(), schoolCode: s.code })));
    return res.status(500).render('ari/edit-hackathon', {
      hackathon: { ...hackathon.toObject(), ...req.body }, schools, preloadedMajors,
      errors: [isDup ? 'That title is already taken.' : 'An unexpected server error occurred.'],
    });
  }
};

// POST /hackathons/:id/delete — delete hackathon
exports.deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.redirect('/hack-events/hackathons?error=notfound');
    await Hackathon.findByIdAndDelete(req.params.id);
    res.redirect('/hack-events/hackathons?success=deleted');
  } catch (err) {
    console.error('Error deleting hackathon:', err.message);
    res.redirect('/hack-events/hackathons?error=deletefailed');
  }
};

// ------------- REGISTRATION LOGIC ------------------

// GET /hackathons/:id/signup — show sign-up form
exports.showSignupForm = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon)               return res.status(404).send('Hackathon not found.');
    if (hackathon.status !== 'open') return res.status(403).send('Registration is not open for this hackathon.');

    res.render('ari/signup-hackathon', {
      hackathon, currentUser: getSessionUser(req), errors: [], success: null, formData: {},
    });
  } catch (err) {
    console.error('Error loading signup form:', err.message);
    res.status(500).send('Server error: could not load sign-up form.');
  }
};

// POST /hackathons/:id/signup — team registration logic
exports.registerAttendee = async (req, res) => {
  const hackathonId = req.params.id;
  const { userId, username, email, school, major, teamSize } = req.body;

// Normalise to array — Express gives a string for one value, array for multiple
  const toArray = v => !v ? [] : Array.isArray(v) ? v : [v];
  const teammateEmails = toArray(req.body.teammateEmail).filter(e => e.trim() !== '');
  const teammateIds    = toArray(req.body.teammateUserId).filter(u => u.trim() !== '');
  
  const parsedTeamSize = parseInt(teamSize) || 1;
  const errors         = [];

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) return res.status(404).send('Hackathon not found.');

  // Gate 1: Status
  if (hackathon.status !== 'open')
    errors.push('Registration is not currently open for this hackathon.');

  // Gate 2: Leader eligibility (school and major only)
  if (school && !hackathon.eligibleSchools.includes('open') && !hackathon.eligibleSchools.includes(school))
    errors.push('Your school is not eligible for this hackathon.');
  if (major && !hackathon.eligibleMajors.includes('open') && !hackathon.eligibleMajors.includes(major))
    errors.push('Your major is not eligible for this hackathon.');

  // Gate 3: Duplicate check
  if (await HackRegistration.findOne({ hackathonId, userId }))
    errors.push('You are already registered for this hackathon.');

  // Gate 4: Scheduling conflict
  const existingRegs = await HackRegistration.find({ userId });
  if (existingRegs.length > 0) {
    const existingHacks = await Hackathon.find({ _id: { $in: existingRegs.map(r => r.hackathonId) } });
    const conflicts = existingHacks.filter(h =>
      h._id.toString() !== hackathonId &&
      datesOverlap(hackathon.startDate, hackathon.endDate, h.startDate, h.endDate)
    );
    if (conflicts.length > 0)
      errors.push(`This hackathon overlaps with: ${conflicts.map(h => h.name).join(', ')}.`);
  }

  // Gate 5: Team size range
  if (parsedTeamSize < hackathon.teamSizeMin || parsedTeamSize > hackathon.teamSizeMax)
    errors.push(`Team size must be between ${hackathon.teamSizeMin} and ${hackathon.teamSizeMax}.`);

  // Gate 6: Teammate lookup, verify teammates server-side even though client already checked.
  const resolvedTeammates = [];
  if (errors.length === 0) {
    for (let t = 0; t < teammateEmails.length; t++) {
      const norm = teammateEmails[t].trim().toLowerCase();
      const sentUid = (teammateIds[t] || '').trim();

      if (norm === email.trim().toLowerCase()) {
        errors.push(`You cannot add yourself (${norm}) as a teammate.`);
        continue;
      }
      const userDoc = await User.findOne({ email: norm, role: 'student' });
      if (!userDoc) {
        errors.push(`No student account found for: ${norm}`);
        continue

      }
      if (sentUid && userDoc.userId !== sentUid) {
        errors.push(`User ID mismatch for ${norm}. Please re-search this teammate.`);
        continue;
      }
        resolvedTeammates.push({ userId: userDoc.userId, email: norm, username: userDoc.username || '' });
    }
  }

  if (errors.length > 0) {
    return res.status(422).render('ari/signup-hackathon', {
      hackathon, currentUser: getSessionUser(req), errors, success: null, formData: req.body,
    });
  }

  try {
    await HackRegistration.create({
      hackathonId, eventId: null, userId,
      username: username.trim(), email: email.trim().toLowerCase(),
      school, major, teamMembers: resolvedTeammates, teamSize: parsedTeamSize,
    });
    return res.render('ari/signup-hackathon', {
      hackathon, currentUser: getSessionUser(req),
      errors: [], success: 'You have successfully registered your team!', formData: {},
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(422).render('ari/signup-hackathon', {
        hackathon, currentUser: getSessionUser(req),
        errors: ['You are already registered for this hackathon.'], success: null, formData: req.body,
      });
    }
    console.error('Registration error:', err.message);
    res.status(500).send('Server error: could not complete registration.');
  }
};

// GET /hackathons/:id/attendees — view attendee list
exports.showAttendees = async (req, res) => {
  try {
    const [hackathon, schools, registrations] = await Promise.all([
      Hackathon.findById(req.params.id),
      getSchools(),
      HackRegistration.find({ hackathonId: req.params.id }).sort({ registeredAt: 1 }),
    ]);
    if (!hackathon) return res.status(404).send('Hackathon not found.');

    // Build lookup maps from embedded majors
    const schoolMap = {};
    const majorMap  = {};
    schools.forEach(s => {
      schoolMap[s.code] = s.fullName;           // show full name in attendees list
      s.majors.forEach(m => { majorMap[m.code] = m.name; });
    });

    res.render('ari/attendees-hackathon', { hackathon, registrations, schoolMap, majorMap });

  } catch (err) {
    console.error('Error loading attendees:', err.message);
    res.status(500).send('Server error: could not load attendees.');
  }
};

// GET /api/lookup-teammate?email=xxx&hackathonId=yyy
exports.lookupTeammate = async (req, res) => {
  try {
    const { email, hackathonId } = req.query;

    if (!email || !hackathonId) {
      return res.json({ valid: false, message: 'Email and hackathon ID are required.' });
    }

    const norm = email.trim().toLowerCase();

    const userDoc = await User.findOne({ email: norm, role: 'student' });
    if (!userDoc) {
      return res.json({ valid: false, message: `No student account found for ${norm}.` });
    }

    const currentUserId = req.session?.user?.userId || '';
    if (userDoc.userId === currentUserId) {
      return res.json({ valid: false, message: 'You cannot add yourself as a teammate.' });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.json({ valid: false, message: 'Hackathon not found.' });
    }

    const issues = [];

    const schoolOk = hackathon.eligibleSchools.includes('open') ||
                     hackathon.eligibleSchools.includes(userDoc.school);
    if (!schoolOk) issues.push(`school (${userDoc.school.toUpperCase()}) is not eligible`);

    const majorOk = hackathon.eligibleMajors.includes('open') ||
                    hackathon.eligibleMajors.includes(userDoc.major);
    if (!majorOk) issues.push(`major (${userDoc.major}) is not eligible`);

    if (issues.length > 0) {
      return res.json({
        valid:   false,
        message: `${norm} does not meet eligibility: ${issues.join(', ')}.`,
      });
    }

    return res.json({
      valid:    true,
      userId:   userDoc.userId,
      username: userDoc.username,
      message:  `✓ ${userDoc.username} (${norm}) is eligible.`,
    });

  } catch (err) {
    console.error('Teammate lookup error:', err.message);
    return res.json({ valid: false, message: 'Server error during lookup.' });
  }
};