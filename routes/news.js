const express = require('express');
const router = express.Router();
const newsDb = require('../db/news');

router.get('/', async (req, res, next) => {
  try {
    const category = req.query.category || 'All';
    const q = (req.query.q || '').trim();
    const list = await newsDb.listAll({ category, q });
    res.render('news/index', {
      title: 'News & announcements',
      activeNav: 'news',
      list,
      category,
      q,
    });
  } catch (err) { next(err); }
});

module.exports = router;
