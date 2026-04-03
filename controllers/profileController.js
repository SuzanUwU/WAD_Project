const Event = require('../models/eventModel');
const RSVP = require('../models/rsvpModel');
const hackRegistration = require('../models/HackRegistration');

async function buildEventMap(allRsvps) {
  const eventIds = allRsvps.map(r => r.event.toString());
  const events = await Event.findManyByIds(eventIds);
  const eventMap = {};
  events.forEach(e => eventMap[e._id.toString()] = e);
  return eventMap;
}

function buildCalendar(year, month, rsvps, eventMap) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(0);
  for (let j = 1; j <= daysInMonth; j++) cells.push(j);

  const dayMap = {};
  rsvps.forEach(rsvp => {
    const curr = new Date(eventMap[rsvp.event.toString()].startDate);
    const end = new Date(eventMap[rsvp.event.toString()].endDate);
    while (curr <= end) {
      const YY = curr.getFullYear();
      const MM = curr.getMonth();
      const DD = curr.getDate();
      if (YY === year && MM === month) {
        if (!dayMap[DD]) dayMap[DD] = [];
        dayMap[DD].push(rsvp);
      }
      curr.setDate(DD + 1);
    }
  });

  return { firstDay, daysInMonth, dayMap, cells };
}

async function checkConflict(userId, event) {
  //only care abt conflict w/ confirmed rsvps
  const confirmed = await RSVP.getConfirmedForUser(userId);
  const eventMap = await buildEventMap(confirmed);
  return confirmed.find(rsvp => {
    const existing = eventMap[rsvp.event.toString()];
    if (!existing) return false;
    return (
      new Date(event.startDate) < new Date(existing.endDate) &&
      new Date(event.endDate) > new Date(existing.startDate)
    );
  }) || null;
}

async function promoteFromWaitlist(eventId) {
  const waitlist = await RSVP.getWaitlist(eventId);
  console.log(waitlist)
  for (const candidate of waitlist) {
    const candidateEvent = await Event.findById(eventId);
    const hasConflict = await checkConflict(candidate.user, candidateEvent);
    if (!hasConflict) {
      await RSVP.promote(candidate._id);
      break;
    }
  }
}

