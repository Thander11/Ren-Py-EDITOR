// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Main Menu Window Renderer
// ═══════════════════════════════════════════════════════════
// Generates game/main_menu_custom.rpy, which replaces the main_menu screen of
// screens.rpy (init offset = 1 makes it be defined after the original one).
// The settings are saved as JSON in the first line of that file.

const MM_FILE = 'main_menu_custom.rpy';
const MM_DIR = 'gui/main_menu_custom';      // copied backgrounds, GIF frames and fonts
const CONFIG_MARKER = '## renpy-editor:main_menu ';
const GIF_IMAGE_NAME = 'editor_main_menu_background';

// Buttons of the main menu: Ren'Py's default text, action and when it is shown
const MENU_BUTTONS = {
  start: { text: 'Start', action: 'Start()' },
  load: { text: 'Load', action: 'ShowMenu("load")' },
  preferences: { text: 'Preferences', action: 'ShowMenu("preferences")' },
  about: { text: 'About', action: 'ShowMenu("about")' },
  help: { text: 'Help', action: 'ShowMenu("help")', condition: 'renpy.variant("pc") or (renpy.variant("web") and not renpy.variant("mobile"))' },
  quit: { text: 'Quit', action: 'Quit(confirm=False)', condition: 'renpy.variant("pc")' }
};

const POS_PRESETS_X = [0.03, 0.5, 0.97];
const POS_PRESETS_Y = [0.05, 0.5, 0.95];

let gamePath = '';
let translations = {};
let cfg = null;
let dirty = false;
let previewScale = 1;
const project = {
  width: 1280, height: 720,
  name: '', version: '',
  background: 'gui/main_menu.png',
  sidePanel: '',
  accent: '#00b8c3', idle: '#888888', hover: '#66d4db'
};

// ── I18N ──
async function loadI18n(lang) {
  try {
    translations = JSON.parse(await window.mmApi.readI18n(lang));
    document.documentElement.lang = lang;
  } catch (e) { translations = {}; }
}
function t(key, ...args) {
  let str = stripLeadingEmoji(translations[key] || key);
  args.forEach((a, i) => { str = str.replace(`{${i}}`, a); });
  return str;
}
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.getAttribute('data-i18n'));
    if (val !== el.getAttribute('data-i18n')) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.title = "Ren'Py EDITOR — " + t('main_menu_title');
  document.getElementById('mm-title-text').placeholder = t('mm_title_text_placeholder', project.name);
}

function notify(msg, type = 'ok') {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.className = 'notification show ' + type;
  clearTimeout(n._timer);
  n._timer = setTimeout(() => n.classList.remove('show'), 2500);
}

// file:// URL of a file given its path relative to the game/ folder
function getGameFileURL(relativePath) {
  if (!gamePath || !relativePath) return '';
  return fileURL(gamePath + '/' + relativePath);
}

// file:// URL of an absolute path
function fileURL(absPath) {
  const parts = absPath.replace(/\\/g, '/').replace(/^\/+/, '').split('/');
  return 'file:///' + parts.map((s, i) => (i === 0 && /^[a-zA-Z]:$/.test(s)) ? s : encodeURIComponent(s)).join('/');
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const scaleSize = (n) => Math.round(n * project.height / 720);
const baseName = (p) => (p || '').split(/[\\/]/).pop();

// ═══════════════════════════════════════════════════════════
// PROJECT INFO (resolution, name, colors from gui.rpy / options.rpy)
// ═══════════════════════════════════════════════════════════
function mixWithWhite(hex, fraction) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map(c => Math.round(c * fraction + 255 * (1 - fraction)));
  return '#' + ch.map(c => c.toString(16).padStart(2, '0')).join('');
}

function readDefine(text, name) {
  const m = new RegExp(`^\\s*define\\s+${name.replace(/\./g, '\\.')}\\s*=\\s*(?:_\\(\\s*)?(["'])(.*?)\\1`, 'm').exec(text || '');
  return m ? m[2] : null;
}

async function loadProjectInfo() {
  const gui = await window.mmApi.readFile('gui.rpy') || '';
  const options = await window.mmApi.readFile('options.rpy') || '';
  const size = /gui\.init\(\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(gui);
  if (size) { project.width = +size[1]; project.height = +size[2]; }
  const hex = (v) => /^#[0-9a-fA-F]{6}$/.test(v || '') ? v.toLowerCase() : null;
  project.accent = hex(readDefine(gui, 'gui.accent_color')) || project.accent;
  project.idle = hex(readDefine(gui, 'gui.idle_color')) || project.idle;
  project.hover = hex(readDefine(gui, 'gui.hover_color')) || mixWithWhite(project.accent, 0.6);
  project.background = readDefine(gui, 'gui.main_menu_background') || project.background;
  project.name = readDefine(options, 'config.name') || '';
  project.version = readDefine(options, 'config.version') || '';
  project.sidePanel = await window.mmApi.fileExists('gui/overlay/main_menu.png') ? 'gui/overlay/main_menu.png' : '';
  document.getElementById('mm-resolution').textContent = `${project.width} × ${project.height}`;
}

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
function defaultConfig() {
  return {
    version: 1,
    enabled: true,
    background: { type: 'default', color: '#1a1a2e', file: '', fileName: '', fit: 'cover', frames: [] },
    overlay: { sidePanel: true, color: '#000000', opacity: 0 },
    title: {
      show: true, text: '', size: scaleSize(50), color: project.accent,
      font: '', fontName: '', fontLicense: '', systemFont: null, outlineSize: 0, outlineColor: '#000000',
      xalign: 0.97, yalign: 0.95,
      showVersion: true, versionSize: scaleSize(18), versionColor: project.accent
    },
    buttons: {
      layout: 'vertical', xalign: 0.03, yalign: 0.5, spacing: scaleSize(12), textAlign: 'left',
      size: scaleSize(22), font: '', fontName: '', fontLicense: '', systemFont: null,
      idleColor: project.idle, hoverColor: project.hover,
      outlineSize: 0, outlineColor: '#000000',
      bgEnabled: false, bgColor: '#000000', bgHoverColor: project.accent, bgOpacity: 60,
      bgKind: 'color', bgImg: defaultBgImage(),
      padding: scaleSize(6), minWidth: 0,
      items: Object.keys(MENU_BUTTONS).map(defaultButtonItem)
    },
    music: { file: '' }
  };
}

// Background image of the text buttons: with the size of the image (text centered on it)
// or stretched to fit the text keeping its borders (like Ren'Py's Frame)
function defaultBgImage() {
  return { image: '', hoverImage: '', fit: 'image', zoom: 100, border: scaleSize(12) };
}

// A button of the menu: text, text over its own background image or an image,
// inside the group of buttons or at its own position
function defaultButtonItem(id) {
  return {
    id, show: true, text: '', kind: 'text', image: '', hoverImage: '', zoom: 100,
    bg: defaultBgImage(), free: false, xalign: 0.5, yalign: 0.5
  };
}

function mergeConfig(base, saved) {
  for (const key in saved) {
    if (!(key in base)) continue;
    const b = base[key], s = saved[key];
    if (b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object') mergeConfig(b, s);
    else if (Array.isArray(b) === Array.isArray(s) && (b === null || typeof b === typeof s)) base[key] = s;
  }
  return base;
}

async function loadConfig() {
  cfg = defaultConfig();
  const text = await window.mmApi.readFile(MM_FILE);
  const line = (text || '').split('\n')[0];
  if (line.startsWith(CONFIG_MARKER)) {
    try {
      const saved = JSON.parse(line.slice(CONFIG_MARKER.length));
      // The file created with the project only disables the menu: start from the defaults
      if (!saved.placeholder) mergeConfig(cfg, saved);
    } catch (e) { /* use defaults */ }
  }
  // Keep only known buttons and add the ones missing in old configs
  const items = cfg.buttons.items.filter(it => MENU_BUTTONS[it.id]).map(it => Object.assign(defaultButtonItem(it.id), it));
  for (const id of Object.keys(MENU_BUTTONS)) {
    if (!items.some(it => it.id === id)) items.push(defaultButtonItem(id));
  }
  cfg.buttons.items = items;
}

function getPath(path) { return path.split('.').reduce((o, k) => o?.[k], cfg); }
function setPath(path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], cfg)[last] = value;
}

