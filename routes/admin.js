const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const adminDb = require('../db/admin');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin login', error: null });
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await adminDb.findByUsername(username || '');
    const ok = user && await bcrypt.compare(password || '', user.password_hash);
    if (!ok) {
      return res.status(401).render('admin/login', { title: 'Admin login', error: 'Invalid username or password.' });
    }
    req.session.adminId = user.id;
    req.session.adminUsername = user.username;
    const dest = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(dest);
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireAdmin);
router.use((req, res, next) => {
  res.locals.adminUsername = req.session.adminUsername;
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const counts = await adminDb.counts();
    res.render('admin/dashboard', { title: 'Admin dashboard', counts });
  } catch (err) { next(err); }
});

router.use('/events', require('./admin/events'));
router.use('/gallery', require('./admin/gallery'));
router.use('/news', require('./admin/news'));
router.use('/journal', require('./admin/journal'));

module.exports = router;
