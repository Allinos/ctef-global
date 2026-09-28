const express = require('express');
const router = express.Router();
const galleryDb = require('../../db/gallery');
const { galleryUpload, publicPathFor } = require('../../middleware/upload');

router.get('/', async (req, res, next) => {
  try {
    const images = await galleryDb.listAll('All');
    res.render('admin/gallery/list', { title: 'Manage gallery', images });
  } catch (err) { next(err); }
});

router.get('/new', (req, res) => {
  res.render('admin/gallery/form', { title: 'New photo', image: {}, errors: {} });
});

router.post('/', galleryUpload.single('image'), async (req, res, next) => {
  try {
    const errors = {};
    if (!req.file) errors.image = 'Please choose a photo.';
    if (!req.body.caption || !req.body.caption.trim()) errors.caption = 'Caption is required.';
    if (Object.keys(errors).length) {
      return res.status(400).render('admin/gallery/form', { title: 'New photo', image: req.body, errors });
    }
    const image = publicPathFor('gallery', req.file.filename);
    await galleryDb.create({ ...req.body, image });
    req.flash('ok', 'Photo added.');
    res.redirect('/admin/gallery');
  } catch (err) { next(err); }
});

router.get('/:id/edit', async (req, res, next) => {
  try {
    const image = await galleryDb.getById(req.params.id);
    if (!image) return res.status(404).send('Photo not found');
    res.render('admin/gallery/form', { title: 'Edit photo', image, errors: {} });
  } catch (err) { next(err); }
});

router.post('/:id', galleryUpload.single('image'), async (req, res, next) => {
  try {
    const image = req.file ? publicPathFor('gallery', req.file.filename) : null;
    await galleryDb.update(req.params.id, { ...req.body, image });
    req.flash('ok', 'Photo updated.');
    res.redirect('/admin/gallery');
  } catch (err) { next(err); }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await galleryDb.remove(req.params.id);
    req.flash('ok', 'Photo deleted.');
    res.redirect('/admin/gallery');
  } catch (err) { next(err); }
});

module.exports = router;
