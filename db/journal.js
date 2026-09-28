const pool = require('../config/db');

async function getLatestIssue() {
  const [rows] = await pool.query('SELECT * FROM journal_issues ORDER BY published_date DESC LIMIT 1');
  return rows[0] || null;
}

async function listPreviousIssues(excludeLatestId) {
  const [rows] = await pool.query(
    'SELECT * FROM journal_issues WHERE id != ? ORDER BY published_date DESC',
    [excludeLatestId || 0]
  );
  return rows;
}

async function listAllIssues() {
  const [rows] = await pool.query('SELECT * FROM journal_issues ORDER BY published_date DESC');
  return rows;
}

async function getIssueById(id) {
  const [rows] = await pool.query('SELECT * FROM journal_issues WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getArticlesForIssue(issueId) {
  const [rows] = await pool.query(
    'SELECT * FROM journal_articles WHERE issue_id = ? ORDER BY sort_order ASC, id ASC',
    [issueId]
  );
  return rows;
}

async function createIssue(data) {
  const [result] = await pool.query(
    `INSERT INTO journal_issues (volume, issue_no, year, theme, cover_image, issn, published_date, language, pages, pdf_path)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [data.volume, data.issue_no, data.year, data.theme || '', data.cover_image || null, data.issn || '',
      data.published_date, data.language || 'English', data.pages || '', data.pdf_path || null]
  );
  return result.insertId;
}

async function updateIssue(id, data) {
  const sets = ['volume = ?', 'issue_no = ?', 'year = ?', 'theme = ?', 'issn = ?', 'published_date = ?', 'language = ?', 'pages = ?'];
  const values = [data.volume, data.issue_no, data.year, data.theme || '', data.issn || '', data.published_date, data.language || 'English', data.pages || ''];
  if (data.cover_image) { sets.push('cover_image = ?'); values.push(data.cover_image); }
  if (data.pdf_path) { sets.push('pdf_path = ?'); values.push(data.pdf_path); }
  values.push(id);
  await pool.query(`UPDATE journal_issues SET ${sets.join(', ')} WHERE id = ?`, values);
}

async function removeIssue(id) {
  await pool.query('DELETE FROM journal_issues WHERE id = ?', [id]);
}

async function replaceArticles(issueId, articles) {
  await pool.query('DELETE FROM journal_articles WHERE issue_id = ?', [issueId]);
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (!a.title) continue;
    await pool.query(
      'INSERT INTO journal_articles (issue_id, title, authors, abstract, sort_order) VALUES (?,?,?,?,?)',
      [issueId, a.title, a.authors || '', a.abstract || '', i]
    );
  }
}

async function listNewsletters() {
  const [rows] = await pool.query('SELECT * FROM newsletters ORDER BY published_date DESC');
  return rows;
}

async function getNewsletterById(id) {
  const [rows] = await pool.query('SELECT * FROM newsletters WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createNewsletter(data) {
  const [result] = await pool.query(
    'INSERT INTO newsletters (title, published_date, highlights, pdf_path) VALUES (?,?,?,?)',
    [data.title, data.published_date, data.highlights || '', data.pdf_path || null]
  );
  return result.insertId;
}

async function updateNewsletter(id, data) {
  const sets = ['title = ?', 'published_date = ?', 'highlights = ?'];
  const values = [data.title, data.published_date, data.highlights || ''];
  if (data.pdf_path) { sets.push('pdf_path = ?'); values.push(data.pdf_path); }
  values.push(id);
  await pool.query(`UPDATE newsletters SET ${sets.join(', ')} WHERE id = ?`, values);
}

async function removeNewsletter(id) {
  await pool.query('DELETE FROM newsletters WHERE id = ?', [id]);
}

module.exports = {
  getLatestIssue, listPreviousIssues, listAllIssues, getIssueById, getArticlesForIssue,
  createIssue, updateIssue, removeIssue, replaceArticles,
  listNewsletters, getNewsletterById, createNewsletter, updateNewsletter, removeNewsletter,
};
