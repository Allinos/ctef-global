const pool = require('../config/db');

async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM admin_users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function create(username, passwordHash) {
  const [result] = await pool.query(
    'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
    [username, passwordHash]
  );
  return result.insertId;
}

async function counts() {
  const [[events]] = await pool.query('SELECT COUNT(*) AS n FROM events');
  const [[gallery]] = await pool.query('SELECT COUNT(*) AS n FROM gallery_images');
  const [[news]] = await pool.query('SELECT COUNT(*) AS n FROM news');
  const [[issues]] = await pool.query('SELECT COUNT(*) AS n FROM journal_issues');
  const [[newsletters]] = await pool.query('SELECT COUNT(*) AS n FROM newsletters');
  return {
    events: events.n, gallery: gallery.n, news: news.n,
    issues: issues.n, newsletters: newsletters.n,
  };
}

module.exports = { findByUsername, create, counts };
