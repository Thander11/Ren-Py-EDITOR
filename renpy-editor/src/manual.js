// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — User manual screen. The manual is in Spanish and
// English (src/manual/manual-*.js): Spanish when the editor is in
// Spanish, English for every other language.
// ═══════════════════════════════════════════════════════════

let manualShownLang = '';
let manualPrevNav = 'nav-scenes';
let manualObserver = null;

const manualLang = () => currentLang === 'es' ? 'es' : 'en';

function openManual(sectionId) {
  const screen = document.getElementById('manual-screen');
  if (!screen.classList.contains('open')) {
    manualPrevNav = document.querySelector('#sidebar .sb-item.active')?.id || 'nav-scenes';
  }
  renderManual();
  hideEmbeddedEditors();
  screen.classList.add('open');
  setActiveNav('nav-manual');
  if (sectionId) goToManualSection(sectionId);
  else document.getElementById('manual-search').focus();
}

function closeManual() {
  document.getElementById('manual-screen').classList.remove('open');
  if (manualPrevNav === 'nav-map') openStoryMap();
  else if (manualPrevNav === 'nav-main-menu') openMainMenuEditor();
  else if (manualPrevNav === 'nav-gui') openGuiEditor();
  else setActiveNav(manualPrevNav);
}

function renderManual() {
  const lang = manualLang();
  if (manualShownLang === lang) return;
  manualShownLang = lang;
  const m = MANUALS[lang];
  document.getElementById('manual-title').textContent = m.title;
  const search = document.getElementById('manual-search');
  search.placeholder = m.search;
  search.setAttribute('aria-label', m.search);
  search.value = '';
  document.getElementById('manual-toc').setAttribute('aria-label', m.contents);
  const article = document.getElementById('manual-article');
  article.innerHTML = m.html + `<p class="manual-empty" hidden>${escHtml(m.noResults)}</p>`;
  // Links inside the manual go to its sections; outside links open in the browser
  article.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    goToManualSection(a.getAttribute('href').slice(1));
  }));
  const sections = [...article.querySelectorAll('section')];
  document.getElementById('manual-toc').innerHTML = `<div class="manual-toc-title">${escHtml(m.contents)}</div>` +
    sections.map(s => `<a href="#${s.id}" data-section="${s.id}" onclick="event.preventDefault(); goToManualSection('${s.id}')">${escHtml(s.querySelector('h2').textContent)}</a>`).join('');
  // The table of contents follows the section being read
  if (manualObserver) manualObserver.disconnect();
  manualObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (visible) markManualSection(visible.target.id);
  }, { root: article, rootMargin: '0px 0px -70% 0px' });
  sections.forEach(s => manualObserver.observe(s));
  markManualSection(sections[0]?.id);
}

function markManualSection(id) {
  document.querySelectorAll('#manual-toc a').forEach(a => {
    const on = a.dataset.section === id;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
}

function goToManualSection(id) {
  const section = document.getElementById('manual-article').querySelector('#' + CSS.escape(id));
  if (!section) return;
  if (section.hidden) { document.getElementById('manual-search').value = ''; filterManual(''); }
  section.scrollIntoView({ block: 'start' });
  markManualSection(id);
}

// Accents and case don't matter when searching
const manualFold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function filterManual(query) {
  const q = manualFold(query.trim());
  const article = document.getElementById('manual-article');
  let shown = 0;
  article.querySelectorAll('section').forEach(s => {
    const match = !q || manualFold(s.textContent).includes(q);
    s.hidden = !match;
    document.querySelector(`#manual-toc a[data-section="${s.id}"]`).hidden = !match;
    if (match) shown++;
  });
  article.querySelector('.manual-empty').hidden = shown > 0;
  article.scrollTop = 0;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'F1') { e.preventDefault(); openManual(); }
  else if (e.key === 'Escape' && document.getElementById('manual-screen').classList.contains('open')
    && !document.querySelector('.app-overlay.open, #modal-overlay.open, .app-dialog-overlay')) closeManual();
});
