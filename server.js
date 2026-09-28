require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('./middleware/flash');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.icon = (name, cls) => `<svg class="${cls || ''}"><use href="#i-${name}"/></svg>`;
app.locals.fmtDate = (iso, opt) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opt || { day: 'numeric', month: 'short', year: 'numeric' });
app.locals.bio = (name, focus) => `${name} has served education for over two decades, with a focus on ${focus}. They contribute to CTEF's teacher development programmes, chapter mentoring and policy dialogue.`;
app.locals.initials = (name) => (name || '').replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 },
}));
app.use(flash);

app.use('/', require('./routes/public'));
app.use('/events', require('./routes/events'));
app.use('/journal', require('./routes/journal'));
app.use('/news', require('./routes/news'));
app.use('/gallery', require('./routes/gallery'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found', activeNav: '' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong. Please try again.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CTEF Global running at http://localhost:${PORT}`));
