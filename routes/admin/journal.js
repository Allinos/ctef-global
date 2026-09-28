const express = require('express');
const router = express.Router();
const journalDb = require('../../db/journal');
const { journalUpload, publicPathFor } = require('../../middleware/upload');

function toArray(v) { return Array.isArray(v) ? v : (v === undefined ? [] : [v]); }

function articlesFromBody(body) {
  const titles = toArray(body.article_title);
  const authors = toArray(body.article_authors);
  const abstracts = toArray(body.article_abstract);
  return titles.map((title, i) => ({ title: (title || '').trim(), authors: authors[i] || '', abstract: abstracts[i] || '' }))
    .filter((a) => a.title);
}

/* ---- Issues ---- */
router.get('/', async (req, res, next) => {
  try {
    const issues = await journalDb.listAllIssues();
    res.render('admin/journal/issues', { title: 'Manage journal issues', issues });
  } catch (err) { next(err); }
});

router.get('/issues/new', (req, res) => {
  res.render('admin/journal/issue-form', { title: 'New issue', issue: {}, articles: [], errors: {} });
});

router.post('/issues', journalUpload.single('cover_image'), async (req, res, next) => {
  try {
    const errors = {};
    if (!req.body.volume) errors.volume = 'Volume is required.';
    if (!req.body.issue_no) errors.issue_no = 'Issue number is required.';
    if (!req.body.published_date) errors.published_date = 'Published date is required.';
    if (Object.keys(errors).length) {
      return res.status(400).render('admin/journal/issue-form', { title: 'New issue', issue: req.body, articles: articlesFromBody(req.body), errors });
    }
    const cover_image = req.file ? publicPathFor('journal', req.file.filename) : null;
    const id = await journalDb.createIssue({ ...req.body, cover_image });
    await journalDb.replaceArticles(id, articlesFromBody(req.body));
    req.flash('ok', 'Issue created.');
    res.redirect('/admin/journal');
  } catch (err) { next(err); }
});

router.get('/issues/:id/edit', async (req, res, next) => {
  try {
    const issue = await journalDb.getIssueById(req.params.id);
    if (!issue) return res.status(404).send('Issue not found');
    const articles = await journalDb.getArticlesForIssue(issue.id);
    res.render('admin/journal/issue-form', { title: 'Edit issue', issue, articles, errors: {} });
  } catch (err) { next(err); }
});

router.post('/issues/:id', journalUpload.single('cover_image'), async (req, res, next) => {
  try {
    const cover_image = req.file ? publicPathFor('journal', req.file.filename) : null;
    await journalDb.updateIssue(req.params.id, { ...req.body, cover_image });
    await journalDb.replaceArticles(req.params.id, articlesFromBody(req.body));
    req.flash('ok', 'Issue updated.');
    res.redirect('/admin/journal');
  } catch (err) { next(err); }
});

router.post('/issues/:id/delete', async (req, res, next) => {
  try {
    await journalDb.removeIssue(req.params.id);
    req.flash('ok', 'Issue deleted.');
    res.redirect('/admin/journal');
  } catch (err) { next(err); }
});

/* ---- Newsletters ---- */
router.get('/newsletters', async (req, res, next) => {
  try {
    const newsletters = await journalDb.listNewsletters();
    res.render('admin/journal/newsletters', { title: 'Manage newsletters', newsletters });
  } catch (err) { next(err); }
});

router.get('/newsletters/new', (req, res) => {
  res.render('admin/journal/newsletter-form', { title: 'New newsletter', newsletter: {}, errors: {} });
});

router.post('/newsletters', async (req, res, next) => {
  try {
    const errors = {};
    if (!req.body.title) errors.title = 'Title is required.';
    if (!req.body.published_date) errors.published_date = 'Published date is required.';
    if (Object.keys(errors).length) {
      return res.status(400).render('admin/journal/newsletter-form', { title: 'New newsletter', newsletter: req.body, errors });
    }
    await journalDb.createNewsletter(req.body);
    req.flash('ok', 'Newsletter created.');
    res.redirect('/admin/journal/newsletters');
  } catch (err) { next(err); }
});

router.get('/newsletters/:id/edit', async (req, res, next) => {
  try {
    const newsletter = await journalDb.getNewsletterById(req.params.id);
    if (!newsletter) return res.status(404).send('Newsletter not found');
    res.render('admin/journal/newsletter-form', { title: 'Edit newsletter', newsletter, errors: {} });
  } catch (err) { next(err); }
});

router.post('/newsletters/:id', async (req, res, next) => {
  try {
    await journalDb.updateNewsletter(req.params.id, req.body);
    req.flash('ok', 'Newsletter updated.');
    res.redirect('/admin/journal/newsletters');
  } catch (err) { next(err); }
});

router.post('/newsletters/:id/delete', async (req, res, next) => {
  try {
    await journalDb.removeNewsletter(req.params.id);
    req.flash('ok', 'Newsletter deleted.');
    res.redirect('/admin/journal/newsletters');
  } catch (err) { next(err); }
});

module.exports = router;
