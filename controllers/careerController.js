const Career = require('../models/careerModel');
const RSVP   = require('../models/rsvpModel');

const tempUserId = '65a000000000000000000001';
const categories = ['full-time', 'internship', 'workshop'];
const sectors    = ['Information Technology', 'Banking', 'Marketing', 'Accounting', 'Human Resources', 'Consulting', 'Legal', 'Operations', 'Other'];

async function getPinned(allEvents) {
  try {
    const rsvps      = await RSVP.getUserRSVP(tempUserId);
    const pinnedIDs  = rsvps.map(r => r.event.toString());
    return allEvents.filter(event => pinnedIDs.includes(event.eventId.toString()));
  } catch (error) {
    console.error('getPinned error:', error.message);
    return [];
  }
}

// GET /careers 
exports.displayCareers = async (req, res) => {
  const { careerType, dateFrom, dateTo } = req.query;
  const selectedSectors = Array.isArray(req.query.selectedSectors)
    ? req.query.selectedSectors
    : req.query.selectedSectors
      ? [req.query.selectedSectors]
      : [];
  const q = req.query.q?.trim() || '';

  const isFiltered = careerType || dateFrom || dateTo || selectedSectors.length || q;

  const filter = {};
  if (careerType) filter.careerType = careerType;
  if (selectedSectors.length) filter.sector = { $in: selectedSectors };
  if (dateFrom || dateTo) {
    filter.startDate = {};
    if (dateFrom) filter.startDate.$gte = new Date(dateFrom);
    if (dateTo)   filter.startDate.$lte = new Date(dateTo);
  }
  if (q) filter.title = { $regex: q, $options: 'i' };

  try {
    const careerEvents = await Career.findWithFilter(filter);
    const jobs         = careerEvents.filter(e => e.careerType !== 'workshop');
    const workshops    = careerEvents.filter(e => e.careerType === 'workshop');
    const pinned       = await getPinned(careerEvents);

    res.render('career', {
      jobs,
      workshops,
      pinned,
      categories,
      sectors,
      selectedSectors,
      msg:        !isFiltered && Object.keys(req.query).length>0 ? 'No filters were selected' : '',
      careerType: careerType  || '',
      dateFrom:   dateFrom    || '',
      dateTo:     dateTo      || '',
      q,
    });
  } catch (error) {
    res.send(error);
    }
};

// GET /careers/detail
exports.careerDetail = async (req, res) => {
  const eventId = req.query.id;//id of event
  try {
    const event = await Career.findByEventId(eventId);//grab specific document
    const registered = await RSVP.isAlreadyRSVPd(eventId, tempUserId);//change ejs so that users who already joined cannot click apply
    res.render('career-detail', { event, registered });
  } catch (error) {
    res.send(error + "this error is from careerDetail");
    }
};