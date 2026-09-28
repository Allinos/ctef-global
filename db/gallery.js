const pool = require('../config/db');

async function listAll(category) {
  const params = [];
  let sql = 'SELECT * FROM gallery_images';
  if (category && category !== 'All') { sql += ' WHERE category = ?'; params.push(category); }
  sql += ' ORDER BY sort_order ASC, created_at DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function listCategories() {
  const [rows] = await pool.query('SELECT DISTINCT category FROM gallery_images ORDER BY category');
  return rows.map((r) => r.category);
}

async function listRecent(limit = 6) {
  const [rows] = await pool.query('SELECT * FROM gallery_images ORDER BY created_at DESC LIMIT ?', [limit]);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM gallery_images WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    'INSERT INTO gallery_images (image, caption, category, sort_order) VALUES (?,?,?,?)',
    [data.image, data.caption || '', data.category || 'General', data.sort_order || 0]
  );
  return result.insertId;
}

async function update(id, data) {
  const sets = ['caption = ?', 'category = ?', 'sort_order = ?'];
  const values = [data.caption || '', data.category || 'General', data.sort_order || 0];
  if (data.image) { sets.push('image = ?'); values.push(data.image); }
  values.push(id);
  await pool.query(`UPDATE gallery_images SET ${sets.join(', ')} WHERE id = ?`, values);
}

async function remove(id) {
  await pool.query('DELETE FROM gallery_images WHERE id = ?', [id]);
}

module.exports = { listAll, listCategories, listRecent, getById, create, update, remove };
