const express = require('express');
const router = express.Router();
const galleryDb = require('../db/gallery');

router.get('/', async (req, res, next) => {
  try {
    const category = req.query.category || 'All';
    const [images, categories] = await Promise.all([
      galleryDb.listAll(category),
      galleryDb.listCategories(),
    ]);
    res.render('gallery/index', {
      title: 'Gallery',
      activeNav: 'gallery',
      images,
      categories,
      category,
    });
  } catch (err) { next(err); }
});

module.exports = router;