function markDirty(value = true) {
  dirty = value;
  document.getElementById('mm-dirty').classList.toggle('show', dirty);
}

// ═══════════════════════════════════════════════════════════
// CONTROLS
// ═══════════════════════════════════════════════════════════
function bindControls() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const ev = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(ev, () => {
      let value;
      if (el.type === 'checkbox') value = el.checked;
      else if (el.type === 'range') value = parseFloat(el.value);
      else value = el.value;
      setPath(el.dataset.key, value);
      markDirty();
      if (el.dataset.key === 'music.file') updateMusicPlayer();
      if (el.dataset.key === 'background.type') updateFileLabels();
      syncControls(el);
      renderPreview();
    });
  });

  document.querySelectorAll('[data-pos-grid]').forEach(grid => {
    const target = grid.dataset.posGrid;
    for (const y of POS_PRESETS_Y) {
      for (const x of POS_PRESETS_X) {
        const btn = document.createElement('button');
        btn.dataset.x = x; btn.dataset.y = y;
        btn.addEventListener('click', () => {
          cfg[target].xalign = x;
          cfg[target].yalign = y;
          markDirty();
          syncControls();
          renderPreview();
        });
        grid.appendChild(btn);
      }
    }
  });
}

// Copy cfg values to the controls (except the one being edited)
function syncControls(except = null) {
  document.querySelectorAll('[data-key]').forEach(el => {
    if (el === except) return;
    const v = getPath(el.dataset.key);
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v ?? '';
  });
  document.querySelectorAll('[data-out]').forEach(el => {
    const v = getPath(el.dataset.out);
    el.textContent = el.hasAttribute('data-percent') ? Math.round(v * 100) + '%' : v;
  });
  document.querySelectorAll('[data-show-if]').forEach(el => {
    const [path, values] = el.dataset.showIf.split('=');
    el.style.display = values.split(',').includes(String(getPath(path))) ? '' : 'none';
  });
  document.querySelectorAll('[data-pos-grid]').forEach(grid => {
    const target = cfg[grid.dataset.posGrid];
    grid.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', Math.abs(b.dataset.x - target.xalign) < 0.001 && Math.abs(b.dataset.y - target.yalign) < 0.001);
    });
  });
}

function updateFileLabels() {
  const bg = cfg.background;
  const fileLabel = document.getElementById('mm-bg-file');
  const kindMatches = bg.file && fileKind(bg.file) === bg.type;
  fileLabel.textContent = kindMatches
    ? (bg.fileName || baseName(bg.file)) + (bg.type === 'gif' ? ` (${t('mm_gif_frames', bg.frames.length)})` : '')
    : t('mm_no_file');
}

function fileKind(file) {
  const ext = file.split('.').pop().toLowerCase();
  if (ext === 'gif') return 'gif';
  if (['webm', 'ogv', 'mp4', 'mkv', 'avi', 'mpg', 'mpeg'].includes(ext)) return 'video';
  return 'image';
}

const expandedButtons = new Set();   // ids of the buttons whose options are open

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

function buttonChanged(rebuildList = true) {
  markDirty();
  if (rebuildList) renderButtonList();
  renderPreview();
}

function renderButtonList() {
  const list = document.getElementById('mm-button-list');
  const items = cfg.buttons.items;
  list.innerHTML = '';
  items.forEach((it, i) => {
    const item = el('div', 'mm-button-item' + (it.show ? '' : ' hidden-btn'));
    const row = el('div', 'mm-button-row');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = it.show;
    check.addEventListener('change', () => { it.show = check.checked; buttonChanged(); });

    const name = el('span', 'mm-btn-name', t('mm_btn_' + it.id));
    // Marks: image button, own position
    const badges = el('span', 'mm-btn-badges', (it.kind === 'image' && it.image ? '🖼' : '') + (it.free ? '📍' : ''));

    const input = el('input', 'form-input');
    input.value = it.text;
    input.spellcheck = true;
    input.placeholder = MENU_BUTTONS[it.id].text;
    input.addEventListener('input', () => { it.text = input.value; buttonChanged(false); });

    const expanded = expandedButtons.has(it.id);
    const opts = el('button', 'mm-move mm-btn-opts' + (expanded ? ' active' : ''), '⚙');
    opts.title = t('mm_btn_settings');
    opts.addEventListener('click', () => {
      if (expanded) expandedButtons.delete(it.id); else expandedButtons.add(it.id);
      renderButtonList();
    });

    const up = el('button', 'mm-move', '▲');
    up.disabled = i === 0;
    up.addEventListener('click', () => move(-1));
    const down = el('button', 'mm-move', '▼');
    down.disabled = i === items.length - 1;
    down.addEventListener('click', () => move(1));
    function move(dir) {
      items.splice(i, 1);
      items.splice(i + dir, 0, it);
      buttonChanged();
    }

    row.append(check, name, badges, input, opts, up, down);
    item.appendChild(row);
    if (expanded) item.appendChild(renderButtonDetails(it));
    list.appendChild(item);
  });
}

// Options of one button: text or image, and its own position
function renderButtonDetails(it) {
  const box = el('div', 'mm-btn-details');

  const kindGroup = el('div', 'form-group');
  kindGroup.appendChild(el('label', '', t('mm_btn_kind')));
  const kind = el('select', 'form-select');
  for (const k of ['text', 'textbg', 'image']) {
    const opt = el('option', '', t('mm_btn_kind_' + k));
    opt.value = k;
    kind.appendChild(opt);
  }
  kind.value = it.kind;
  kind.addEventListener('change', () => { it.kind = kind.value; buttonChanged(); });
  kindGroup.appendChild(kind);
  box.appendChild(kindGroup);

  if (it.kind === 'textbg') box.append(...bgImageControls(it.bg, (structural) => buttonChanged(structural)));

  if (it.kind === 'image') {
    box.appendChild(imagePicker(it, 'image', t('mm_btn_image'), false, () => buttonChanged()));
    box.appendChild(imagePicker(it, 'hoverImage', t('mm_btn_hover_image'), true, () => buttonChanged()));
    box.appendChild(el('div', 'form-hint', t('mm_btn_hover_hint')));

    const zoomGroup = el('div', 'form-group');
    const zoomLabel = el('label', '', t('mm_btn_zoom') + ' ');
    const zoomOut = el('output', '', it.zoom + '%');
    zoomLabel.appendChild(zoomOut);
    const zoom = el('input');
    Object.assign(zoom, { type: 'range', min: 10, max: 300, step: 5, value: it.zoom });
    zoom.addEventListener('input', () => {
      it.zoom = parseFloat(zoom.value);
      zoomOut.textContent = it.zoom + '%';
      buttonChanged(false);
    });
    zoomGroup.append(zoomLabel, zoom);
    box.appendChild(zoomGroup);
    box.appendChild(el('div', 'form-hint', t('mm_btn_alt_hint')));
  }

  const freeLabel = el('label', 'mm-check');
  const free = el('input');
  free.type = 'checkbox';
  free.checked = it.free;
  free.addEventListener('change', () => {
    // Start from where the button is now in the preview
    if (free.checked) Object.assign(it, previewAlign(it.id) || {});
    it.free = free.checked;
    buttonChanged();
  });
  freeLabel.append(free, el('span', '', t('mm_btn_own_position')));
  box.appendChild(freeLabel);

  if (it.free) box.appendChild(buttonPositionControls(it));
  return box;
}

