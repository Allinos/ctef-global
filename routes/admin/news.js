const express = require('express');
const router = express.Router();
const newsDb = require('../../db/news');

function validate(body) {
  const errors = {};
  if (!body.title || !body.title.trim()) errors.title = 'Title is required.';
  if (!body.published_date) errors.published_date = 'Date is required.';
  if (!['Announcement', 'Circular', 'Award'].includes(body.category)) errors.category = 'Choose a valid category.';
  return errors;
}

router.get('/', async (req, res, next) => {
  try {
    const list = await newsDb.listAll({});
    res.render('admin/news/list', { title: 'Manage news', list });
  } catch (err) { next(err); }
});

router.get('/new', (req, res) => {
  res.render('admin/news/form', { title: 'New news item', item: {}, errors: {} });
});

router.post('/', async (req, res, next) => {
  try {
    const errors = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).render('admin/news/form', { title: 'New news item', item: req.body, errors });
    }
    await newsDb.create(req.body);
    req.flash('ok', 'News item created.');
    res.redirect('/admin/news');
  } catch (err) { next(err); }
});

router.get('/:id/edit', async (req, res, next) => {
  try {
    const item = await newsDb.getById(req.params.id);
    if (!item) return res.status(404).send('News item not found');
    res.render('admin/news/form', { title: 'Edit news item', item, errors: {} });
  } catch (err) { next(err); }
});

router.post('/:id', async (req, res, next) => {
  try {
    const errors = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).render('admin/news/form', { title: 'Edit news item', item: { ...req.body, id: req.params.id }, errors });
    }
    await newsDb.update(req.params.id, req.body);
    req.flash('ok', 'News item updated.');
    res.redirect('/admin/news');
  } catch (err) { next(err); }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await newsDb.remove(req.params.id);
    req.flash('ok', 'News item deleted.');
    res.redirect('/admin/news');
  } catch (err) { next(err); }
});

module.exports = router;