// GET /dashboard
exports.displayUser = async (req, res) => {
  const msg = req.query.msg || '';
  try {
    const userId = req.session.user.userId;
    const now = new Date();
    const month = parseInt(req.query.month ?? now.getMonth());
    const year = parseInt(req.query.year ?? now.getFullYear());
    const allRsvps = await RSVP.getUserRSVP(userId).sort({joinedAt: -1});
    const eventMap = await buildEventMap(allRsvps);
    const { firstDay, daysInMonth, dayMap, cells } = buildCalendar(year, month, allRsvps, eventMap);
    res.render('yujia/dashboard', {
      allRsvps, cells, eventMap, dayMap,
      firstDay, daysInMonth, month, year,
      msg
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// GET /dashboard/rsvp?id=124234
exports.showRsvp = async (req, res) => {
    const userId = req.session.user.userId;
  try {
    const rsvp = await RSVP.findById(req.query.id);
    const event = await Event.findById(rsvp.event);
    const position = await RSVP.getWaitlistPosition(rsvp.event, userId)
    res.render('yujia/dashboard-rsvp', { rsvp, event, position });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// POST /dashboard/rsvp-update
exports.updateRsvp = async (req, res) => {
  try {
    await RSVP.updateNote(req.body.rsvpId, req.body.note);
    res.redirect('/dashboard?msg=Note+updated');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// POST /rsvp-delete
exports.deleteRsvp = async (req, res) => {
  try {
    const rsvp = await RSVP.findById(req.body.rsvpId);
    const event = await Event.findById(rsvp.event);
    //delete if >24h away or there's a waitlist
     if (rsvp.status === 'confirmed') {
      const hoursUntilEvent = (new Date(event.startDate) - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilEvent <= 0) {
        return res.redirect(`/dashboard?msg=Cannot+cancel+a+past+event`);
      }
      if (hoursUntilEvent < 24) {
        const waitlistCount = await RSVP.getDocCount(event._id, 'waitlist');
        if (waitlistCount === 0) {
          return res.redirect(`/dashboard?msg=Cannot+cancel+at+this+time`);
        }
      }
    }

    if (event.category === 'Hackathon') {
      await hackRegistration.cancel(event._id, rsvp.user);
    }
    await RSVP.cancel(rsvp._id);
    await promoteFromWaitlist(rsvp.event);
    res.redirect('/dashboard?msg=Event+removed');

  } catch (error) {
    res.status(500).send(error.message);
  }
};

// POST /dashboard/rsvp-join
exports.joinRsvp = async (req, res) => {
  try {
    console.log(req.body)
    const userId = req.session.user.userId;
    const newEvent = await Event.findById(req.body.eventId);
    //block rsvp for events which have passed
    if ((new Date(newEvent.startDate) <= new Date())||await RSVP.isAlreadyRsvp(newEvent._id,userId)) {
      if (newEvent.category === 'Hackathon') {
        await hackRegistration.cancel(newEvent._id, userId);
      }//failed to waitlist delete hackregistration info
      return res.redirect(`/dashboard?msg=Registration+closed`);
    }
       // block if already rsvp'd
    if (await RSVP.isAlreadyRsvp(newEvent._id, userId)) {
      if (newEvent.category === 'Hackathon') {
        await hackRegistration.cancel(newEvent._id, userId);
      }
      return res.redirect(`/dashboard?msg=Already+registered`);
    }
    // capacity check
    const confirmedCount = await RSVP.getDocCount(newEvent._id, 'confirmed');
    const isFull = confirmedCount >= newEvent.capacity;

    if (isFull) {
      await RSVP.join(newEvent._id, userId, 'waitlist');
      const position = await RSVP.getWaitlistPosition(newEvent._id, userId);
      //leave the hackathon info in hackregistration, only delete if they cancel rsvp/didnt get to waitlist
      return res.redirect(`/dashboard?msg=Added+to+waitlist+%23${position}`);
    }
    // time conflict check only happens for to b confirmed
    const conflict = await checkConflict(userId, newEvent);
    if (conflict) {
      const eventMap = await buildEventMap([conflict]);
      const conflictingEvent = eventMap[conflict.event.toString()];//grab conflict doc
      return res.render('yujia/conflict', {
        newEvent,
        conflictingEvent,
        conflictRsvpId: conflict._id,
      });
    }
    await RSVP.join(newEvent._id, userId, 'confirmed');
    res.redirect('/dashboard?msg=Successfully+registered');

  } catch (error) {
    res.status(500).send(error.message);
  }
};

// POST //dashboard/rsvp-replace
exports.replaceRsvp = async (req, res) => {
  const oldRsvpId = req.body.oldRsvpId
  const oldEventId = req.body.oldEventId
  const newEventId = req.body.newEventId
  const response = req.body.response
  const userId = req.session.user.userId;
  try {
    const newEvent = await Event.findById(newEventId)
    const oldEvent = await Event.findById(oldEventId);
    if (response === 'keep') {
      if (newEvent.category=="Hackathon"){
        await hackRegistration.cancel(newEvent._id, userId);
      }
      return res.redirect('/dashboard?msg=No+changes+made');
    }
    // replace delete old add new
    await RSVP.cancel(oldRsvpId);
    if (oldEvent.category=="Hackathon"){
      await hackRegistration.cancel(oldEvent._id, userId);
    }
    await promoteFromWaitlist(oldEventId);
    await RSVP.join(newEventId, userId, 'confirmed');
    res.redirect('/dashboard?msg=Event+replaced');
  } catch (error) {
    res.status(500).send(error.message);
  }
};