function imagePicker(obj, field, label, removable, onChange) {
  const group = el('div', 'form-group');
  group.appendChild(el('label', '', label));
  const row = el('div', 'mm-file-row');
  row.appendChild(el('span', 'mm-file-name', obj[field] ? baseName(obj[field]) : t('mm_no_file')));
  const pick = el('button', 'btn btn-secondary', t('mm_choose_file'));
  pick.addEventListener('click', async () => {
    const copied = await copyToProject('buttonImage', 'btn_');
    if (!copied) return;
    obj[field] = copied.rel;
    onChange();
  });
  row.appendChild(pick);
  if (removable && obj[field]) {
    const clear = el('button', 'btn btn-secondary', '✕');
    clear.addEventListener('click', () => { obj[field] = ''; onChange(); });
    row.appendChild(clear);
  }
  group.appendChild(row);
  return group;
}

function rangeControl(label, min, max, step, value, suffix, onInput) {
  const group = el('div', 'form-group');
  const lab = el('label', '', label + ' ');
  const out = el('output', '', value + suffix);
  lab.appendChild(out);
  const range = el('input');
  Object.assign(range, { type: 'range', min, max, step, value });
  range.addEventListener('input', () => {
    out.textContent = range.value + suffix;
    onInput(parseFloat(range.value));
  });
  group.append(lab, range);
  return group;
}

// Controls of a background image (of all the buttons or of one button);
// onChange(true) when the controls must be rebuilt
function bgImageControls(bg, onChange) {
  const nodes = [
    imagePicker(bg, 'image', t('mm_btn_bg_image'), false, () => onChange(true)),
    imagePicker(bg, 'hoverImage', t('mm_btn_hover_image'), true, () => onChange(true)),
    el('div', 'form-hint', t('mm_btn_bg_hover_hint'))
  ];
  const fitGroup = el('div', 'form-group');
  fitGroup.appendChild(el('label', '', t('mm_fit')));
  const fit = el('select', 'form-select');
  for (const f of ['image', 'stretch']) {
    const opt = el('option', '', t('mm_btn_bg_fit_' + f));
    opt.value = f;
    fit.appendChild(opt);
  }
  fit.value = bg.fit;
  fit.addEventListener('change', () => { bg.fit = fit.value; onChange(true); });
  fitGroup.appendChild(fit);
  nodes.push(fitGroup);
  if (bg.fit === 'image') {
    nodes.push(rangeControl(t('mm_btn_zoom'), 10, 300, 5, bg.zoom, '%', (v) => { bg.zoom = v; onChange(false); }));
  } else {
    nodes.push(rangeControl(t('mm_btn_bg_border'), 0, 200, 1, bg.border, 'px', (v) => { bg.border = v; onChange(false); }));
    nodes.push(el('div', 'form-hint', t('mm_btn_bg_border_hint')));
  }
  return nodes;
}

// Background image of all the buttons (section "Buttons")
function renderGlobalBgImage() {
  const box = document.getElementById('mm-btn-bgimg');
  box.innerHTML = '';
  box.append(...bgImageControls(cfg.buttons.bgImg, (structural) => {
    markDirty();
    if (structural) renderGlobalBgImage();
    renderPreview();
  }));
}

function buttonPositionControls(it) {
  const wrap = el('div', 'mm-position');
  const grid = el('div', 'mm-pos-grid');
  for (const y of POS_PRESETS_Y) {
    for (const x of POS_PRESETS_X) {
      const b = el('button');
      b.classList.toggle('active', Math.abs(x - it.xalign) < 0.001 && Math.abs(y - it.yalign) < 0.001);
      b.addEventListener('click', () => { Object.assign(it, { xalign: x, yalign: y }); buttonChanged(); });
      grid.appendChild(b);
    }
  }
  const sliders = el('div', 'mm-pos-sliders');
  for (const [axis, key] of [['x', 'mm_pos_x'], ['y', 'mm_pos_y']]) {
    const prop = axis + 'align';
    const label = el('label', '', t(key) + ' ');
    const out = el('output', '', Math.round(it[prop] * 100) + '%');
    label.appendChild(out);
    const range = el('input');
    Object.assign(range, { type: 'range', min: 0, max: 1, step: 0.005, value: it[prop] });
    range.addEventListener('input', () => {
      it[prop] = parseFloat(range.value);
      out.textContent = Math.round(it[prop] * 100) + '%';
      grid.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      buttonChanged(false);
    });
    sliders.append(label, range);
  }
  wrap.append(grid, sliders);
  return wrap;
}

// xalign/yalign of the place a button occupies now in the preview
function previewAlign(id) {
  const btn = document.querySelector(`#mm-stage .pv-btn[data-id="${id}"]`);
  if (!btn) return null;
  const r = btn.getBoundingClientRect(), s = document.getElementById('mm-stage').getBoundingClientRect();
  const w = r.width / previewScale, h = r.height / previewScale;
  const left = (r.left - s.left) / previewScale, top = (r.top - s.top) / previewScale;
  const round = (v) => Math.round(clamp(v, 0, 1) * 1000) / 1000;
  return {
    xalign: project.width > w ? round(left / (project.width - w)) : 0.5,
    yalign: project.height > h ? round(top / (project.height - h)) : 0.5
  };
}

