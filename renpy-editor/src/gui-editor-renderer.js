// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Game interface (GUI) editor window
// Edits the values of gui.rpy (and the text speed of options.rpy)
// and the images of the textbox, namebox, choice buttons and game
// menu, which can be the current ones, an image of the user's or
// one drawn by the editor from a color and rounded corners.
// ═══════════════════════════════════════════════════════════

const GUI_FILE = 'gui.rpy';
const OPTIONS_FILE = 'options.rpy';
const STATE_MARKER = '## renpy-editor:gui ';
const BACKUP_DIR = 'gui/editor_backup/';
const DEFAULT_FONT = 'DejaVuSans.ttf';

// Images each part uses in the project (relative to game/)
const IMAGE_FILES = {
  textbox: ['gui/textbox.png'],
  namebox: ['gui/namebox.png'],
  choice: ['gui/button/choice_idle_background.png', 'gui/button/choice_hover_background.png'],
  gamemenu: ['gui/game_menu.png']
};

// gui.rpy define of each value of the state
const DEFINES = {
  'fonts.text': 'gui.text_font', 'fonts.name': 'gui.name_text_font', 'fonts.interface': 'gui.interface_text_font',
  'sizes.text': 'gui.text_size', 'sizes.name': 'gui.name_text_size', 'sizes.interface': 'gui.interface_text_size',
  'colors.text': 'gui.text_color', 'colors.interface': 'gui.interface_text_color', 'colors.accent': 'gui.accent_color',
  'colors.idle': 'gui.idle_color', 'colors.hover': 'gui.hover_color', 'colors.selected': 'gui.selected_color',
  'textbox.height': 'gui.textbox_height',
  'name.xpos': 'gui.name_xpos', 'name.ypos': 'gui.name_ypos', 'name.xalign': 'gui.name_xalign',
  'dialogue.xpos': 'gui.dialogue_xpos', 'dialogue.ypos': 'gui.dialogue_ypos',
  'dialogue.width': 'gui.dialogue_width', 'dialogue.xalign': 'gui.dialogue_text_xalign',
  'choice.width': 'gui.choice_button_width', 'choice.textSize': 'gui.choice_button_text_size',
  'choice.idleColor': 'gui.choice_button_text_idle_color', 'choice.hoverColor': 'gui.choice_button_text_hover_color',
  'choice.spacing': 'gui.choice_spacing'
};

let gamePath = '';
let translations = {};
let state = null;        // current values
let loaded = null;       // values as read from the files, to write only what changed
let guiText = '';
let projectFonts = [];
let backgrounds = [];    // { key, path } for the preview background
let previewMode = 'dialogue';
let previewScale = 1;
let dirty = false;
const project = { width: 1920, height: 1080 };

// ── I18N, notifications, URLs ──

