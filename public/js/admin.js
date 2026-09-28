(function () {
  document.addEventListener('submit', (e) => {
    const msg = e.target.dataset && e.target.dataset.confirm;
    if (msg && !window.confirm(msg)) e.preventDefault();
  });

  // Live preview for any <input type=file> with a sibling [data-preview]
  document.querySelectorAll('input[type=file][data-preview]').forEach((input) => {
    input.addEventListener('change', () => {
      const target = document.querySelector(input.dataset.preview);
      if (!target || !input.files[0]) return;
      target.src = URL.createObjectURL(input.files[0]);
      target.style.display = '';
    });
  });

  // Add/remove article rows on the journal issue form
  const addBtn = document.getElementById('addArticleRow');
  const rowsWrap = document.getElementById('articleRows');
  if (addBtn && rowsWrap) {
    addBtn.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'article-row';
      row.innerHTML = `
        <button type="button" class="icon-btn remove-row" aria-label="Remove article">✕</button>
        <div class="field"><label>Article title</label><input class="input" name="article_title"></div>
        <div class="field"><label>Authors</label><input class="input" name="article_authors"></div>
        <div class="field"><label>Abstract</label><textarea class="input" name="article_abstract"></textarea></div>`;
      rowsWrap.appendChild(row);
    });
    rowsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-row');
      if (btn) btn.closest('.article-row').remove();
    });
  }
})();
