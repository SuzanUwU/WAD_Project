const Event = require('../models/eventModel');
const RSVP = require('../models/rsvpModel');
const hackRegistration = require('../models/HackRegistration');

// ✅ FUNCTION DECLARATIONS (HOISTED - Work in any order)
function displayUser(req, res) {
  const msg = req.query.msg || '';
  try {
    const userId = req.session.user.userId;
    const now = new Date();
    const month = parseInt(req.query.month ?? now.getMonth());
    const year = parseInt(req.query.year ?? now.getFullYear());
    
    RSVP.getUserDashboardData(userId, year, month).then(({ allRsvps, eventMap, firstDay, daysInMonth, dayMap, cells }) => {
      res.render('dashboard', {
        allRsvps, cells, eventMap, dayMap,
        firstDay, daysInMonth, month, year, msg
      });
    }).catch(error => {
      res.status(500).send(error.message);
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
}

function showRsvp(req, res) {
  const userId = req.session.user.userId;
  RSVP.findById(req.query.id).then(async (rsvp) => {
    const event = await Event.findById(rsvp.event);
    const position = await RSVP.getWaitlistPosition(rsvp.event, userId);
    res.render('dashboard-rsvp', { rsvp, event, position });
  }).catch(error => {
    res.status(500).send(error.message);
  });
}

function updateRsvp(req, res) {
  RSVP.updateNote(req.body.rsvpId, req.body.note).then(() => {
    res.redirect('/dashboard?msg=Note+updated');
  }).catch(error => {
    res.status(500).send(error.message);
  });
}

function deleteRsvp(req, res) {
  RSVP.findById(req.body.rsvpId).then(async (rsvp) => {
    const event = await Event.findById(rsvp.event);
    
    if (rsvp.status === 'confirmed') {
      const hoursUntilEvent = (new Date(event.startDate) - Date.now()) / (1000 * 60 * 60);
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
    await RSVP.promoteFromWaitlist(rsvp.event);
    res.redirect('/dashboard?msg=Event+removed');
  }).catch(error => {
    res.status(500).send(error.message);
  });
}

function joinRsvp(req, res) {
  const userId = req.session.user.userId;
  Event.findById(req.body.eventId).then(async (newEvent) => {
    RSVP.getDocCount(newEvent._id, 'confirmed').then((confirmedCount) => {
      const isFull = confirmedCount >= newEvent.capacity;

      if (isFull) {
        RSVP.join(newEvent._id, userId, 'waitlist').then(() => {
          RSVP.getWaitlistPosition(newEvent._id, userId).then((position) => {
            res.redirect(`/dashboard?msg=Added+to+waitlist+%23${position}`);
          });
        });
        return;
      }
      
      RSVP.checkConflict(userId, newEvent).then((conflict) => {
        if (conflict) {
          RSVP.buildEventMap([conflict]).then((eventMap) => {
            const conflictingEvent = eventMap[conflict.event.toString()];
            res.render('conflict', {
              newEvent, conflictingEvent, conflictRsvpId: conflict._id
            });
          });
          return;
        }
        
        RSVP.join(newEvent._id, userId, 'confirmed').then(() => {
          res.redirect('/dashboard?msg=Successfully+registered');
        });
      });
    });
  }).catch(error => {
    res.status(500).send(error.message);
  });
}

function replaceRsvp(req, res) {
  const userId = req.session.user.userId;
  RSVP.cancel(req.body.oldRsvpId).then(async () => {
    const oldEvent = await Event.findById(req.body.oldEventId);
    if (oldEvent.category === 'Hackathon') {
      await hackRegistration.cancel(oldEvent._id, userId);
    }
    await RSVP.promoteFromWaitlist(req.body.oldEventId);
    await RSVP.join(req.body.newEventId, userId, 'confirmed');
    res.redirect('/dashboard?msg=Event+replaced');
  }).catch(error => {
    res.status(500).send(error.message);
  });
}

// ✅ EXPORTS - NOW HOISTED FUNCTIONS WORK
module.exports = {
  displayUser,
  showRsvp,
  updateRsvp,
  deleteRsvp,
  joinRsvp,
  replaceRsvp
};