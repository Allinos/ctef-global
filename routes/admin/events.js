const express = require('express');
const router = express.Router();
const eventsDb = require('../../db/events');
const { eventsUpload, publicPathFor } = require('../../middleware/upload');

function validate(body) {
  const errors = {};
  if (!body.title || !body.title.trim()) errors.title = 'Title is required.';
  if (!body.event_date) errors.event_date = 'Date is required.';
  if (!['Workshop', 'Seminar', 'Conference'].includes(body.type)) errors.type = 'Choose a valid type.';
  return errors;
}

router.get('/', async (req, res, next) => {
  try {
    const search = (req.query.q || '').trim();
    const events = await eventsDb.listAll(search);
    res.render('admin/events/list', { title: 'Manage events', events, search });
  } catch (err) { next(err); }
});

router.get('/new', (req, res) => {
  res.render('admin/events/form', { title: 'New event', event: {}, errors: {} });
});

router.post('/', eventsUpload.single('image'), async (req, res, next) => {
  try {
    const errors = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).render('admin/events/form', { title: 'New event', event: req.body, errors });
    }
    const image = req.file ? publicPathFor('events', req.file.filename) : null;
    const id = await eventsDb.create({ ...req.body, image });
    req.flash('ok', 'Event created.');
    res.redirect('/admin/events');
  } catch (err) { next(err); }
});

router.get('/:id/edit', async (req, res, next) => {
  try {
    const event = await eventsDb.getById(req.params.id);
    if (!event) return res.status(404).send('Event not found');
    res.render('admin/events/form', { title: 'Edit event', event, errors: {} });
  } catch (err) { next(err); }
});

router.post('/:id', eventsUpload.single('image'), async (req, res, next) => {
  try {
    const errors = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).render('admin/events/form', { title: 'Edit event', event: { ...req.body, id: req.params.id }, errors });
    }
    const image = req.file ? publicPathFor('events', req.file.filename) : null;
    await eventsDb.update(req.params.id, { ...req.body, image });
    req.flash('ok', 'Event updated.');
    res.redirect('/admin/events');
  } catch (err) { next(err); }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await eventsDb.remove(req.params.id);
    req.flash('ok', 'Event deleted.');
    res.redirect('/admin/events');
  } catch (err) { next(err); }
});

module.exports = router;
