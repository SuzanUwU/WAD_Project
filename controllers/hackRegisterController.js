const Hackathon        = require('../models/Hackathon');
const HackRegistration = require('../models/HackRegistration');
const User             = require('../models/user-model');
const School           = require('../models/school-model');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSessionUser(req) {
  const u = req.session?.user;
  return {
    userId:     u?.userId     || '',
    username:   u?.username   || '',
    email:      u?.email      || '',
    school:     u?.school     || '',
    major:      u?.major      || '',
    schoolName: u?.schoolName || '',
    majorName:  u?.majorName  || '',
  };
}

function datesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

// ── GET /:id/signup ───────────────────────────────────────────────────────────
exports.showSignupForm = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.status(404).send('Hackathon not found.');
    if (hackathon.status !== 'open')
      return res.status(403).send('Registration is not open for this hackathon.');

    res.render('ari/signup-hackathon', {
      hackathon, currentUser: getSessionUser(req), errors: [], success: null, formData: {},
    });
  } catch (err) {
    console.error('Error loading signup form:', err.message);
    res.status(500).send('Server error: could not load sign-up form.');
  }
};

// ── POST /:id/signup ──────────────────────────────────────────────────────────
exports.registerAttendee = async (req, res) => {
  const hackathonId = req.params.id;
  const { userId, username, email, school, major, teamSize } = req.body;

  const toArray = v => !v ? [] : Array.isArray(v) ? v : [v];
  const teammateEmails = toArray(req.body.teammateEmail).filter(e => e.trim() !== '');
  const teammateIds    = toArray(req.body.teammateUserId).filter(u => u.trim() !== '');

  const parsedTeamSize = parseInt(teamSize) || 1;
  const errors = [];

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) return res.status(404).send('Hackathon not found.');

  // Gate 1: Status
  if (hackathon.status !== 'open')
    errors.push('Registration is not currently open for this hackathon.');

  // Gate 2: Leader eligibility
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

  // Gate 6: Teammate lookup
  const resolvedTeammates = [];
  if (errors.length === 0) {
    for (let t = 0; t < teammateEmails.length; t++) {
      const norm    = teammateEmails[t].trim().toLowerCase();
      const sentUid = (teammateIds[t] || '').trim();

      if (norm === email.trim().toLowerCase()) {
        errors.push(`You cannot add yourself (${norm}) as a teammate.`);
        continue;
      }
      const userDoc = await User.findOne({ email: norm, role: 'student' });
      if (!userDoc) {
        errors.push(`No student account found for: ${norm}`);
        continue;
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
      hackathonId,
      eventId:     req.body.eventId || hackathon.eventId || null,
      userId,
      username:    username.trim(),
      email:       email.trim().toLowerCase(),
      school, major,
      teamMembers: resolvedTeammates,
      teamSize:    parsedTeamSize,
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

// ── GET /:id/attendees ────────────────────────────────────────────────────────
exports.showAttendees = async (req, res) => {
  try {
    const [hackathon, schools, registrations] = await Promise.all([
      Hackathon.findById(req.params.id),
      School.find({}).sort({ displayName: 1 }),
      HackRegistration.find({ hackathonId: req.params.id }).sort({ registeredAt: 1 }),
    ]);
    if (!hackathon) return res.status(404).send('Hackathon not found.');

    const schoolMap = {};
    const majorMap  = {};
    schools.forEach(s => {
      schoolMap[s.code] = s.fullName;
      s.majors.forEach(m => { majorMap[m.code] = m.name; });
    });

    res.render('ari/attendees-hackathon', { hackathon, registrations, schoolMap, majorMap });

  } catch (err) {
    console.error('Error loading attendees:', err.message);
    res.status(500).send('Server error: could not load attendees.');
  }
};

// ── GET /api/lookup-teammate ──────────────────────────────────────────────────
exports.lookupTeammate = async (req, res) => {
  try {
    const { email, hackathonId } = req.query;
    if (!email || !hackathonId)
      return res.json({ valid: false, message: 'Email and hackathon ID are required.' });

    const norm    = email.trim().toLowerCase();
    const userDoc = await User.findOne({ email: norm, role: 'student' });
    if (!userDoc)
      return res.json({ valid: false, message: `No student account found for ${norm}.` });

    const currentUserId = req.session?.user?.userId || '';
    if (userDoc.userId === currentUserId)
      return res.json({ valid: false, message: 'You cannot add yourself as a teammate.' });

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon)
      return res.json({ valid: false, message: 'Hackathon not found.' });

    const issues = [];
    if (!hackathon.eligibleSchools.includes('open') && !hackathon.eligibleSchools.includes(userDoc.school))
      issues.push(`school (${userDoc.school.toUpperCase()}) is not eligible`);
    if (!hackathon.eligibleMajors.includes('open') && !hackathon.eligibleMajors.includes(userDoc.major))
      issues.push(`major (${userDoc.major}) is not eligible`);

    if (issues.length > 0)
      return res.json({ valid: false, message: `${norm} does not meet eligibility: ${issues.join(', ')}.` });

    return res.json({ valid: true, userId: userDoc.userId, username: userDoc.username, message: `✓ ${userDoc.username} (${norm}) is eligible.` });

  } catch (err) {
    console.error('Teammate lookup error:', err.message);
    return res.json({ valid: false, message: 'Server error during lookup.' });
  }
};
