const Event = require('../models/eventModel');//
const RSVP = require('../models/rsvpModel');

const tempUserId = '65a000000000000000000001';

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
    // Loop through each day of the event.
    // If it falls within the current month, add it to the dayMap. 
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

// GET /dashboard
exports.displayUser = async (req, res) => {
  const msg = req.query.msg || ''
  try {
    const now = new Date();
    const month = parseInt(req.query.month ?? now.getMonth());
    const year = parseInt(req.query.year ?? now.getFullYear());

    const allRsvps = await RSVP.getUserRSVP(tempUserId)

    const eventMap = await buildEventMap(allRsvps);
    const { firstDay, daysInMonth, dayMap, cells } = buildCalendar(year, month, allRsvps, eventMap);

    res.render('dashboard', {
      allRsvps, cells, eventMap, dayMap,
      firstDay, daysInMonth, month, year,
      msg
    });
  } catch (error) {
    res.send(error)
  }
}

// GET /dashboard/rsvp?id=124234
exports.showRsvp = async (req, res) => {
  const rsvpId = req.query.id;
  try {
    const rsvp = await RSVP.findById(rsvpId);
    const event = await Event.findById(rsvp.event);
    res.render('dashboard-rsvp', { rsvp, event });
  } catch (error) {
    res.send(error)
  }
}

// POST /rsvp-update
exports.updateRsvp = async (req, res) => {
  try {
    await RSVP.updateNote(req.body.rsvpId, req.body.note);
    res.redirect('/dashboard?msg=Note+updated');
  } catch (error) {
    res.sned(error);
  }
}

// POST /rsvp-delete
exports.deleteRsvp = async (req, res) => {
  try {
    await RSVP.cancel(req.body.rsvpId);
    res.redirect('/dashboard?msg=Event+removed');
  } catch (error) {
    res.send(error);
  }
}

// POST /rsvp-join coming from detail page
exports.joinRsvp = async (req, res) => {
  const eventId = req.body.eventId;
  try {
    const newEvent = await Event.findById(eventId);
    console.log(newEvent)
    const newStart = new Date(newEvent.startDate);
    const newEnd = new Date(newEvent.endDate);

    const confirmed = await RSVP.getConfirmedForUser(tempUserId);
    const eventMap = await buildEventMap(confirmed);
    const conflict = confirmed.find(rsvp => {
      const existing = eventMap[rsvp.event.toString()];
      if (!existing) return false;
      return newStart < new Date(existing.endDate) && newEnd > new Date(existing.startDate);
    });

    if (conflict) {
      const conflictingEvent = eventMap[conflict.event.toString()];
      return res.render('conflict', {
        newEvent,
        conflictingEvent,
        conflictRsvpId: conflict._id,
      });
    }
    await RSVP.join(eventId, tempUserId);
    res.redirect('/dashboard?msg=Successfully+registered');

  } catch (error) {
    res.send(error);
  }
};

// POST /rsvp-replace CREATE+DELETE
exports.replaceRsvp = async (req, res) => {
  try {
    await RSVP.cancel(req.body.oldRsvpId);
    await RSVP.join(req.body.newEventId, tempUserId);
    res.redirect('/dashboard?msg=Event+replaced');
  } catch (error) {
    res.send(error);
  }
};