async function populateMusicList() {
  const sel = document.getElementById('mm-music');
  const files = await window.mmApi.listAudioFiles();
  if (cfg.music.file && !files.includes(cfg.music.file)) files.unshift(cfg.music.file);
  sel.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = t('mm_music_none');
  sel.appendChild(none);
  for (const f of files) {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f.replace(/^audio\//, '');
    sel.appendChild(opt);
  }
  sel.value = cfg.music.file;
}

function updateMusicPlayer() {
  const player = document.getElementById('mm-music-player');
  player.pause();
  if (cfg.music.file) { player.src = getGameFileURL(cfg.music.file); player.style.display = ''; }
  else { player.removeAttribute('src'); player.style.display = 'none'; }
}

// ═══════════════════════════════════════════════════════════
// FILES (backgrounds, GIF frames, fonts)
// ═══════════════════════════════════════════════════════════
async function copyToProject(kind, prefix, accept = null) {
  const src = await window.mmApi.selectMediaFile(kind);
  if (!src || (accept && !await accept(src))) return null;
  const ext = src.split('.').pop().toLowerCase();
  const stamp = Date.now().toString(36);
  const rel = `${MM_DIR}/${prefix}${stamp}.${ext}`;
  if (!await window.mmApi.copyFileToProject(src, rel)) {
    notify(t('mm_file_error'), 'err');
    return null;
  }
  return { rel, stamp, name: baseName(src) };
}

async function pickBackground() {
  const kind = cfg.background.type;
  const copied = await copyToProject(kind, 'bg_');
  if (!copied) return;
  let frames = [];
  if (kind === 'gif') {
    frames = await extractGifFrames(copied.rel, `${MM_DIR}/bg_${copied.stamp}_f`);
    if (!frames) return;
  }
  Object.assign(cfg.background, { file: copied.rel, fileName: copied.name, frames });
  markDirty();
  updateFileLabels();
  renderPreview();
}

// Ren'Py doesn't animate GIFs: decode every frame (already composited) to a PNG
async function extractGifFrames(rel, prefix) {
  let decoder = null;
  try {
    if (typeof ImageDecoder === 'undefined') throw new Error('ImageDecoder');
    const bytes = await window.mmApi.readBinaryFile(rel);
    if (!bytes) throw new Error(t('mm_file_error'));
    decoder = new ImageDecoder({ data: bytes, type: 'image/gif' });
    await decoder.tracks.ready;
    const count = decoder.tracks.selectedTrack.frameCount;
    const frames = [];
    let canvas = null, ctx = null;
    for (let i = 0; i < count; i++) {
      if (i % 5 === 0) notify(t('mm_gif_extracting', i + 1, count), 'ok');
      const { image } = await decoder.decode({ frameIndex: i });
      if (!canvas) {
        canvas = new OffscreenCanvas(image.displayWidth, image.displayHeight);
        ctx = canvas.getContext('2d');
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      // Like browsers, treat very short delays as 0.1 s
      let delay = image.duration ? image.duration / 1e6 : 0;
      if (delay < 0.02) delay = 0.1;
      image.close();
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const file = `${prefix}${String(i).padStart(3, '0')}.png`;
      if (!await window.mmApi.writeBinaryFile(file, new Uint8Array(await blob.arrayBuffer()))) {
        throw new Error(t('mm_file_error'));
      }
      frames.push({ file, delay: Math.round(delay * 1000) / 1000 });
    }
    notify(t('mm_gif_frames', frames.length), 'ok');
    return frames;
  } catch (e) {
    notify(t('mm_gif_error', e.message), 'err');
    return null;
  } finally {
    if (decoder) decoder.close();
  }
}

// ── Fonts: installed on the computer or from a file ──
// Only installed fonts whose license allows distributing them with a game are
// offered (the main process recognizes the license from the font metadata).
// cfg[target].systemFont is the chosen installed font; its file is copied to the
// project (cfg[target].font) when saving, so changing fonts doesn't copy files.
const FONT_TARGETS = ['title', 'buttons'];
let fontFamilies = null;           // free family -> [{ family, style, fullName, postscript, file, index, license }], null while loading
let installedFamilies = new Set(); // every installed family, free or not

async function loadSystemFonts(refresh = false) {
  let fonts = [];
  try { fonts = await window.mmApi.listSystemFonts(refresh); } catch (e) { /* no installed fonts listed */ }
  fontFamilies = new Map();
  installedFamilies = new Set(fonts.map(f => f.family));
  for (const f of fonts) {
    if (!f.license) continue;
    if (!fontFamilies.has(f.family)) fontFamilies.set(f.family, []);
    fontFamilies.get(f.family).push(f);
  }
  renderFontSelectors();
}

// Checked against the current list (the license saved in the config may be outdated);
// a font not installed on this computer keeps the license it was chosen with
function isFreeSystemFont(sys) {
  if (!fontFamilies || !installedFamilies.has(sys.family)) return !!sys.license;
  return !!fontFamilies.get(sys.family)?.some(f => f.style === sys.style);
}

async function refreshSystemFonts() {
  fontFamilies = null;
  renderFontSelectors();
  await loadSystemFonts(true);
  notify(t('mm_fonts_summary', fontFamilies.size, installedFamilies.size), 'ok');
}

function addOption(sel, value, text, fontFamilyCss) {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = text;
  if (fontFamilyCss) opt.style.fontFamily = fontFamilyCss;
  sel.appendChild(opt);
  return opt;
}

function renderFontSelectors() {
  for (const target of FONT_TARGETS) {
    const tf = cfg[target];
    const famSel = document.querySelector(`[data-font-family="${target}"]`);
    const styleSel = document.querySelector(`[data-font-style="${target}"]`);
    const hint = document.querySelector(`[data-font-hint="${target}"]`);
    const sys = tf.systemFont;

    famSel.innerHTML = '';
    addOption(famSel, '', t('mm_font_default'));
    if (tf.font && !sys) addOption(famSel, '__file', '📄 ' + (tf.fontName || baseName(tf.font)));
    if (!fontFamilies) addOption(famSel, '__loading', t('mm_fonts_loading')).disabled = true;
    else {
      // A font chosen before (or on another computer) that can't be offered now
      if (sys && !fontFamilies.has(sys.family)) {
        addOption(famSel, sys.family, `${sys.family} ${t(installedFamilies.has(sys.family) ? 'mm_font_not_free' : 'mm_font_not_installed')}`);
      }
      for (const family of fontFamilies.keys()) addOption(famSel, family, family, `'${family}'`);
      if (!fontFamilies.size) addOption(famSel, '__none', t('mm_fonts_none')).disabled = true;
    }
    famSel.value = sys ? sys.family : (tf.font ? '__file' : '');

    styleSel.innerHTML = '';
    styleSel.style.display = sys ? '' : 'none';
    if (sys) {
      const styles = fontFamilies?.get(sys.family) || [sys];
      for (const f of styles) addOption(styleSel, f.style, f.style);
      styleSel.value = sys.style;
    }

    // License of the chosen font
    let text = '', warn = false;
    if (sys && !isFreeSystemFont(sys)) {
      text = t('mm_font_not_free_warning');
      warn = true;
    } else if (sys) {
      text = sys.license ? t('mm_font_license', sys.license) : '';
    } else if (tf.font) {
      text = tf.fontLicense ? t('mm_font_license', tf.fontLicense) : t('mm_font_file_license_unknown');
      warn = !tf.fontLicense;
    }
    hint.textContent = text;
    hint.classList.toggle('warn', warn);
    hint.style.display = text ? '' : 'none';
  }
  const summary = fontFamilies ? t('mm_fonts_summary', fontFamilies.size, installedFamilies.size) : t('mm_fonts_loading');
  document.querySelectorAll('[data-font-summary]').forEach(el => { el.textContent = summary; });
}

function fontChanged() {
  markDirty();
  renderFontSelectors();
  renderPreview();
}

function setSystemFont(target, font) {
  const { family, style, fullName, postscript, file, index, license } = font;
  Object.assign(cfg[target], {
    systemFont: { family, style, fullName, postscript, file, index, license },
    font: '', fontName: `${family} ${style}`, fontLicense: license
  });
  fontChanged();
}

function bindFontSelectors() {
  for (const target of FONT_TARGETS) {
    document.querySelector(`[data-font-family="${target}"]`).addEventListener('change', (e) => {
      const family = e.target.value;
      if (family === '__file') return;
      if (!family) { clearFont(target); return; }
      const styles = fontFamilies?.get(family);
      if (!styles) return;
      setSystemFont(target, styles.find(f => /^(regular|normal|book|roman)$/i.test(f.style)) || styles[0]);
    });
    document.querySelector(`[data-font-style="${target}"]`).addEventListener('change', (e) => {
      const font = fontFamilies?.get(cfg[target].systemFont?.family)?.find(f => f.style === e.target.value);
      if (font) setSystemFont(target, font);
    });
  }
}

// A font file chosen by hand: its license is checked too, and if it doesn't say
// that it can be distributed the user must confirm they have permission
async function pickFont(target) {
  let license = '';
  const copied = await copyToProject('font', 'font_', async (src) => {
    const fonts = await window.mmApi.readFontFileInfo(src);
    license = fonts.find(f => f.license)?.license || '';
    return !!license || await showConfirm(t('mm_font_file_unverified'), { type: 'warning' });
  });
  if (!copied) return;
  Object.assign(cfg[target], { font: copied.rel, fontName: copied.name, fontLicense: license, systemFont: null });
  fontChanged();
}

function clearFont(target) {
  Object.assign(cfg[target], { font: '', fontName: '', fontLicense: '', systemFont: null });
  fontChanged();
}

// Copy the chosen installed fonts that aren't in the project yet ("index@file" for collections)
async function copyPendingFonts() {
  const copied = {};
  for (const target of FONT_TARGETS) {
    const tf = cfg[target], sys = tf.systemFont;
    if (sys && !isFreeSystemFont(sys)) {
      notify(t('mm_font_not_free_warning'), 'err');
      return false;
    }
    if (!sys || tf.font) continue;
    if (!copied[sys.file]) {
      const ext = sys.file.split('.').pop().toLowerCase();
      const rel = `${MM_DIR}/font_${Date.now().toString(36)}_${target}.${ext}`;
      if (!await window.mmApi.copyFileToProject(sys.file, rel)) {
        notify(t('mm_file_error'), 'err');
        return false;
      }
      copied[sys.file] = rel;
    }
    tf.font = (sys.index >= 0 ? `${sys.index}@` : '') + copied[sys.file];
  }
  return true;
}

// Files of MM_DIR used by the current config (the rest are deleted on save)
function referencedFiles() {
  const files = [cfg.title.font, cfg.buttons.font];
  files.push(cfg.buttons.bgImg.image, cfg.buttons.bgImg.hoverImage);
  for (const it of cfg.buttons.items) files.push(it.image, it.hoverImage, it.bg.image, it.bg.hoverImage);
  const bg = cfg.background;
  if (['image', 'gif', 'video'].includes(bg.type) && bg.file) {
    files.push(bg.file);
    if (bg.type === 'gif') files.push(...bg.frames.map(f => f.file));
  }
  return files.filter(Boolean).map(baseName);
}

// ═══════════════════════════════════════════════════════════
// PREVIEW
// ═══════════════════════════════════════════════════════════
const loadedFonts = {};   // font key -> CSS family ('' while loading or if it failed)

// CSS font-family for the preview of cfg.title / cfg.buttons
function fontFamily(tf) {
  const fallback = "'DejaVu Sans', Verdana, sans-serif";
  const sys = tf.systemFont;
  if (!sys && !tf.font) return fallback;
  // Installed font: loaded by name (the exact style, also inside .ttc collections)
  const cssQuote = (s) => s.replace(/["\\]/g, '\\$&');
  const key = sys ? `sys:${sys.family}|${sys.style}` : tf.font;
  const failed = sys ? `'${cssQuote(sys.family)}', ${fallback}` : fallback;
  if (key in loadedFonts) return loadedFonts[key] ? `'${loadedFonts[key]}', ${fallback}` : failed;
  loadedFonts[key] = '';
  const family = 'mm-font-' + Object.keys(loadedFonts).length;
  const source = sys
    ? [sys.postscript, sys.fullName].filter(Boolean).map(n => `local("${cssQuote(n)}")`)
      .concat(`url("${fileURL(sys.file)}")`)
      .concat(tf.font ? [`url("${getGameFileURL(tf.font.replace(/^\d+@/, ''))}")`] : []).join(', ')
    : `url("${getGameFileURL(tf.font.replace(/^\d+@/, ''))}")`;
  new FontFace(family, source).load().then(face => {
    document.fonts.add(face);
    loadedFonts[key] = family;
    renderPreview();
  }).catch(() => { /* keep fallback */ });
  return failed;
}

// Ren'Py's default font (DejaVu Sans) comes with the SDK: use it in the preview
function loadRenpyDefaultFont(renpyExe) {
  if (!renpyExe) return;
  const sdk = renpyExe.replace(/[\\/][^\\/]*$/, '');
  new FontFace('DejaVu Sans', `url("${fileURL(sdk + '/renpy/common/DejaVuSans.ttf')}")`).load().then(face => {
    document.fonts.add(face);
    renderPreview();
  }).catch(() => { /* keep the fallback fonts */ });
}

function rgba(hex, opacity) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${opacity / 100})`;
}

// Ren'Py outlines grow the glyphs outwards: emulate them with shadows around the text
function outlineShadow(size, color) {
  if (!size) return '';
  const n = Math.max(16, size * 6);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    return `${(Math.cos(a) * size).toFixed(2)}px ${(Math.sin(a) * size).toFixed(2)}px 0 ${color}`;
  }).join(', ');
}

function applyTextStyle(el, fontTarget, size, color, outlineSize, outlineColor) {
  el.style.fontFamily = fontFamily(fontTarget);
  el.style.fontSize = size + 'px';
  if (color) el.style.color = color;
  el.style.textShadow = outlineShadow(outlineSize, outlineColor);
}

// Same placement as Ren'Py's xalign/yalign: the anchor is at the same fraction
function placeAligned(el, xalign, yalign) {
  el.style.left = xalign * 100 + '%';
  el.style.top = yalign * 100 + '%';
  el.style.transform = `translate(${-xalign * 100}%, ${-yalign * 100}%)`;
}

let bgKey = '';
function renderBackground() {
  const bg = cfg.background;
  const box = document.getElementById('pv-bg');
  let file = '';
  if (bg.type === 'default') file = project.background;
  else if (['image', 'gif', 'video'].includes(bg.type) && bg.file && fileKind(bg.file) === bg.type) file = bg.file;

  const key = bg.type + '|' + file;
  if (key !== bgKey) {
    bgKey = key;
    box.innerHTML = '';
    if (file) {
      const media = document.createElement(bg.type === 'video' ? 'video' : 'img');
      media.src = getGameFileURL(file);
      if (bg.type === 'video') Object.assign(media, { autoplay: true, loop: true, muted: true });
      media.onerror = () => { media.style.visibility = 'hidden'; };
      box.appendChild(media);
    }
  }
  const media = box.firstChild;
  if (media) media.style.objectFit = bg.type === 'default' ? 'fill' : bg.type === 'video' ? 'contain' : bg.fit;
  box.style.background = bg.type === 'color' ? bg.color : '#000';
}

function renderPreview() {
  if (!cfg) return;
  const stage = document.getElementById('mm-stage');
  stage.style.width = project.width + 'px';
  stage.style.height = project.height + 'px';
  stage.classList.toggle('disabled', !cfg.enabled);

  renderBackground();

  const side = document.getElementById('pv-side-panel');
  side.style.display = cfg.overlay.sidePanel && project.sidePanel ? '' : 'none';
  side.style.width = scaleSize(280) + 'px';
  if (project.sidePanel) side.style.backgroundImage = `url("${getGameFileURL(project.sidePanel)}")`;

  document.getElementById('pv-overlay').style.background = rgba(cfg.overlay.color, cfg.overlay.opacity);

  // Title
  const ti = cfg.title;
  const titleBox = document.getElementById('pv-title');
  titleBox.style.display = ti.show ? '' : 'none';
  placeAligned(titleBox, ti.xalign, ti.yalign);
  const titleText = document.getElementById('pv-title-text');
  titleText.textContent = ti.text || project.name || "Ren'Py";
  applyTextStyle(titleText, ti, ti.size, ti.color, ti.outlineSize, ti.outlineColor);
  const version = document.getElementById('pv-version');
  version.style.display = ti.showVersion ? '' : 'none';
  version.textContent = project.version || '1.0';
  applyTextStyle(version, ti, ti.versionSize, ti.versionColor, ti.outlineSize, ti.outlineColor);
  // Inside the vbox each text uses the same xalign as the title
  for (const el of [titleText, version]) {
    el.style.left = ti.xalign * 100 + '%';
    el.style.transform = `translateX(${-ti.xalign * 100}%)`;
    el.style.textAlign = ti.xalign < 0.34 ? 'left' : ti.xalign > 0.66 ? 'right' : 'center';
  }

  // Buttons
  const b = cfg.buttons;
  const box = document.getElementById('pv-buttons');
  placeAligned(box, b.xalign, b.yalign);
  const vertical = b.layout === 'vertical';
  const align = { left: 'flex-start', center: 'center', right: 'flex-end' }[b.textAlign];
  box.style.flexDirection = vertical ? 'column' : 'row';
  box.style.alignItems = vertical ? align : 'center';
  box.style.gap = b.spacing + 'px';
  stage.style.setProperty('--pv-idle', b.idleColor);
  stage.style.setProperty('--pv-hover', b.hoverColor);
  stage.style.setProperty('--pv-bg', b.bgEnabled ? rgba(b.bgColor, b.bgOpacity) : 'transparent');
  stage.style.setProperty('--pv-bg-hover', b.bgEnabled ? rgba(b.bgHoverColor, b.bgOpacity) : 'transparent');
  box.innerHTML = '';
  stage.querySelectorAll('.pv-free-btn').forEach(el => el.remove());
  let boxed = 0;
  for (const it of b.items) {
    if (!it.show) continue;
    const btn = buildPreviewButton(it, b, vertical);
    if (it.free) {
      // Its own position: placed on the screen, out of the group
      btn.classList.add('pv-draggable', 'pv-free-btn');
      btn.dataset.drag = 'btn:' + it.id;
      placeAligned(btn, it.xalign, it.yalign);
      stage.insertBefore(btn, document.getElementById('pv-disabled'));
    } else {
      box.appendChild(btn);
      boxed++;
    }
  }
  box.style.display = boxed ? '' : 'none';
}

const imageSizes = {};   // relative path -> { w, h } (null while loading)
function imageSize(rel) {
  if (rel in imageSizes) return imageSizes[rel];
  imageSizes[rel] = null;
  const img = new Image();
  img.onload = () => { imageSizes[rel] = { w: img.naturalWidth, h: img.naturalHeight }; renderPreview(); };
  img.src = getGameFileURL(rel);
  return null;
}

function buildPreviewButton(it, b, vertical) {
  const btn = document.createElement('div');
  btn.className = 'pv-btn';
  btn.dataset.id = it.id;
  if (it.kind === 'image' && it.image) {
    // Without a hover image, the normal one is brightened (like BrightnessMatrix in Ren'Py)
    btn.classList.add('pv-img-btn');
    if (!it.hoverImage) btn.classList.add('pv-img-glow');
    for (const [cls, rel] of [['pv-img-idle', it.image], ['pv-img-hover', it.hoverImage]]) {
      if (!rel) continue;
      const img = document.createElement('img');
      img.className = cls;
      img.draggable = false;
      img.src = getGameFileURL(rel);
      const size = imageSize(rel);
      if (size) img.style.width = size.w * it.zoom / 100 + 'px';
      btn.appendChild(img);
    }
    return btn;
  }
  btn.textContent = it.text || MENU_BUTTONS[it.id].text;
  applyTextStyle(btn, b, b.size, null, b.outlineSize, b.outlineColor);
  btn.style.padding = b.bgEnabled ? `${b.padding}px ${buttonXPadding()}px` : '0';
  btn.style.minWidth = b.bgEnabled && b.minWidth ? b.minWidth + 'px' : '';
  btn.style.textAlign = vertical && !it.free ? b.textAlign : 'center';
  const bg = buttonBgImage(it, b);
  if (bg) applyBgImage(btn, bg, b, it.free);
  return btn;
}

// Background image of a text button: its own one or the one of all the buttons
function buttonBgImage(it, b) {
  if (it.kind === 'textbg' && it.bg.image) return it.bg;
  if (b.bgEnabled && b.bgKind === 'image' && b.bgImg.image) return b.bgImg;
  return null;
}

// Drawn in ::before (see main-menu.css) so the hover glow doesn't brighten the text
function applyBgImage(btn, bg, b, free) {
  btn.classList.add('pv-bgimg');
  if (!bg.hoverImage) btn.classList.add('pv-bgimg-glow');
  if (!free) btn.style.position = 'relative';
  btn.style.background = 'transparent';
  btn.style.setProperty('--img', `url("${getGameFileURL(bg.image)}")`);
  if (bg.hoverImage) btn.style.setProperty('--img-hover', `url("${getGameFileURL(bg.hoverImage)}")`);
  const border = bg.fit === 'stretch' ? Math.round(bg.border) : 0;
  btn.style.setProperty('--b', border + 'px');
  btn.style.setProperty('--bs', String(border));
  if (bg.fit === 'image') {
    // The button has the size of the image and the text goes centered on it
    const size = imageSize(bg.image);
    Object.assign(btn.style, { padding: '0', minWidth: '', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' });
    if (size) {
      btn.style.width = size.w * bg.zoom / 100 + 'px';
      btn.style.height = size.h * bg.zoom / 100 + 'px';
    }
  } else {
    btn.style.padding = `${b.padding}px ${buttonXPadding()}px`;
    btn.style.minWidth = b.minWidth ? b.minWidth + 'px' : '';
  }
}

function loadImageSize(rel) {
  return new Promise((resolve) => {
    if (imageSizes[rel]) { resolve(imageSizes[rel]); return; }
    const img = new Image();
    img.onload = () => { imageSizes[rel] = { w: img.naturalWidth, h: img.naturalHeight }; resolve(imageSizes[rel]); };
    img.onerror = () => resolve(null);
    img.src = getGameFileURL(rel);
  });
}

// The code needs the size of the background images used with their own size
async function ensureImageSizes() {
  const bgs = [cfg.buttons.bgImg, ...cfg.buttons.items.map(it => it.bg)];
  await Promise.all(bgs.filter(bg => bg.image && bg.fit === 'image').map(bg => loadImageSize(bg.image)));
}

const buttonXPadding = () => Math.round(cfg.buttons.padding * 1.5);

function fitStage() {
  const wrap = document.getElementById('mm-stage-wrap');
  const stage = document.getElementById('mm-stage');
  const s = Math.min(wrap.clientWidth / project.width, wrap.clientHeight / project.height);
  previewScale = s > 0 ? s : 1;
  const ox = (wrap.clientWidth - project.width * previewScale) / 2;
  const oy = (wrap.clientHeight - project.height * previewScale) / 2;
  stage.style.transform = `translate(${ox}px, ${oy}px) scale(${previewScale})`;
}

// Drag the title or the buttons inside the preview to change their position
function setupDragging() {
  const stage = document.getElementById('mm-stage');
  stage.addEventListener('mousedown', (e) => {
    const el = e.target.closest('.pv-draggable');
    if (!el || e.button !== 0) return;
    e.preventDefault();
    const key = el.dataset.drag;
    const target = key.startsWith('btn:') ? cfg.buttons.items.find(it => it.id === key.slice(4)) : cfg[key];
    const w = el.offsetWidth, h = el.offsetHeight;
    const freeW = project.width - w, freeH = project.height - h;
    const startLeft = target.xalign * freeW, startTop = target.yalign * freeH;
    const startX = e.clientX, startY = e.clientY;
    el.classList.add('dragging');

    const onMove = (ev) => {
      const left = startLeft + (ev.clientX - startX) / previewScale;
      const top = startTop + (ev.clientY - startY) / previewScale;
      target.xalign = freeW > 0 ? Math.round(clamp(left / freeW, 0, 1) * 1000) / 1000 : 0.5;
      target.yalign = freeH > 0 ? Math.round(clamp(top / freeH, 0, 1) * 1000) / 1000 : 0.5;
      markDirty();
      syncControls();
      renderPreview();
    };
    const onUp = () => {
      el.classList.remove('dragging');
      if (key.startsWith('btn:')) renderButtonList();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}

// ═══════════════════════════════════════════════════════════
// REN'PY CODE
// ═══════════════════════════════════════════════════════════
// String shown as text: escape quotes and Ren'Py's [interpolation] and {text tags}
function rpyText(s) {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
    .replace(/\[/g, '[[').replace(/\{/g, '{{') + '"';
}
// String used as a file path
function rpyPath(s) {
  return '"' + s.replace(/\\/g, '/').replace(/"/g, '\\"') + '"';
}
function rpyColor(hex, opacity = 100) {
  const alpha = opacity < 100 ? Math.round(opacity * 2.55).toString(16).padStart(2, '0') : '';
  return `"${hex}${alpha}"`;
}
const rpyNum = (n) => String(Math.round(n * 1000) / 1000);

function textStyleLines(font, size, outlineSize, outlineColor) {
  const lines = [];
  if (font) lines.push(`    font ${rpyPath(font)}`);
  lines.push(`    size ${Math.round(size)}`);
  if (outlineSize > 0) lines.push(`    outlines [ (${Math.round(outlineSize)}, ${rpyColor(outlineColor)}, 0, 0) ]`);
  return lines;
}

// Lines of a button (indented from the button itself)
function buttonLines(it, b, textAlign) {
  const def = MENU_BUTTONS[it.id];
  const label = `_(${it.text ? rpyText(it.text) : `"${def.text}"`})`;
  const position = it.free ? [`    xalign ${rpyNum(it.xalign)}`, `    yalign ${rpyNum(it.yalign)}`] : [];

  if (it.kind === 'image' && it.image) {
    const zoom = it.zoom !== 100 ? `, zoom=${rpyNum(it.zoom / 100)}` : '';
    const img = (rel, extra = '') => (zoom || extra) ? `Transform(${rpyPath(rel)}${zoom}${extra})` : rpyPath(rel);
    const lines = [
      'imagebutton:',
      `    idle ${img(it.image)}`,
      // Without a hover image, the normal one is brightened
      `    hover ${it.hoverImage ? img(it.hoverImage) : img(it.image, ', matrixcolor=BrightnessMatrix(0.2)')}`,
      `    alt ${label}`
    ];
    if (!it.free) lines.push(b.layout === 'vertical' ? `    xalign ${textAlign}` : '    yalign 0.5');
    return [...lines, ...position, `    action ${def.action}`];
  }
  // Its own background image: inline properties, over the style of all the buttons
  const bgLines = (it.kind === 'textbg' && it.bg.image) ? bgImageLines(it.bg, b) : [];
  if (bgLines.length && it.bg.fit === 'image') bgLines.push('text_xalign 0.5');
  if (!it.free && !bgLines.length) return [`textbutton ${label} action ${def.action}`];
  const lines = [`textbutton ${label}:`];
  if (it.free) lines.push('    style "editor_mm_button"', '    text_style "editor_mm_button_text"');
  return [...lines, ...bgLines.map(l => '    ' + l), ...position, `    action ${def.action}`];
}

// Style properties of a button with a background image (Frame stretches it to the button)
function bgImageLines(bg, b) {
  const border = bg.fit === 'stretch' ? Math.round(bg.border) : 0;
  const frame = (d) => `Frame(${d}, ${border}, ${border})`;
  const hover = bg.hoverImage ? rpyPath(bg.hoverImage) : `Transform(${rpyPath(bg.image)}, matrixcolor=BrightnessMatrix(0.2))`;
  const lines = [`background ${frame(rpyPath(bg.image))}`, `hover_background ${frame(hover)}`];
  if (bg.fit === 'image') {
    lines.push('padding (0, 0)');
    const size = imageSizes[bg.image];
    if (size) lines.push(`xysize (${Math.round(size.w * bg.zoom / 100)}, ${Math.round(size.h * bg.zoom / 100)})`);
  } else {
    lines.push(`padding (${buttonXPadding()}, ${Math.round(b.padding)})`);
    if (b.minWidth > 0) lines.push(`xminimum ${Math.round(b.minWidth)}`);
  }
  return lines;
}

function generateCode() {
  const out = [
    CONFIG_MARKER + JSON.stringify(cfg),
    '##',
    '## Main menu generated by Ren\'Py EDITOR. Edit it from the "Main menu" window:',
    '## manual changes to this file will be overwritten.',
    ''
  ];
  if (!cfg.enabled) {
    out.push('## The custom main menu is disabled: the game uses the one in screens.rpy.', '');
    return out.join('\n');
  }

  // Defined after screens.rpy (init offset 0), so this main_menu replaces the original one
  out.push('init offset = 1', '');

  if (cfg.music.file) out.push(`define config.main_menu_music = ${rpyPath(cfg.music.file)}`, '');

  const bg = cfg.background;
  const hasFile = bg.file && fileKind(bg.file) === bg.type;
  if (bg.type === 'gif' && hasFile && bg.frames.length) {
    out.push(`image ${GIF_IMAGE_NAME}:`);
    for (const f of bg.frames) out.push(`    ${rpyPath(f.file)}`, `    pause ${rpyNum(f.delay)}`);
    out.push('    repeat', '');
  }

  out.push('screen main_menu():', '', '    tag menu', '');

  const screenSize = '(config.screen_width, config.screen_height)';
  if (bg.type === 'color') out.push(`    add Solid(${rpyColor(bg.color)})`);
  else if (bg.type === 'video' && hasFile) out.push(`    add Movie(play=${rpyPath(bg.file)}, size=${screenSize}, loop=True)`);
  else if (bg.type === 'image' && hasFile) out.push(`    add ${rpyPath(bg.file)} xysize ${screenSize} fit "${bg.fit}" align (0.5, 0.5)`);
  else if (bg.type === 'gif' && hasFile && bg.frames.length) out.push(`    add "${GIF_IMAGE_NAME}" xysize ${screenSize} fit "${bg.fit}" align (0.5, 0.5)`);
  else out.push('    add gui.main_menu_background');

  if (cfg.overlay.opacity > 0) out.push(`    add Solid(${rpyColor(cfg.overlay.color, cfg.overlay.opacity)})`);
  if (cfg.overlay.sidePanel) out.push('', '    frame:', '        style "main_menu_frame"');

  const ti = cfg.title;
  if (ti.show) {
    out.push('', '    vbox:', `        xalign ${rpyNum(ti.xalign)}`, `        yalign ${rpyNum(ti.yalign)}`, '');
    out.push(`        text ${ti.text ? rpyText(ti.text) : '"[config.name!t]"'}:`, '            style "editor_mm_title"');
    if (ti.showVersion) out.push('', '        text "[config.version]":', '            style "editor_mm_version"');
  }

  const b = cfg.buttons;
  const textAlign = b.layout === 'vertical' ? { left: 0.0, center: 0.5, right: 1.0 }[b.textAlign] : 0.5;
  const emit = (it, indent) => {
    const lines = buttonLines(it, b, textAlign);
    const condition = MENU_BUTTONS[it.id].condition;
    if (condition) {
      out.push(`${indent}if ${condition}:`);
      indent += '    ';
    }
    for (const line of lines) out.push(indent + line);
  };
  const shown = b.items.filter(it => it.show);
  if (shown.some(it => !it.free)) {
    out.push('', `    ${b.layout === 'vertical' ? 'vbox' : 'hbox'}:`, '        style_prefix "editor_mm"',
      `        xalign ${rpyNum(b.xalign)}`, `        yalign ${rpyNum(b.yalign)}`, `        spacing ${Math.round(b.spacing)}`, '');
    for (const it of shown) if (!it.free) emit(it, '        ');
  }
  // Buttons with their own position, out of the group
  const free = shown.filter(it => it.free);
  if (free.length) {
    out.push('');
    for (const it of free) emit(it, '    ');
  }

  // Styles
  const titleAlign = rpyNum(ti.xalign);
  out.push('', '');
  out.push('style editor_mm_title is default:', ...textStyleLines(ti.font, ti.size, ti.outlineSize, ti.outlineColor),
    `    color ${rpyColor(ti.color)}`, `    xalign ${titleAlign}`, `    text_align ${titleAlign}`, '');
  out.push('style editor_mm_version is default:', ...textStyleLines(ti.font, ti.versionSize, ti.outlineSize, ti.outlineColor),
    `    color ${rpyColor(ti.versionColor)}`, `    xalign ${titleAlign}`, `    text_align ${titleAlign}`, '');

  const textAlignText = (b.bgEnabled && b.bgKind === 'image' && b.bgImg.image && b.bgImg.fit === 'image') ? 0.5 : textAlign;
  out.push('style editor_mm_button is button:', `    xalign ${textAlign}`);
  if (b.layout === 'horizontal') out.push('    yalign 0.5');
  const globalBg = (b.bgEnabled && b.bgKind === 'image' && b.bgImg.image) ? b.bgImg : null;
  if (globalBg) {
    out.push(...bgImageLines(globalBg, b).map(l => '    ' + l));
  } else if (b.bgEnabled) {
    out.push(`    background Solid(${rpyColor(b.bgColor, b.bgOpacity)})`,
      `    hover_background Solid(${rpyColor(b.bgHoverColor, b.bgOpacity)})`,
      `    padding (${buttonXPadding()}, ${Math.round(b.padding)})`);
    if (b.minWidth > 0) out.push(`    xminimum ${Math.round(b.minWidth)}`);
  } else {
    out.push('    background None', '    padding (0, 0)');
  }
  out.push('');
  out.push('style editor_mm_button_text is button_text:', ...textStyleLines(b.font, b.size, b.outlineSize, b.outlineColor),
    `    color ${rpyColor(b.idleColor)}`, `    hover_color ${rpyColor(b.hoverColor)}`,
    `    xalign ${textAlignText}`, `    text_align ${textAlignText}`, '');

  return out.join('\n');
}

// ═══════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════
async function saveConfig() {
  if (!gamePath) { notify(t('mm_no_project'), 'err'); return false; }
  if (!await copyPendingFonts()) return false;
  await ensureImageSizes();
  if (!await window.mmApi.writeFile(MM_FILE, generateCode())) {
    notify(t('mm_save_error'), 'err');
    return false;
  }
  const keep = referencedFiles();
  await window.mmApi.removeProjectFiles(MM_DIR, 'bg_', keep);
  await window.mmApi.removeProjectFiles(MM_DIR, 'font_', keep);
  await window.mmApi.removeProjectFiles(MM_DIR, 'btn_', keep);
  markDirty(false);
  notify(t('mm_saved', MM_FILE), 'ok');
  return true;
}

async function saveAndTest() {
  if (!await saveConfig()) return;
  notify(t('mm_testing'), 'ok');
  const res = await window.mmApi.launchRenpyProject();
  if (!res?.ok && res?.error !== 'cancelled') notify(t('launch_failed') + (res?.message ? `: ${res.message}` : ''), 'err');
}

async function resetConfig() {
  if (!await showConfirm(t('mm_reset_confirm'), { type: 'warning' })) return;
  cfg = defaultConfig();
  markDirty();
  refreshAll();
}

function refreshAll() {
  syncControls();
  updateFileLabels();
  renderFontSelectors();
  renderGlobalBgImage();
  renderButtonList();
  updateMusicPlayer();
  renderPreview();
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
(async function init() {
  const s = await window.mmApi.getSettings();
  applyTheme(s);
  await loadI18n(s.language || 'es');
  loadRenpyDefaultFont(s.renpyExecutablePath);

  gamePath = await window.mmApi.getGamePath();
  if (gamePath) await loadProjectInfo();
  await loadConfig();
  applyI18n();

  bindControls();
  bindFontSelectors();
  setupDragging();
  if (gamePath) await populateMusicList();
  refreshAll();

  new ResizeObserver(fitStage).observe(document.getElementById('mm-stage-wrap'));
  fitStage();
  if (!gamePath) notify(t('mm_no_project'), 'err');
  loadSystemFonts();

  window.mmApi.onSettingsChanged(async (ns) => {
    applyTheme(ns);
    if (ns.language) {
      await loadI18n(ns.language);
      applyI18n();
      await populateMusicList();
      refreshAll();
    }
  });
})();
