(function () {
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* Theme toggle, persisted */
  const savedTheme = localStorage.getItem('ctef-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const action = t.dataset.action;

    if (action === 'menu') {
      const open = $('#mainnav').classList.toggle('open');
      t.setAttribute('aria-expanded', open);
    } else if (action === 'theme') {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      localStorage.setItem('ctef-theme', root.dataset.theme);
    } else if (action === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (action === 'close') {
      closeLightbox();
    }

    if (t.matches('.has-dd > .nav-link') && matchMedia('(max-width:1024px)').matches) {
      const li = t.parentElement;
      if (!li.classList.contains('open')) {
        e.preventDefault();
        $$('.has-dd.open').forEach((x) => x !== li && x.classList.remove('open'));
        li.classList.add('open');
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-dd')) $$('.has-dd.open').forEach((li) => li.classList.remove('open'));
  });

  window.addEventListener('scroll', () => {
    const btn = $('.to-top');
    if (btn) btn.classList.toggle('show', window.scrollY > 600);
  }, { passive: true });

  /* Lightbox gallery viewer: any button with [data-lb-trigger] inside the same
     [data-lb-group] container is treated as one album. */
  let lbList = [];
  let lbIdx = 0;
  const lightbox = $('#lightbox');

  function showLb() {
    const item = lbList[lbIdx];
    if (!item) return;
    $('#lbImg').src = item.src;
    $('#lbImg').alt = item.cap;
    $('#lbCap').textContent = `${item.cap} (${lbIdx + 1}/${lbList.length})`;
  }
  function openLightbox(group, index) {
    lbList = $$('[data-lb-trigger]', group).map((el) => ({ src: el.dataset.src, cap: el.dataset.cap }));
    lbIdx = index;
    showLb();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lb-trigger]');
    if (!t) return;
    const group = t.closest('[data-lb-group]') || document;
    const index = $$('[data-lb-trigger]', group).indexOf(t);
    openLightbox(group, index);
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lb]');
    if (!t) return;
    lbIdx = (lbIdx + Number(t.dataset.lb) + lbList.length) % lbList.length;
    showLb();
  });
  if (lightbox) {
    lightbox.addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLightbox(); $$('.has-dd.open').forEach((li) => li.classList.remove('open')); }
    if (lightbox && lightbox.classList.contains('open')) {
      if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbList.length; showLb(); }
      if (e.key === 'ArrowLeft') { lbIdx = (lbIdx - 1 + lbList.length) % lbList.length; showLb(); }
    }
  });

  /* Life members directory: client-side search/filter, same behaviour as the
     original static site. */
  const lmState = $('#lmState');
  const lmDist = $('#lmDist');
  const lmQ = $('#lmQ');
  const lmGrid = $('#lmGrid');
  const lmMore = $('#lmMore');
  let lmLimit = 6;

  function fillDistricts(sel, state) {
    if (!sel) return;
    const opts = STATES_DATA && state ? (STATES_DATA[state] || []) : [];
    sel.innerHTML = '<option value="">' + (state ? 'All districts' : 'Select state first') + '</option>'
      + opts.map((d) => `<option>${d}</option>`).join('');
  }

  function renderLife() {
    if (!lmGrid) return;
    const st = lmState ? lmState.value : '';
    const di = lmDist ? lmDist.value : '';
    const q = lmQ ? lmQ.value.trim().toLowerCase() : '';
    const cards = $$('.person', lmGrid);
    const matches = cards.filter((c) => {
      const okState = !st || c.dataset.state === st;
      const okDist = !di || c.dataset.district === di;
      const okQ = !q || c.dataset.name.toLowerCase().includes(q) || c.dataset.no.toLowerCase().includes(q);
      return okState && okDist && okQ;
    });
    cards.forEach((c) => { c.style.display = 'none'; });
    matches.slice(0, lmLimit).forEach((c) => { c.style.display = ''; });
    const info = $('#lmInfo');
    if (info) info.textContent = matches.length ? `Showing ${Math.min(lmLimit, matches.length)} of ${matches.length} life members` : 'No life members match these filters.';
    if (lmMore) lmMore.style.display = matches.length > lmLimit ? '' : 'none';
  }
  if (lmState) lmState.addEventListener('change', () => { fillDistricts(lmDist, lmState.value); lmLimit = 6; renderLife(); });
  if (lmDist) lmDist.addEventListener('change', () => { lmLimit = 6; renderLife(); });
  if (lmQ) lmQ.addEventListener('input', () => { lmLimit = 6; renderLife(); });
  if (lmMore) lmMore.addEventListener('click', () => { lmLimit += 6; renderLife(); });
  if (lmGrid) { fillDistricts(lmDist, ''); renderLife(); }

  /* Institutional members: client-side search/filter */
  const imState = $('#imState');
  const imQ = $('#imQ');
  const imGrid = $('#imGrid');
  function renderInst() {
    if (!imGrid) return;
    const st = imState ? imState.value : '';
    const q = imQ ? imQ.value.trim().toLowerCase() : '';
    const cards = $$('.person', imGrid);
    let shown = 0;
    cards.forEach((c) => {
      const ok = (!st || c.dataset.state === st) && (!q || c.dataset.name.toLowerCase().includes(q));
      c.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    const info = $('#imInfo');
    if (info) info.textContent = shown ? `${shown} institution${shown > 1 ? 's' : ''}` : 'No institutions match.';
  }
  if (imState) imState.addEventListener('change', renderInst);
  if (imQ) imQ.addEventListener('input', renderInst);
  if (imGrid) renderInst();

  /* Chapters search */
  const chQ = $('#chQ');
  const chGrid = $('#chGrid');
  function renderChapters() {
    if (!chGrid) return;
    const q = chQ.value.trim().toLowerCase();
    const cards = $$('.chapter', chGrid);
    let shown = 0;
    cards.forEach((c) => {
      const ok = !q || c.dataset.state.toLowerCase().includes(q);
      c.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    const info = $('#chInfo');
    if (info) info.textContent = `${shown} of ${cards.length} chapters`;
  }
  if (chQ) chQ.addEventListener('input', renderChapters);

  /* Contact message character counter */
  const cfMsg = $('#cf-msg');
  const cfCount = $('#cfCount');
  if (cfMsg && cfCount) {
    cfMsg.addEventListener('input', () => { cfCount.textContent = `${cfMsg.value.length} / 1000`; });
  }
})();
