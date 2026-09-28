const express = require('express');
const router = express.Router();
const eventsDb = require('../db/events');
const newsDb = require('../db/news');
const staticData = require('../data/static');
const { memoryUpload } = require('../middleware/upload');

router.get('/', async (req, res, next) => {
  try {
    const [events, news] = await Promise.all([eventsDb.listSoonest(3), newsDb.listRecent(3)]);
    res.render('home', { title: 'Home', activeNav: 'home', events, news });
  } catch (err) { next(err); }
});

router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About us',
    activeNav: 'about',
    objectives: staticData.objectives,
  });
});

router.get('/stakeholders', (req, res) => {
  res.render('stakeholders', {
    title: 'Stakeholders',
    activeNav: 'stakeholders',
    boards: staticData.boards,
    life: staticData.life,
    inst: staticData.inst,
    states: staticData.states,
  });
});

router.get('/membership', (req, res) => {
  res.render('membership', {
    title: 'Membership',
    activeNav: 'membership',
    plans: staticData.plans,
    benefits: staticData.benefits,
    states: staticData.states,
  });
});

router.post('/membership/apply', memoryUpload.any(), (req, res) => {
  req.flash('ok', `Thank you, ${req.body.name || 'friend'}. Your membership application has been received — our team will verify it within 3–5 working days.`);
  res.redirect('/membership#apply');
});

router.get('/chapters', (req, res) => {
  res.render('chapters', {
    title: 'State chapters',
    activeNav: 'chapters',
    chapters: staticData.chapters,
  });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact us', activeNav: 'contact' });
});

router.post('/contact', (req, res) => {
  req.flash('ok', `Thanks, ${req.body.name || 'friend'} — we usually reply within two working days.`);
  res.redirect('/contact');
});

module.exports = router;