async function loadI18n(lang) {
  try {
    translations = JSON.parse(await window.guiApi.readI18n(lang));
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
    const key = el.getAttribute('data-i18n');
    if (translations[key]) el.textContent = t(key);
  });
  document.title = "Ren'Py EDITOR — " + t('gui_editor_title');
}
function notify(msg, type = 'ok') {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.className = 'notification show ' + type;
  clearTimeout(n._timer);
  n._timer = setTimeout(() => n.classList.remove('show'), 2600);
}
function fileURL(absPath) {
  const parts = absPath.replace(/\\/g, '/').replace(/^\/+/, '').split('/');
  // Quotes are encoded too: the URL goes inside url('…') in style attributes
  return 'file:///' + parts.map((s, i) => (i === 0 && /^[a-zA-Z]:$/.test(s)) ? s : encodeURIComponent(s).replace(/'/g, '%27')).join('/');
}
function getGameFileURL(rel) {
  return gamePath && rel ? fileURL(gamePath + '/' + rel) : '';
}
const escHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const baseName = (p) => (p || '').split(/[\\/]/).pop();

// ── Reading gui.rpy ──

// Value of a define up to an end-of-line comment ("#" inside quotes is part of the value)
function defineRe(name) {
  const value = `((?:"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|[^#'"\\n])*?)`;
  return new RegExp(`^([ \\t]*define[ \\t]+${name.replace(/\./g, '\\.')}[ \\t]*=[ \\t]*)${value}[ \\t]*(#.*)?$`, 'm');
}

// Raw expression of a define, or null
function readDefineRaw(text, name) {
  const m = defineRe(name).exec(text);
  return m ? m[2].trim() : null;
}

// Value of a define: strings unquoted, numbers parsed; "gui.x" references resolved
function readDefineValue(text, name, seen = new Set()) {
  const raw = readDefineRaw(text, name);
  if (raw === null || seen.has(name)) return null;
  const str = /^(?:_\(\s*)?(["'])(.*)\1\s*\)?$/.exec(raw);
  if (str) return str[2];
  if (/^-?\d+(\.\d+)?$/.test(raw)) return parseFloat(raw);
  if (/^gui\.\w+$/.test(raw)) return readDefineValue(text, raw, new Set([...seen, name]));
  return null;
}

// Colors as #rrggbb for the color inputs (alpha is dropped)
function hex6(v, fallback) {
  if (typeof v !== 'string') return fallback;
  let h = v.trim();
  if (/^#[0-9a-f]{3,4}$/i.test(h)) h = '#' + h.slice(1, 4).split('').map(c => c + c).join('');
  return /^#[0-9a-f]{6}/i.test(h) ? h.slice(0, 7).toLowerCase() : fallback;
}

function getPath(obj, path) { return path.split('.').reduce((o, k) => o?.[k], obj); }
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => (o[k] = o[k] || {}), obj)[last] = value;
}

function defaultImageState(part) {
  return {
    source: 'keep', files: [], color: part === 'gamemenu' ? '#20242a' : '#000000', hoverColor: '#3a3f47',
    opacity: part === 'gamemenu' ? 100 : 75, radius: part === 'textbox' ? 0 : 12, margin: 0
  };
}

async function loadState() {
  guiText = await window.guiApi.readFile(GUI_FILE) || '';
  const options = await window.guiApi.readFile(OPTIONS_FILE) || '';
  const size = /gui\.init\(\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(guiText);
  if (size) { project.width = +size[1]; project.height = +size[2]; }
  const u = project.height / 1080;
  const num = (name, def) => { const v = readDefineValue(guiText, name); return typeof v === 'number' ? v : Math.round(def * u); };
  const str = (name, def) => { const v = readDefineValue(guiText, name); return typeof v === 'string' ? v : def; };
  const cps = /^\s*default\s+preferences\.text_cps\s*=\s*(\d+)/m.exec(options);

  state = {
    fonts: { text: str('gui.text_font', DEFAULT_FONT), name: str('gui.name_text_font', DEFAULT_FONT), interface: str('gui.interface_text_font', DEFAULT_FONT) },
    sizes: { text: num('gui.text_size', 33), name: num('gui.name_text_size', 45), interface: num('gui.interface_text_size', 33) },
    colors: {
      text: hex6(str('gui.text_color'), '#ffffff'), interface: hex6(str('gui.interface_text_color'), '#ffffff'),
      accent: hex6(str('gui.accent_color'), '#cc6600'), idle: hex6(str('gui.idle_color'), '#888888'),
      hover: hex6(str('gui.hover_color'), '#cc6600'), selected: hex6(str('gui.selected_color'), '#ffffff')
    },
    cps: cps ? +cps[1] : 0,
    textbox: { height: num('gui.textbox_height', 278) },
    name: { xpos: num('gui.name_xpos', 360), ypos: num('gui.name_ypos', 0), xalign: num('gui.name_xalign', 0) },
    dialogue: { xpos: num('gui.dialogue_xpos', 402), ypos: num('gui.dialogue_ypos', 75), width: num('gui.dialogue_width', 1116), xalign: num('gui.dialogue_text_xalign', 0) },
    choice: {
      width: num('gui.choice_button_width', 1185), textSize: num('gui.choice_button_text_size', 33), spacing: num('gui.choice_spacing', 33),
      idleColor: hex6(str('gui.choice_button_text_idle_color'), '#cccccc'), hoverColor: hex6(str('gui.choice_button_text_hover_color'), '#ffffff')
    },
    images: { textbox: defaultImageState('textbox'), namebox: defaultImageState('namebox'), choice: defaultImageState('choice'), gamemenu: defaultImageState('gamemenu') }
  };
  // Settings of the drawn images, saved by the editor in a comment of gui.rpy
  const marker = guiText.split('\n').find(l => l.startsWith(STATE_MARKER));
  if (marker) {
    try {
      const saved = JSON.parse(marker.slice(STATE_MARKER.length));
      for (const part of Object.keys(state.images)) Object.assign(state.images[part], saved.images?.[part] || {});
    } catch (e) { /* ignore a damaged marker */ }
  }
  for (const part of Object.keys(state.images)) {
    // Files picked in another session are already in the project: they are the current images now
    if (state.images[part].source === 'image') state.images[part].source = 'keep';
    state.images[part].files = [];
  }
  loaded = JSON.parse(JSON.stringify(state));
}

async function loadProjectLists() {
  projectFonts = await window.guiApi.listProjectFonts();
  backgrounds = [];
  for (const file of ['backgrounds.rpy', 'scenes.rpy']) {
    const text = await window.guiApi.readFile(file) || '';
    for (const m of text.matchAll(/^image\s+(\w+)\s*=\s*"([^"]+)"/gm)) backgrounds.push({ key: m[1], path: 'images/' + m[2] });
  }
  const sel = document.getElementById('ge-bg');
  sel.innerHTML = `<option value="">${escHtml(t('gui_preview_plain'))}</option>` +
    backgrounds.map((b, i) => `<option value="${i}">${escHtml(b.key)}</option>`).join('');
  if (backgrounds.length) sel.value = '0';
}

// ── Controls ──

function markDirty(value = true) {
  dirty = value;
  document.getElementById('ge-dirty').classList.toggle('show', value);
  document.getElementById('ge-discard').disabled = !value;
}

// Cancel: back to what is saved in the project
async function discardChanges() {
  if (!dirty) return;
  if (!await showConfirm(t('discard_confirm'), { danger: true, okText: t('discard_changes') })) return;
  await loadState();
  loadStamp = Date.now();
  markDirty(false);
  syncControls();
  applyTabFilter();
  renderPreview();
  notify(t('changes_discarded'), 'ok');
}

function rangeMax(input) {
  const m = input.dataset.max;
  if (m === 'w') return project.width;
  if (m === 'h/2') return Math.round(project.height / 2);
  if (m === 'textbox') return state.textbox.height;
  return +input.max || 100;
}

function syncControls() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const v = getPath(state, el.dataset.key);
    if (el.type === 'range') {
      el.max = rangeMax(el);
      el.value = v;
      const out = el.parentElement.querySelector('output');
      if (out) out.textContent = el.dataset.key === 'cps' && !v ? t('gui_cps_instant') : v;
    } else if (el.tagName === 'SELECT') {
      el.value = String(v);
    } else {
      el.value = v;
    }
  });
  renderFontSelectors();
  document.querySelectorAll('[data-image]').forEach(el => renderImageControl(el.dataset.image));
}

function bindControls() {
  document.querySelectorAll('[data-key]').forEach(el => {
    el.addEventListener('input', () => {
      const v = el.type === 'range' || 'num' in el.dataset ? Number(el.value) : el.value;
      setPath(state, el.dataset.key, v);
      if (el.type === 'range') {
        const out = el.parentElement.querySelector('output');
        if (out) out.textContent = el.dataset.key === 'cps' && !v ? t('gui_cps_instant') : v;
      }
      // The ranges that depend on the textbox height follow it
      if (el.dataset.key === 'textbox.height') document.querySelectorAll('[data-max="textbox"]').forEach(r => { r.max = rangeMax(r); });
      markDirty();
      renderPreview();
    });
  });
  document.querySelectorAll('[data-font]').forEach(sel => {
    sel.addEventListener('change', () => {
      state.fonts[sel.dataset.font] = sel.value;
      markDirty();
      renderPreview();
    });
  });
}

function renderFontSelectors() {
  const fonts = [DEFAULT_FONT, ...projectFonts.filter(f => f !== DEFAULT_FONT)];
  document.querySelectorAll('[data-font]').forEach(sel => {
    const current = state.fonts[sel.dataset.font];
    const list = fonts.includes(current) ? fonts : [...fonts, current];
    sel.innerHTML = list.map(f => `<option value="${escHtml(f)}">${escHtml(f === DEFAULT_FONT ? t('gui_font_default') : baseName(f))}</option>`).join('');
    sel.value = current;
  });
}

async function addFontFile() {
  const file = await window.guiApi.selectMediaFile('font');
  if (!file) return;
  const rel = 'fonts/' + baseName(file);
  if (!await window.guiApi.copyFileToProject(file, rel)) { notify(t('gui_font_error'), 'err'); return; }
  projectFonts = await window.guiApi.listProjectFonts();
  renderFontSelectors();
  notify(t('gui_font_added', baseName(file)), 'ok');
}

// Image of a part: keep the current one, use one of the user's, or draw one
function renderImageControl(part) {
  const img = state.images[part];
  const box = document.querySelector(`[data-image="${part}"]`);
  const radio = (value, key) => `<label class="ge-radio"><input type="radio" name="src-${part}" value="${value}" ${img.source === value ? 'checked' : ''}
    onchange="setImageSource('${part}', this.value)"><span>${t(key)}</span></label>`;
  const range = (field, key, min, max) => `<div class="ge-range"><span>${t(key)}</span>
    <input type="range" min="${min}" max="${max}" value="${img[field]}" oninput="setImageValue('${part}', '${field}', this)"><output>${img[field]}</output></div>`;
  const color = (field, key) => `<label><input type="color" value="${img[field]}" oninput="setImageValue('${part}', '${field}', this)"><span>${t(key)}</span></label>`;
  const files = IMAGE_FILES[part];
  let detail = '';
  if (img.source === 'keep') {
    detail = `<p class="ge-hint">${t('gui_image_keep_hint', files.join(', '))}</p>`;
  } else if (img.source === 'image') {
    detail = files.map((f, i) => `<div class="ge-file-row">
      <button class="btn btn-secondary btn-sm" onclick="pickImageFile('${part}', ${i})">${icon('image', 13)}${t(files.length > 1 ? (i ? 'gui_image_pick_hover' : 'gui_image_pick_idle') : 'gui_image_pick')}</button>
      <span class="ge-file-name">${escHtml(img.files[i] ? baseName(img.files[i]) : t('gui_image_none'))}</span></div>`).join('');
  } else {
    detail = `<div class="ge-colors">${color('color', part === 'choice' ? 'gui_color_idle_bg' : 'gui_color_bg')}${part === 'choice' ? color('hoverColor', 'gui_color_hover_bg') : ''}</div>
      ${part === 'gamemenu' ? '' : range('opacity', 'gui_opacity', 0, 100) + range('radius', 'gui_radius', 0, part === 'textbox' ? 80 : 40)}
      ${part === 'textbox' ? range('margin', 'gui_margin', 0, 200) : ''}`;
  }
  box.innerHTML = `<div class="ge-radios" role="radiogroup">${radio('keep', 'gui_image_keep')}${radio('image', 'gui_image_own')}${radio('generated', 'gui_image_generated')}</div>${detail}`;
}

function setImageSource(part, value) {
  state.images[part].source = value;
  renderImageControl(part);
  markDirty();
  renderPreview();
}

function setImageValue(part, field, input) {
  state.images[part][field] = input.type === 'range' ? Number(input.value) : input.value;
  const out = input.parentElement.querySelector('output');
  if (out) out.textContent = input.value;
  markDirty();
  renderPreview();
}

async function pickImageFile(part, index) {
  const file = await window.guiApi.selectMediaFile('image');
  if (!file) return;
  state.images[part].files[index] = file;
  renderImageControl(part);
  markDirty();
  renderPreview();
}

// ── Drawn images ──

function rgba(hex, opacity) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${opacity / 100})`;
}

// Frame borders of the drawn namebox and choice buttons: they also give the text its padding
function generatedBorders(part) {
  const r = state.images[part].radius;
  return part === 'namebox' ? { x: Math.max(r, 18), y: Math.max(r, 8) } : { x: Math.max(r, 40), y: Math.max(r, 12) };
}

// Canvas with the image the editor draws for a part (variant: 'hover' for the choice buttons)
function drawGenerated(part, variant = '') {
  const img = state.images[part];
  const c = document.createElement('canvas');
  let w, h, x = 0, y = 0, rw, rh;
  if (part === 'textbox') {
    w = project.width; h = state.textbox.height;
    x = img.margin; rw = w - img.margin * 2; rh = h - img.margin;
  } else if (part === 'gamemenu') {
    w = project.width; h = project.height; rw = w; rh = h;
  } else {
    const b = generatedBorders(part);
    w = b.x * 2 + 16; h = b.y * 2 + 16; rw = w; rh = h;
  }
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = rgba(variant === 'hover' ? img.hoverColor : img.color, part === 'gamemenu' ? 100 : img.opacity);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, Math.max(rw, 0), Math.max(rh, 0), part === 'gamemenu' ? 0 : img.radius);
  else ctx.rect(x, y, rw, rh);
  ctx.fill();
  return c;
}

function generatedURL(part, variant = '') {
  return drawGenerated(part, variant).toDataURL('image/png');
}

// CSS background for a part in the preview; for framed parts, a border-image like Ren'Py's Frame
function partBackground(part, index = 0) {
  const img = state.images[part];
  const variant = index ? 'hover' : '';
  if (img.source === 'generated') {
    const url = generatedURL(part, variant);
    if (part === 'namebox' || part === 'choice') {
      const b = generatedBorders(part);
      return `border-style: solid; border-width: ${b.y}px ${b.x}px; border-image: url('${url}') ${b.y} ${b.x} fill stretch;`;
    }
    return `background-image: url('${url}'); background-size: 100% 100%;`;
  }
  const src = img.source === 'image' && img.files[index] ? fileURL(img.files[index]) : getGameFileURL(IMAGE_FILES[part][index]) + '?' + loadStamp;
  return `background-image: url('${src}'); background-size: 100% 100%;`;
}

// ── Preview ──

let loadStamp = Date.now();
const loadedFonts = {};

function fontFamily(rel) {
  const fallback = "'DejaVu Sans', Verdana, sans-serif";
  if (!rel || rel === DEFAULT_FONT) return fallback;
  if (rel in loadedFonts) return loadedFonts[rel] ? `'${loadedFonts[rel]}', ${fallback}` : fallback;
  loadedFonts[rel] = '';
  const family = 'ge-font-' + Object.keys(loadedFonts).length;
  new FontFace(family, `url("${getGameFileURL(rel)}")`).load().then(face => {
    document.fonts.add(face);
    loadedFonts[rel] = family;
    renderPreview();
  }).catch(() => { /* keep the fallback */ });
  return fallback;
}

function setPreviewMode(mode) {
  previewMode = mode;
  for (const m of ['dialogue', 'choice', 'menu']) document.getElementById('ge-tab-' + m).setAttribute('aria-selected', String(m === mode));
  applyTabFilter();
  renderPreview();
}

// Only the options of what the preview shows are listed; their sections open
function applyTabFilter() {
  document.querySelectorAll('.ge-settings [data-tabs]').forEach(el => {
    const show = el.dataset.tabs.split(' ').includes(previewMode);
    el.hidden = !show;
    if (show && el.tagName === 'DETAILS') el.open = true;
  });
  document.querySelector('.ge-settings').scrollTop = 0;
}

function backgroundHtml() {
  const i = document.getElementById('ge-bg').value;
  const bg = i !== '' && backgrounds[+i];
  return bg ? `<img class="ge-bg-img" src="${getGameFileURL(bg.path)}" alt="">` : '<div class="ge-bg-plain"></div>';
}

function textStyle(fontRel, size, color) {
  return `font-family: ${fontFamily(fontRel)}; font-size: ${size}px; color: ${color};`;
}

function renderPreview() {
  if (!state) return;
  const stage = document.getElementById('ge-stage');
  stage.style.width = project.width + 'px';
  stage.style.height = project.height + 'px';
  const s = state;
  let html = '';
  if (previewMode === 'dialogue') {
    const nb = s.images.namebox.source === 'generated' ? generatedBorders('namebox') : { x: 5, y: 5 };
    html = backgroundHtml() + `
      <div class="ge-textbox" style="height: ${s.textbox.height}px; ${partBackground('textbox')}">
        <div class="ge-handle ge-handle-top" data-drag="textbox-height" title="${escHtml(t('gui_drag_height'))}"></div>
        <div class="ge-namebox" data-drag="name" title="${escHtml(t('gui_drag_move'))}" style="left: ${s.name.xpos}px; top: ${s.name.ypos}px; transform: translateX(-${s.name.xalign * 100}%);
          ${s.images.namebox.source === 'generated' ? '' : `padding: ${nb.y}px ${nb.x}px;`} ${partBackground('namebox')}">
          <span style="${textStyle(s.fonts.name, s.sizes.name, s.colors.accent)}">${escHtml(t('gui_sample_name'))}</span>
        </div>
        <div class="ge-dialogue" data-drag="dialogue" title="${escHtml(t('gui_drag_move'))}" style="left: ${s.dialogue.xpos}px; top: ${s.dialogue.ypos}px; width: ${s.dialogue.width}px;
          text-align: ${['left', 'center', 'right'][Math.round(s.dialogue.xalign * 2)]}; ${textStyle(s.fonts.text, s.sizes.text, s.colors.text)}">${escHtml(t('gui_sample_text'))}<div class="ge-handle ge-handle-right" data-drag="dialogue-width" title="${escHtml(t('gui_drag_width'))}"></div></div>
      </div>`;
  } else if (previewMode === 'choice') {
    const generated = s.images.choice.source === 'generated';
    const b = generated ? generatedBorders('choice') : { x: 0, y: 8 };
    const items = [t('gui_sample_choice_1'), t('gui_sample_choice_2'), t('gui_sample_choice_3')];
    html = backgroundHtml() + `<div class="ge-choices" style="gap: ${s.choice.spacing}px; top: ${Math.round(405 * project.height / 1080)}px;">
      ${items.map((text, i) => {
        const hover = i === 1;
        return `<div class="ge-choice" style="width: ${s.choice.width}px; ${generated ? '' : `padding: ${b.y}px 0;`} ${partBackground('choice', hover ? 1 : 0)}
          ${textStyle(s.fonts.interface, s.choice.textSize, hover ? s.choice.hoverColor : s.choice.idleColor)}">${escHtml(text)}${hover ? `<div class="ge-handle ge-handle-right" data-drag="choice-width" title="${escHtml(t('gui_drag_width'))}"></div>` : ''}</div>`;
      }).join('')}
    </div>`;
  } else {
    const u = project.height / 1080;
    const nav = ['gui_sample_nav_history', 'gui_sample_nav_save', 'gui_sample_nav_load', 'gui_sample_nav_prefs', 'gui_sample_nav_about', 'gui_sample_nav_quit'];
    const colorOf = (i) => i === 3 ? s.colors.selected : i === 1 ? s.colors.hover : s.colors.idle;
    html = `<div class="ge-gamemenu" style="${partBackground('gamemenu')}"></div>
      <img class="ge-overlay" src="${getGameFileURL('gui/overlay/game_menu.png')}" alt="" onerror="this.remove()">
      <div class="ge-nav" style="left: ${Math.round(60 * u)}px; gap: ${Math.round(6 * u)}px;">
        ${nav.map((k, i) => `<div style="${textStyle(s.fonts.interface, s.sizes.interface, colorOf(i))}">${escHtml(t(k))}</div>`).join('')}
      </div>
      <div class="ge-menu-title" style="left: ${Math.round(50 * u)}px; top: ${Math.round(30 * u)}px; ${textStyle(s.fonts.interface, Math.round(50 * u), s.colors.accent)}">${escHtml(t('gui_sample_nav_prefs'))}</div>
      <div class="ge-menu-body" style="left: ${Math.round(440 * u)}px; top: ${Math.round(180 * u)}px; ${textStyle(s.fonts.interface, s.sizes.interface, s.colors.interface)}">
        <div style="color: ${s.colors.accent}">${escHtml(t('gui_sample_pref_title'))}</div>
        <div style="color: ${s.colors.selected}">${escHtml(t('gui_sample_pref_on'))}</div>
        <div style="color: ${s.colors.idle}">${escHtml(t('gui_sample_pref_off'))}</div>
      </div>`;
  }
  stage.innerHTML = html;
  fitStage();
}

function fitStage() {
  const wrap = document.getElementById('ge-stage-wrap');
  const stage = document.getElementById('ge-stage');
  const sc = Math.min(wrap.clientWidth / project.width, wrap.clientHeight / project.height) || 1;
  previewScale = sc;
  const ox = (wrap.clientWidth - project.width * sc) / 2;
  const oy = (wrap.clientHeight - project.height * sc) / 2;
  stage.style.transform = `translate(${ox}px, ${oy}px) scale(${sc})`;
}

// ── Dragging in the preview ──
// What each draggable part changes: its values at the start of the drag (v) and
// the mouse movement in game pixels (dx, dy) give the new values
const DRAGS = {
  'name': { keys: ['name.xpos', 'name.ypos'], apply: (v, dx, dy) => [v[0] + dx, v[1] + dy] },
  'dialogue': { keys: ['dialogue.xpos', 'dialogue.ypos'], apply: (v, dx, dy) => [v[0] + dx, v[1] + dy] },
  'dialogue-width': { keys: ['dialogue.width'], apply: (v, dx) => [v[0] + dx] },
  'textbox-height': { keys: ['textbox.height'], apply: (v, dx, dy) => [v[0] - dy] },
  // The buttons are centred, so they grow on both sides
  'choice-width': { keys: ['choice.width'], apply: (v, dx) => [v[0] + dx * 2] }
};

// Same limits as the sliders of each value
function clampToControl(key, value) {
  const input = document.querySelector(`input[type="range"][data-key="${key}"]`);
  if (!input) return Math.round(value);
  return Math.round(clamp(value, +input.min, rangeMax(input)));
}

function setupDragging() {
  const stage = document.getElementById('ge-stage');
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('[data-drag]');
    if (!target || e.button !== 0) return;
    e.preventDefault();
    const d = DRAGS[target.dataset.drag];
    drag = { d, x: e.clientX, y: e.clientY, start: d.keys.map(k => getPath(state, k)) };
    document.body.classList.add('ge-dragging');
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = (e.clientX - drag.x) / previewScale, dy = (e.clientY - drag.y) / previewScale;
    drag.d.apply(drag.start, dx, dy).forEach((value, i) => setPath(state, drag.d.keys[i], clampToControl(drag.d.keys[i], value)));
    syncControls();
    markDirty();
    renderPreview();
  });
  document.addEventListener('pointerup', () => {
    drag = null;
    document.body.classList.remove('ge-dragging');
  });
}

// ── Saving ──

// Python literal for each kind of value
function pyValue(path, v) {
  if (path.startsWith('fonts.') || path.startsWith('colors.') || /Color$/.test(path)) return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return String(v);
}

function writeDefine(text, name, value) {
  const re = defineRe(name);
  if (re.test(text)) return text.replace(re, (all, start, _old, comment) => start + value + (comment ? ' ' + comment : ''));
  return text.replace(/\s*$/, '') + `\n\ndefine ${name} = ${value}\n`;
}

async function pngBytes(canvas) {
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

// The original image is kept once in gui/editor_backup before the editor replaces it
async function backupOnce(rel) {
  const backup = BACKUP_DIR + rel.replace(/^gui\//, '');
  if (await window.guiApi.fileExists(backup)) return;
  const bytes = await window.guiApi.readBinaryFile(rel);
  if (bytes) await window.guiApi.writeBinaryFile(backup, bytes);
}

async function saveImages() {
  let text = guiText;
  for (const [part, files] of Object.entries(IMAGE_FILES)) {
    const img = state.images[part];
    if (img.source === 'image') {
      for (let i = 0; i < files.length; i++) {
        if (!img.files[i]) continue;
        await backupOnce(files[i]);
        if (!await window.guiApi.copyFileToProject(img.files[i], files[i])) throw new Error(files[i]);
      }
    } else if (img.source === 'generated') {
      for (let i = 0; i < files.length; i++) {
        await backupOnce(files[i]);
        if (!await window.guiApi.writeBinaryFile(files[i], await pngBytes(drawGenerated(part, i ? 'hover' : '')))) throw new Error(files[i]);
      }
      // The drawn frames need their own borders so they stretch without bending the corners
      if (part === 'namebox' || part === 'choice') {
        const b = generatedBorders(part);
        const name = part === 'namebox' ? 'gui.namebox_borders' : 'gui.choice_button_borders';
        text = writeDefine(text, name, `Borders(${b.x}, ${b.y}, ${b.x}, ${b.y})`);
      }
    }
  }
  return text;
}

function stateMarker() {
  const images = {};
  for (const [part, img] of Object.entries(state.images)) {
    const { files, ...rest } = img;
    images[part] = rest;
  }
  return STATE_MARKER + JSON.stringify({ version: 1, images });
}

async function saveGui() {
  if (!gamePath) return false;
  try {
    let text = await saveImages();
    for (const [path, name] of Object.entries(DEFINES)) {
      const v = getPath(state, path);
      if (v !== getPath(loaded, path)) text = writeDefine(text, name, pyValue(path, v));
    }
    const lines = text.split('\n').filter(l => !l.startsWith(STATE_MARKER));
    // The marker line uses the same line ending as the rest of the file
    text = stateMarker() + (text.includes('\r\n') ? '\r\n' : '\n') + lines.join('\n');
    if (!await window.guiApi.writeFile(GUI_FILE, text)) throw new Error(GUI_FILE);
    guiText = text;

    if (state.cps !== loaded.cps) {
      let options = await window.guiApi.readFile(OPTIONS_FILE) || '';
      const re = /^(\s*default\s+preferences\.text_cps\s*=\s*)\d+/m;
      options = re.test(options) ? options.replace(re, `$1${state.cps}`) : options.replace(/\s*$/, '') + `\n\ndefault preferences.text_cps = ${state.cps}\n`;
      if (!await window.guiApi.writeFile(OPTIONS_FILE, options)) throw new Error(OPTIONS_FILE);
    }
    // What was saved is now the current state of the project
    for (const part of Object.keys(state.images)) {
      if (state.images[part].source === 'image') state.images[part].source = 'keep';
      state.images[part].files = [];
    }
    loaded = JSON.parse(JSON.stringify(state));
    loadStamp = Date.now();
    markDirty(false);
    syncControls();
    renderPreview();
    notify(t('gui_saved'), 'ok');
    return true;
  } catch (e) {
    notify(t('save_error', e.message), 'err');
    return false;
  }
}

async function saveAndTest() {
  if (await saveGui()) await window.guiApi.launchRenpyProject();
}

window.addEventListener('beforeunload', (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

// ── Init ──

(async function init() {
  const s = await window.guiApi.getSettings();
  applyTheme(s);
  await loadI18n(s.language || 'es');
  if (s.renpyExecutablePath) {
    const sdk = s.renpyExecutablePath.replace(/[\\/][^\\/]*$/, '');
    new FontFace('DejaVu Sans', `url("${fileURL(sdk + '/renpy/common/DejaVuSans.ttf')}")`).load()
      .then(face => { document.fonts.add(face); renderPreview(); }).catch(() => {});
  }
  gamePath = await window.guiApi.getGamePath();
  applyI18n();
  hydrateIcons();
  if (!gamePath) { notify(t('mm_no_project'), 'err'); return; }
  await loadState();
  await loadProjectLists();
  bindControls();
  syncControls();
  applyTabFilter();
  setupDragging();
  new ResizeObserver(fitStage).observe(document.getElementById('ge-stage-wrap'));
  renderPreview();

  window.guiApi.onSettingsChanged(async (ns) => {
    applyTheme(ns);
    if (ns.language) {
      await loadI18n(ns.language);
      applyI18n();
      syncControls();
      renderPreview();
    }
  });
})();
