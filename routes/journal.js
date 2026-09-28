const express = require('express');
const router = express.Router();
const journalDb = require('../db/journal');
const { memoryUpload } = require('../middleware/upload');

router.get('/', async (req, res, next) => {
  try {
    const latest = await journalDb.getLatestIssue();
    const [previous, articles, newsletters] = await Promise.all([
      journalDb.listPreviousIssues(latest ? latest.id : 0),
      latest ? journalDb.getArticlesForIssue(latest.id) : [],
      journalDb.listNewsletters(),
    ]);
    res.render('journal/index', {
      title: 'Journal & newsletter',
      activeNav: 'journal',
      latest,
      articles,
      previous,
      newsletters,
    });
  } catch (err) { next(err); }
});

router.get('/issue/:id', async (req, res, next) => {
  try {
    const issue = await journalDb.getIssueById(req.params.id);
    if (!issue) return res.status(404).render('404', { title: 'Issue not found', activeNav: 'journal' });
    const articles = await journalDb.getArticlesForIssue(issue.id);
    res.render('journal/issue', {
      title: `${issue.volume}, ${issue.issue_no}`,
      activeNav: 'journal',
      issue,
      articles,
    });
  } catch (err) { next(err); }
});

router.get('/newsletter/:id', async (req, res, next) => {
  try {
    const newsletter = await journalDb.getNewsletterById(req.params.id);
    if (!newsletter) return res.status(404).render('404', { title: 'Newsletter not found', activeNav: 'journal' });
    res.render('journal/newsletter', {
      title: `${newsletter.title} newsletter`,
      activeNav: 'journal',
      newsletter,
    });
  } catch (err) { next(err); }
});

router.post('/submit', memoryUpload.any(), (req, res) => {
  req.flash('ok', 'Paper submitted. The editorial team will acknowledge it by email.');
  res.redirect('/journal#submit');
});

router.post('/subscribe', (req, res) => {
  req.flash('ok', 'Subscribed! One email a month, unsubscribe anytime.');
  res.redirect(req.get('Referer') || '/journal');
});

module.exports = router;
