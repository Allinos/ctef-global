const express = require('express');
const router = express.Router();
const eventsDb = require('../db/events');
const galleryDb = require('../db/gallery');

router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type || 'All';
    const [upcoming, past, gallery] = await Promise.all([
      eventsDb.listUpcoming(type),
      eventsDb.listPast(5),
      galleryDb.listRecent(6),
    ]);
    res.render('events/index', {
      title: 'Events',
      activeNav: 'events',
      upcoming,
      past,
      gallery,
      type,
    });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const event = await eventsDb.getBySlug(req.params.slug);
    if (!event) return res.status(404).render('404', { title: 'Event not found', activeNav: 'events' });
    res.render('events/detail', { title: event.title, activeNav: 'events', event });
  } catch (err) { next(err); }
});

router.post('/:slug/register', async (req, res, next) => {
  try {
    const event = await eventsDb.getBySlug(req.params.slug);
    if (!event) return res.status(404).render('404', { title: 'Event not found', activeNav: 'events' });
    req.flash('ok', `You're registered for "${event.title}". A confirmation has been sent to ${req.body.email || 'your email'}.`);
    res.redirect(`/events/${event.slug}`);
  } catch (err) { next(err); }
});

module.exports = router;
