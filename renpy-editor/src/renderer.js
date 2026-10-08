// ═══════════════════════════════════════════════════════════════════
// Ren'Py EDITOR — Renderer (Main Window)
// ═══════════════════════════════════════════════════════════════════

// ── State ──
let gamePath = '';
let activeRpyFile = 'script.rpy';
let activeScriptText = '';
let rpyFiles = [];
let blocks = [];
let editingIndex = -1;
let translations = {};
let currentLang = 'es';
let codePreviewIsEditing = false;
let codePreviewHasManual = false;
let codePreviewManualText = '';
let codePreviewIsSyncing = false;
let codePreviewRefreshTimer = null;
let codePreviewBlocksTimer = null;
let codePreviewUndoStack = [];
let codePreviewRedoStack = [];
let codePreviewDirty = false;
let lastGeneratedPreviewText = '';

const data = {
  characters: [],
  backgrounds: [],
  scenes: [],
  animations: [],
  positions: [],
  expressions: [],   // { charId, key, path }[]
  labels: [],
  audioFiles: [],
  positionAligns: {},  // { name: { x, y } } from Position(...) defines
  resolution: { width: 1920, height: 1080 }
};

// ═══════════════════════════════════════════════════════════════════
// I18N
// ═══════════════════════════════════════════════════════════════════
async function loadI18n(lang) {
  try {
    const raw = await window.api.readI18n(lang);
    translations = JSON.parse(raw);
    currentLang = lang;
    document.documentElement.lang = lang;
  } catch (e) { translations = {}; }
}

function t(key, ...args) {
  let str = translations[key] || key;
  args.forEach((arg, i) => { str = str.replace(`{${i}}`, arg); });
  return str;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val !== key) {
      const text = el.textContent;
      
      // Detectar icono en el texto actual del HTML
      const spaceIdx = text.indexOf(' ');
      let currentIcon = '';
      if (spaceIdx > 0 && spaceIdx <= 2) {
        const prefix = text.substring(0, spaceIdx);
        if (!/[\p{L}\p{N}]/u.test(prefix)) {
          currentIcon = prefix;
        }
      }
      
      // Detectar y eliminar icono en el texto traducido
      const valSpaceIdx = val.indexOf(' ');
      let newText = val;
      if (valSpaceIdx > 0 && valSpaceIdx <= 2) {
        const prefix = val.substring(0, valSpaceIdx);
        if (!/[\p{L}\p{N}]/u.test(prefix)) {
          newText = val.substring(valSpaceIdx + 1);
        }
      }
      
      // Usar el icono actual (del HTML) con el nuevo texto (sin icono)
      if (currentIcon) {
        el.textContent = currentIcon + ' ' + newText;
      } else {
        el.textContent = val;
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════
let settingsOpen = false;

function toggleSettings() {
  settingsOpen = !settingsOpen;
  document.getElementById('settings-panel').classList.toggle('open', settingsOpen);
}

let customTheme = { ...CUSTOM_THEME_DEFAULT };
let customThemeSaveTimer = null;

async function changeTheme(theme) {
  applyTheme({ theme, customTheme });
  renderCustomThemeEditor(theme);
  await window.api.saveSettings({ theme });
  if (theme === 'custom') openCustomThemeEditor();
}

// Settings panel: just a button to open the color editor when the custom theme is selected
function renderCustomThemeEditor(theme) {
  const el = document.getElementById('custom-theme-editor');
  el.innerHTML = theme !== 'custom' ? '' : `
    <button class="btn btn-secondary btn-sm" onclick="openCustomThemeEditor()">${t('custom_theme_edit')}</button>`;
}

// Separate dialog with the color pickers: the native color popup doesn't cover other settings
// and the app stays visible behind it as a live preview
const CUSTOM_THEME_CODE_SAMPLE = [
  'label start:',
  '    # Comentario',
  '    scene bg cafeteria',
  '    e "¡Hola!"',
  '    $ puntos = 10',
  '    pause 1.5',
  '    jump capitulo_2'
].join('\n');

function customThemeRow(k, value) {
  return `
    <div class="custom-theme-row">
      <span>${t('custom_theme_' + k)}</span>
      <input type="color" id="ct-color-${k}" value="${value}" oninput="changeCustomThemeColor('${k}', this.value)">
      <input class="form-input" id="ct-hex-${k}" value="${value}" maxlength="7" spellcheck="false"
        oninput="onCustomThemeHexInput('${k}', this.value)">
    </div>`;
}

function openCustomThemeEditor() {
  settingsOpen = false;
  document.getElementById('settings-panel').classList.remove('open');
  const c = resolveCustomTheme(customTheme);
  document.getElementById('theme-body').innerHTML = `
    <div class="settings-hint">${t('custom_theme_hint')}</div>
    <div class="custom-theme-section">${t('custom_theme_section_ui')}</div>
    ${CUSTOM_THEME_KEYS.map(k => customThemeRow(k, c[k])).join('')}
    <div class="custom-theme-section">${t('custom_theme_section_code')}</div>
    <pre id="ct-code-sample">${highlightRenpyCode(CUSTOM_THEME_CODE_SAMPLE)}</pre>
    ${CUSTOM_THEME_CODE_KEYS.map(k => customThemeRow(k, c[k])).join('')}`;
  document.getElementById('theme-overlay').classList.add('open');
  document.addEventListener('keydown', onCustomThemeEditorKey, true);
}

function closeCustomThemeEditor() {
  document.getElementById('theme-overlay').classList.remove('open');
  document.removeEventListener('keydown', onCustomThemeEditorKey, true);
}

function onCustomThemeEditorKey(e) {
  if (e.key === 'Escape' && !document.querySelector('.app-dialog-overlay')) { e.preventDefault(); closeCustomThemeEditor(); }
}

// Code colors not set by the user follow the interface ones, so every field is refreshed
function syncCustomThemeInputs(skipKey, skipField) {
  const c = resolveCustomTheme(customTheme);
  [...CUSTOM_THEME_KEYS, ...CUSTOM_THEME_CODE_KEYS].forEach(k => {
    const color = document.getElementById('ct-color-' + k);
    const hex = document.getElementById('ct-hex-' + k);
    if (color && !(k === skipKey && skipField === 'color')) color.value = c[k];
    if (hex && !(k === skipKey && skipField === 'hex')) hex.value = c[k];
  });
}

// source: the field that was edited ('color' or 'hex'), left untouched while the user types
function changeCustomThemeColor(key, value, source = 'color') {
  customTheme[key] = value;
  syncCustomThemeInputs(key, source);
  applyTheme({ theme: 'custom', customTheme });
  clearTimeout(customThemeSaveTimer);
  customThemeSaveTimer = setTimeout(() => {
    window.api.saveSettings({ customTheme: { ...customTheme } }).catch(e => {});
  }, 250);
}

function onCustomThemeHexInput(key, value) {
  let v = value.trim();
  if (!v.startsWith('#')) v = '#' + v;
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
  changeCustomThemeColor(key, v.toLowerCase(), 'hex');
}

async function resetCustomTheme() {
  customTheme = { ...CUSTOM_THEME_DEFAULT };
  applyTheme({ theme: 'custom', customTheme });
  syncCustomThemeInputs();
  await window.api.saveSettings({ customTheme: { ...customTheme } });
}

// ── Spellcheck: one checkbox per dictionary, saved per user ──
let spellcheckAvailable = [];
let spellcheckLanguages = [];

async function initSpellcheckSettings(s) {
  spellcheckLanguages = s.spellcheckLanguages || [];
  spellcheckAvailable = await window.api.getSpellcheckLanguages();
  renderSpellcheckSettings();
}

function renderSpellcheckSettings() {
  const el = document.getElementById('setting-spellcheck');
  let names = null;
  try { names = new Intl.DisplayNames([currentLang], { type: 'language' }); } catch (e) { /* show codes */ }
  el.innerHTML = spellcheckAvailable.map(code => {
    const name = names?.of(code) || code;
    return `
    <label class="settings-check">
      <input type="checkbox" ${spellcheckLanguages.includes(code) ? 'checked' : ''} onchange="toggleSpellcheckLanguage('${code}', this.checked)">
      <span>${escHtml(name.charAt(0).toUpperCase() + name.slice(1))}</span>
    </label>`;
  }).join('');
}

async function toggleSpellcheckLanguage(code, on) {
  spellcheckLanguages = on
    ? [...new Set([...spellcheckLanguages, code])]
    : spellcheckLanguages.filter(l => l !== code);
  await window.api.saveSettings({ spellcheckLanguages });
}

async function changeLanguage(lang) {
  await loadI18n(lang);
  applyI18n();
  updateProjectsDirLabel();
  updateRenpyPathLabel();
  renderCustomThemeEditor(document.getElementById('setting-theme').value);
  renderSpellcheckSettings();
  renderBlocks();
  renderAssetBrowser();
  updateCodePreview();
  await window.api.saveSettings({ language: lang });
}

// ═══════════════════════════════════════════════════════════════════
// PROJECT
// ═══════════════════════════════════════════════════════════════════
async function openProjectFolder() {
  const result = await window.api.selectProjectFolder();
  if (!result) return;
  gamePath = result;
  await loadProjectData();
  renderAssetBrowser();
  renderBlocks();
  updateCodePreview();
  setStatus(gamePath, 'ok');
  notify(t('active_file', activeRpyFile), 'ok');
}

async function loadProjectData() {
  data.characters = []; data.backgrounds = []; data.animations = [];
  data.positions = []; data.expressions = []; data.labels = []; data.scenes = [];
  data.audioFiles = []; data.positionAligns = {};
  data.resolution = { width: 1920, height: 1080 };

  const guiText = await window.api.readFile('gui.rpy');
  if (guiText) parseResolution(guiText);

  const personajesText = await window.api.readFile('characters.rpy');
  const fondosText     = await window.api.readFile('backgrounds.rpy');
  const scenesText     = await window.api.readFile('scenes.rpy');
  const animText       = await window.api.readFile('animations.rpy');
  const posText        = await window.api.readFile('positions.rpy');
  const exprText       = await window.api.readFile('expressions.rpy');
  activeScriptText     = await window.api.readFile(activeRpyFile);

  if (personajesText) parsePersonajes(personajesText);
  if (fondosText)     parseFondos(fondosText);
  if (scenesText)     parseScenes(scenesText);
  if (animText)       parseAnimaciones(animText);
  if (posText)        parsePositions(posText);
  if (exprText)       parseExpresiones(exprText);
  if (activeScriptText) parseScriptLabels(activeScriptText);
  refreshLabelSelector();

  // Audio files
  data.audioFiles = await window.api.listAudioFiles();

  // RPY files
  rpyFiles = await window.api.listRpyFiles();

  checkGuiImages();
}

// ═══════════════════════════════════════════════════════════════════
// PARSERS
// ═══════════════════════════════════════════════════════════════════
function parsePersonajes(text) {
  const chars = {};
  const charOrder = [];

  const defineRe = /define\s+(\w+)\s*=\s*Character\s*\(\s*"([^"]+)"(?:.*?image\s*=\s*"([^"]+)")?/g;
  let m;
  while ((m = defineRe.exec(text)) !== null) {
    const id = m[1], name = m[2], imageAttr = m[3] || '';
    const lineEnd = text.indexOf('\n', m.index);
    const colorMatch = /color\s*=\s*"([^"]+)"/.exec(text.slice(m.index, lineEnd < 0 ? undefined : lineEnd));
    const color = colorMatch ? colorMatch[1] : '';
    if (!chars[id]) { chars[id] = { id, displayName: name, imageAttr, color, images: [] }; charOrder.push(id); }
  }

  const imageRe = /^image\s+(\w+)\s*=\s*"([^"]+)"/gm;
  const charList = charOrder.map(id => chars[id]);
  while ((m = imageRe.exec(text)) !== null) {
    const key = m[1], path = m[2];
    const chr = findCharForSpriteKey(charList, key);
    if (chr) chr.images.push({ key, path });
  }
  data.characters = charList;
}

function parseFondos(text) {
  const re = /^image\s+(\w+)\s*=\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    data.backgrounds.push({ key: m[1], path: m[2] });
  }
}

function parseScenes(text) {
  const re = /^image\s+(\w+)\s*=\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    data.scenes.push({ key: m[1], path: m[2] });
  }
}

function parseAnimaciones(text) {
  const re = /^transform\s+(\w+)\s*:/gm;
  let m;
  while ((m = re.exec(text)) !== null) data.animations.push(m[1]);
  if (!data.animations.includes('xflip')) data.animations.push('xflip');
  if (!data.animations.includes('appear_from_right')) data.animations.push('appear_from_right');
}

function parsePositions(text) {
  const re = /^define\s+(\w+)\s*=/gm;
  let m;
  while ((m = re.exec(text)) !== null) data.positions.push(m[1]);

  // Alignment of each Position(...) define, used by the scene preview
  const posRe = /^define\s+(\w+)\s*=\s*Position\s*\(([^)]*)\)/gm;
  while ((m = posRe.exec(text)) !== null) {
    const x = /xalign\s*=\s*([\d.]+)/.exec(m[2]);
    const y = /yalign\s*=\s*([\d.]+)/.exec(m[2]);
    data.positionAligns[m[1]] = { x: x ? parseFloat(x[1]) : 0.5, y: y ? parseFloat(y[1]) : 1.0 };
  }
}

// Game resolution from gui.rpy: gui.init(1920, 1080)
function parseResolution(text) {
  const m = /gui\.init\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(text);
  if (m) data.resolution = { width: parseInt(m[1], 10), height: parseInt(m[2], 10) };
  const accent = /define\s+gui\.accent_color\s*=\s*['"]([^'"]+)['"]/.exec(text);
  data.guiAccent = accent ? accent[1] : '';
}

function parseExpresiones(text) {
  // Parse per-character expressions: image side CharId key = "path"
  const re = /^image\s+side\s+(\w+)\s+(\w+)\s*=\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    data.expressions.push({ charId: m[1], key: m[2], path: m[3] });
  }
}

function parseScriptLabels(text) {
  const re = /^label\s+(\w+)\s*:/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (!data.labels.includes(m[1])) data.labels.push(m[1]);
  }
}

// ═══════════════════════════════════════════════════════════════════
// IMAGE LOADING — uses game:// protocol
// ═══════════════════════════════════════════════════════════════════
function getImageURL(relativePath) {
  return getGameFileURL('images/' + relativePath);
}

// file:// URL of a file given its path relative to the game/ folder
function getGameFileURL(relativePath) {
  if (!gamePath) return null;
  // Build absolute file path, then convert to a proper file:// URL
  const absPath = gamePath.replace(/\\/g, '/') + '/' + relativePath;
  // Encode each segment but preserve drive letter colon
  const parts = absPath.split('/');
  const encoded = parts.map((s, i) => {
    if (i === 0 && /^[a-zA-Z]:$/.test(s)) return s; // drive letter
    return encodeURIComponent(s);
  }).join('/');
  return 'file:///' + encoded;
}

// ═══════════════════════════════════════════════════════════════════
// SCENE PREVIEW — the stage as it looks after the selected block
// ═══════════════════════════════════════════════════════════════════
let previewIndex = -1;  // selected block; -1 = the last one
const guiImages = { textbox: false, choice: false };

// Ren'Py's built-in positions as { xalign, yalign }
const BUILTIN_POSITIONS = {
  left: { x: 0.0, y: 1.0 }, right: { x: 1.0, y: 1.0 }, center: { x: 0.5, y: 1.0 },
  truecenter: { x: 0.5, y: 0.5 }, top: { x: 0.5, y: 0.0 },
  topleft: { x: 0.0, y: 0.0 }, topright: { x: 1.0, y: 0.0 }
};

function previewBlockIndex() {
  return previewIndex >= 0 && previewIndex < blocks.length ? previewIndex : blocks.length - 1;
}

function selectPreviewBlock(i) {
  previewIndex = i;
  document.querySelectorAll('#block-list > .block').forEach((el, j) => {
    el.classList.toggle('preview-selected', j === i);
  });
  updateScenePreview();
}

// The textbox and choice images of the project's GUI, when it has them
function checkGuiImages() {
  for (const [name, path] of [['textbox', 'gui/textbox.png'], ['choice', 'gui/button/choice_idle_background.png']]) {
    guiImages[name] = false;
    const img = new Image();
    img.onload = () => { guiImages[name] = true; updateScenePreview(); };
    img.src = getGameFileURL(path);
  }
}

function findImagePath(key) {
  for (const list of [data.backgrounds, data.scenes]) {
    const found = list.find(x => x.key === key);
    if (found) return found.path;
  }
  for (const c of data.characters) {
    const found = c.images.find(x => x.key === key);
    if (found) return found.path;
  }
  return null;
}

// Shown images are identified by their tag (first word of the name), like in Ren'Py
function previewShowLayer(st, sp) {
  const tag = (sp.image || '').split(' ')[0];
  if (!tag) return;
  const layer = { tag, key: sp.image, position: sp.position, flipH: sp.flipH, blur: sp.blur };
  const current = st.layers.findIndex(l => l.tag === tag);
  if (current >= 0) { st.layers[current] = layer; return; }
  const behind = sp.behind ? st.layers.findIndex(l => l.tag === sp.behind) : -1;
  if (behind >= 0) st.layers.splice(behind, 0, layer);
  else st.layers.push(layer);
}

function previewHideLayer(st, image) {
  const tag = (image || '').split(' ')[0];
  st.layers = st.layers.filter(l => l.tag !== tag);
}

// Stage after running the top-level blocks up to and including `upTo`
function computeSceneState(upTo) {
  const st = { background: null, layers: [], say: null, menu: null, music: '' };
  for (let i = 0; i <= upTo && i < blocks.length; i++) {
    const b = blocks[i];
    st.say = null;
    st.menu = null;
    switch (b.type) {
      case 'scene':
        st.background = { key: b.background, blur: b.blur };
        st.layers = [];
        break;
      case 'show':       previewShowLayer(st, b); break;
      case 'show_multi': (b.sprites || []).forEach(sp => previewShowLayer(st, sp)); break;
      case 'hide':       previewHideLayer(st, b.image); break;
      case 'hide_multi': (b.sprites || []).forEach(sp => previewHideLayer(st, sp.image)); break;
      case 'solid': {
        const layer = { tag: b.name, color: b.color };
        const current = st.layers.findIndex(l => l.tag === b.name);
        if (current >= 0) st.layers[current] = layer; else st.layers.push(layer);
        break;
      }
      case 'dialogue':
        st.say = {
          charId: b.character, text: b.text, thought: b.thought,
          expression: b.expression, exprTag: b.exprTag || getExpressionCharId(b.character)
        };
        break;
      case 'narration': st.say = { text: b.text }; break;
      case 'menu':      st.menu = (b.choices || []).map(c => c.text); break;
      case 'music':     st.music = b.action === 'stop' ? '' : (b.file || ''); break;
    }
  }
  return st;
}

// Text without Ren'Py text tags like {i} or {color=...}
function stripTextTags(s) {
  return (s || '').replace(/\{\/?[a-z]+[^}]*\}/gi, '');
}

// Images that are not declared or fail to load become a labelled placeholder
function previewImageHtml(key, path, style, cls) {
  return path
    ? `<img class="${cls}" src="${getImageURL(path)}" style="${style}" data-key="${escHtml(key)}" onerror="previewImageError(this)">`
    : `<div class="sp-missing ${cls}-missing">${escHtml(key)}</div>`;
}

function previewImageError(img) {
  const ph = document.createElement('div');
  ph.className = `sp-missing ${img.className}-missing`;
  ph.textContent = img.dataset.key;
  img.replaceWith(ph);
}

function updateScenePreview() {
  const box = document.getElementById('scene-preview');
  const info = document.getElementById('scene-preview-info');
  if (!box) return;
  const { width: W, height: H } = data.resolution;
  box.style.aspectRatio = `${W} / ${H}`;
  if (!gamePath || !blocks.length) {
    box.innerHTML = `<div class="sp-empty">${t(gamePath ? 'scene_preview_empty' : 'open_folder_hint')}</div>`;
    info.textContent = '';
    return;
  }

  const idx = previewBlockIndex();
  const st = computeSceneState(idx);
  const u = W / 1920;  // GUI sizes below are Ren'Py's defaults at 1920x1080
  let html = '';

  if (st.background) {
    const blur = st.background.blur ? 'filter:blur(8px);' : '';
    html += previewImageHtml(st.background.key, findImagePath(st.background.key), blur, 'sp-bg');
  }

  for (const l of st.layers) {
    if (l.color) { html += `<div class="sp-solid" style="background:${escHtml(l.color)}"></div>`; continue; }
    const pos = data.positionAligns[l.position] || BUILTIN_POSITIONS[l.position] || BUILTIN_POSITIONS.center;
    const imgStyle = (l.flipH ? 'transform:scaleX(-1);' : '') + (l.blur ? 'filter:blur(8px);' : '');
    html += `<div class="sp-sprite" style="left:${pos.x * 100}%;top:${pos.y * 100}%;transform:translate(-${pos.x * 100}%,-${pos.y * 100}%)">
      ${previewImageHtml(l.key, findImagePath(l.key), imgStyle, 'sp-sprite-img')}
    </div>`;
  }

  if (st.say) {
    const chr = st.say.charId ? data.characters.find(c => c.id === st.say.charId) : null;
    const name = chr ? chr.displayName : (st.say.charId || '');
    const nameColor = (chr && chr.color) || data.guiAccent || '#ffffff';
    const text = escHtml(stripTextTags(st.say.text));
    const bg = guiImages.textbox ? `background-image:url('${getGameFileURL('gui/textbox.png')}');` : 'background-color:rgba(0,0,0,.6);';
    html += `<div class="sp-textbox" style="height:${278 * u}px;${bg}">
      ${name ? `<div class="sp-name" style="left:${360 * u}px;top:${3 * u}px;font-size:${45 * u}px;color:${escHtml(nameColor)}">${escHtml(name)}</div>` : ''}
      <div class="sp-text" style="left:${402 * u}px;top:${75 * u}px;width:${1116 * u}px;font-size:${33 * u}px;${st.say.thought ? 'font-style:italic;' : ''}">${st.say.thought ? `&lt;&lt;${text}&gt;&gt;` : text}</div>
    </div>`;
    if (st.say.expression) {
      const side = data.expressions.find(e => e.charId === st.say.exprTag && e.key === st.say.expression);
      if (side) html += `<img class="sp-side" src="${getImageURL(side.path)}" onerror="this.style.display='none'">`;
    }
  }

  if (st.menu) {
    const bg = guiImages.choice ? `background-image:url('${getGameFileURL('gui/button/choice_idle_background.png')}');` : 'background-color:rgba(0,0,0,.6);';
    html += `<div class="sp-menu" style="gap:${33 * u}px">${st.menu.map(c =>
      `<div class="sp-choice" style="width:${1185 * u}px;font-size:${33 * u}px;padding:${8 * u}px 0;${bg}">${escHtml(stripTextTags(c))}</div>`).join('')}</div>`;
  }

  box.innerHTML = `<div class="sp-stage" style="width:${W}px;height:${H}px">${html}</div>`;
  scaleScenePreview();
  info.textContent = t('scene_preview_block', idx + 1, blocks.length) + (st.music ? ' · ' + t('scene_preview_music', st.music) : '');
}

// The stage is drawn at the game's resolution and scaled to fit the panel
function scaleScenePreview() {
  const box = document.getElementById('scene-preview');
  const stage = box && box.querySelector('.sp-stage');
  if (stage) stage.style.transform = `scale(${box.clientWidth / data.resolution.width})`;
}

// ═══════════════════════════════════════════════════════════════════
// ASSET BROWSER (left panel — .rpy file list)
// ═══════════════════════════════════════════════════════════════════
function renderAssetBrowser() {
  const c = document.getElementById('asset-content');
  if (!gamePath) {
    c.innerHTML = `<div style="color:var(--text3);font-style:italic;text-align:center;margin-top:30px;font-size:11px;">${t('open_folder_hint')}</div>`;
    return;
  }
  const filesHtml = rpyFiles.length
    ? rpyFiles.map(f => {
      const isActive = f === activeRpyFile;
      return `<div class="rpy-file ${isActive ? 'active' : ''}" onclick="selectRpyFile('${f.replace(/'/g, "\\'")}')" title="${escHtml(f)}">📄 ${escHtml(f)}</div>`;
    }).join('')
    : `<div style="color:var(--text3);font-size:11px;text-align:center;margin:20px 0 10px;">${t('no_rpy_files')}</div>`;
  const newHtml = newRpyEditing
    ? `<div class="rpy-new-row">
        <input class="form-input" id="new-rpy-name" placeholder="${t('new_rpy_placeholder')}"
          onkeydown="onNewRpyKeydown(event)" onblur="onNewRpyBlur()">
        <span class="rpy-new-ext">.rpy</span>
      </div>`
    : `<button class="rpy-add-btn" onclick="startNewRpy()" title="${t('new_rpy')}">+</button>`;
  c.innerHTML = filesHtml + newHtml;
}

// ── New .rpy file (inline name input at the end of the list) ──
let newRpyEditing = false;
let newRpyCreating = false;

function startNewRpy() {
  newRpyEditing = true;
  renderAssetBrowser();
  const input = document.getElementById('new-rpy-name');
  if (input) { input.focus(); input.scrollIntoView({ block: 'nearest' }); }
}

function cancelNewRpy() {
  newRpyEditing = false;
  renderAssetBrowser();
}

function onNewRpyKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); createNewRpy(); }
  else if (e.key === 'Escape') { e.preventDefault(); cancelNewRpy(); }
}

function onNewRpyBlur() {
  // Leaving the field empty cancels; with a name it stays open until Enter/Escape
  setTimeout(() => {
    const input = document.getElementById('new-rpy-name');
    if (newRpyEditing && !newRpyCreating && input && !input.value.trim()) cancelNewRpy();
  }, 150);
}

async function createNewRpy() {
  const input = document.getElementById('new-rpy-name');
  const name = (input?.value || '').trim();
  if (!name) { cancelNewRpy(); return; }
  newRpyCreating = true;
  const res = await window.api.createRpyFile(name);
  newRpyCreating = false;
  if (!res?.ok) {
    const msg = res?.error === 'exists' ? t('new_rpy_exists', res.file)
      : res?.error === 'invalid-name' ? t('new_rpy_invalid') : t('save_error', res?.message || res?.error || '');
    notify(msg, 'err');
    input?.focus();
    return;
  }
  newRpyEditing = false;
  rpyFiles = await window.api.listRpyFiles();
  renderAssetBrowser();
  notify(t('new_rpy_created', res.file), 'ok');
  await selectRpyFile(res.file);
  document.querySelector('#asset-content .rpy-file.active')?.scrollIntoView({ block: 'nearest' });
}

async function selectRpyFile(filename) {
  if (filename === activeRpyFile) return;
  if (blocks.length > 0 && !await showConfirm(t('change_file_confirm', blocks.length, filename), { type: 'warning' })) return;
  resetManualCodePreview();
  activeRpyFile = filename;
  blocks = [];
  data.labels = [];
  activeScriptText = await getScriptText();
  if (activeScriptText) parseScriptLabels(activeScriptText);
  refreshLabelSelector();
  renderBlocks();
  updateCodePreview();
  renderAssetBrowser();
  notify(t('active_file', filename), 'ok');
}

// ═══════════════════════════════════════════════════════════════════
// BLOCK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
function addBlock(type) {
  editingIndex = -1;
  openModal(type, null);
}

function editBlock(idx) {
  editingIndex = idx;
  openModal(blocks[idx].type, blocks[idx]);
}

async function confirmDeleteBlock(b) {
  if (!b) return false;
  const meta = BLOCK_META[b.type] || { labelKey: b.type };
  return showConfirm(t('confirm_delete_block', t(meta.labelKey), truncate(blockDesc(b), 60)), { danger: true });
}

async function deleteBlock(idx) {
  if (!await confirmDeleteBlock(blocks[idx])) return;
  blocks.splice(idx, 1);
  renderBlocks(); updateCodePreview();
}

function duplicateBlock(idx) {
  const clone = JSON.parse(JSON.stringify(blocks[idx]));
  blocks.splice(idx + 1, 0, clone);
  renderBlocks(); updateCodePreview();
}

function duplicateBlockToEnd(idx) {
  const clone = JSON.parse(JSON.stringify(blocks[idx]));
  const last = blocks[blocks.length - 1];
  if (last && last.type === 'custom' && last.code.trim() === 'return') {
    blocks.splice(blocks.length - 1, 0, clone);
  } else {
    blocks.push(clone);
  }
  renderBlocks(); updateCodePreview();
  document.getElementById('block-list').scrollTop = document.getElementById('block-list').scrollHeight;
}

async function clearAllBlocks() {
  if (!blocks.length) return;
  if (await showConfirm(t('clear_confirm'), { danger: true })) { blocks = []; renderBlocks(); updateCodePreview(); }
}

// ═══════════════════════════════════════════════════════════════════
// BLOCK RENDER
// ═══════════════════════════════════════════════════════════════════
const BLOCK_META = {
  narration:  { icon: '📝', labelKey: 'block_narration',     color: '#9aa5b8' },
  dialogue:   { icon: '💬', labelKey: 'block_dialogue',       color: '#4ecdc4' },
  show:       { icon: '👤', labelKey: 'block_show',           color: '#56c596' },
  show_multi: { icon: '👥', labelKey: 'block_show_multi',     color: '#2ecc71' },
  hide:       { icon: '🫥', labelKey: 'block_hide',           color: '#f5a623' },
  hide_multi: { icon: '🫧', labelKey: 'block_hide_multi',     color: '#e67e22' },
  scene:      { icon: '🌄', labelKey: 'block_scene',          color: '#9c59d1' },
  solid:      { icon: '🎨', labelKey: 'block_solid',          color: '#5d6d7e' },
  label:      { icon: '📌', labelKey: 'block_label',         color: '#e94560' },
  menu:       { icon: '❓', labelKey: 'block_menu',            color: '#e67e22' },
  condition:  { icon: '🔀', labelKey: 'block_condition',       color: '#8e7cc3' },
  pause:      { icon: '⏸️', labelKey: 'block_pause',         color: '#6b7a96' },
  music:      { icon: '🎵', labelKey: 'block_music',          color: '#3498db' },
  jump:       { icon: '↪️', labelKey: 'block_jump',           color: '#f5a623' },
  call:       { icon: '📞', labelKey: 'block_call',           color: '#9b59b6' },
  comment:    { icon: '💭', labelKey: 'block_comment',        color: '#6b7a96' },
  custom:     { icon: '📋', labelKey: 'block_custom',         color: '#2d3f62' },
};

function blockDesc(b) {
  switch (b.type) {
    case 'narration': return `"${truncate(b.text, 80)}"`;
    case 'dialogue':  return `${b.character} → ${b.thought?'💭 ':''}\"${truncate(b.text, 60)}\"`;
    case 'show':       return `${b.image}${b.position?' at '+b.position:''}${b.behind?' behind '+b.behind:''}${b.transition?' with '+b.transition:''}${b.flipH?' [volteado]':''}${b.blur?' [blur]':''}`;
    case 'show_multi': return `${(b.sprites||[]).map(s=>s.image).join(', ')}${b.transition?' with '+b.transition:''}`;
    case 'hide':       return `hide ${b.image}${b.transition?' with '+b.transition:''}`;
    case 'hide_multi': return `ocultar: ${(b.sprites||[]).map(s=>s.image).join(', ')}${b.transition?' with '+b.transition:''}`;
    case 'scene':     return `scene ${b.background}${b.blur?' at blur':''}${b.transition?' with '+b.transition:''}`;
    case 'solid':     return `Solid("${b.color}") as ${b.name}${b.transition?' with '+b.transition:''}`;
    case 'label':     return `label ${b.name}:`;
    case 'menu':      return `${b.choices?.length||0} opciones: ${(b.choices||[]).map(c=>'"'+truncate(c.text,20)+'"').join(', ')}`;
    case 'condition': {
      const hasElse = !!b.hasElse;
      const elifCount = (b.elifBlocks || []).length;
      const elifInfo = elifCount ? ` + ${elifCount} elif` : '';
      const elseInfo = hasElse ? ` + else (${b.elseBlocks?.length || 0} ${t('blocks_label')})` : '';
      return `if ${b.condition || '...'} (${b.blocks?.length || 0} ${t('blocks_label')})${elifInfo}${elseInfo}`;
    }
    case 'pause':     return b.duration ? `pause ${b.duration}s` : 'pause';
    case 'music':     return `${b.action} music "${b.file||'...'}"`;
    case 'jump':      return `jump ${b.label||'...'}`;  
    case 'call':      return `call ${b.label||'...'}`;
    case 'comment':   return `# ${b.text}`;
    case 'custom':    return truncate(b.code, 80);
    default:          return '';
  }
}

function truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }

function renderBlocks() {
  const list = document.getElementById('block-list');
  if (!blocks.length) { list.innerHTML = ''; updateScenePreview(); return; }
  const selected = previewBlockIndex();
  list.innerHTML = blocks.map((b, i) => {
    const meta = BLOCK_META[b.type] || { icon: '?', labelKey: b.type };
    const label = t(meta.labelKey);
    return `<div class="block type-${b.type}${i === selected ? ' preview-selected' : ''}" id="block-${i}" draggable="true"
      onclick="selectPreviewBlock(${i})"
      ondragstart="onBlockDragStart(event,${i})" ondragend="onBlockDragEnd(event)"
      ondragover="onBlockDragOver(event,${i})" ondragleave="onBlockDragLeave(event)"
      ondrop="onBlockDrop(event,${i})">
      <div class="block-icon">${meta.icon}</div>
      <div class="block-content">
        <div class="block-title">${label}</div>
        <div class="block-desc">${escHtml(blockDesc(b))}</div>
      </div>
      <div class="block-actions">
        <button class="block-btn" onclick="duplicateBlock(${i})" title="${t('btn_duplicate')}">📋 ${t('btn_duplicate')}</button>
        <button class="block-btn" onclick="duplicateBlockToEnd(${i})" title="${t('btn_duplicate_end')}">⬇️ ${t('btn_duplicate_end')}</button>
        <button class="block-btn" onclick="editBlock(${i})" title="${t('btn_edit')}">✏️ ${t('btn_edit')}</button>
        <button class="block-btn danger" onclick="deleteBlock(${i})" title="${t('btn_delete')}">🗑 ${t('btn_delete')}</button>
      </div>
    </div>`;
  }).join('');
  updateScenePreview();
}

// ── Drag & Drop ──
let dragSrcIndex = null;
function onBlockDragStart(e, idx) {
  dragSrcIndex = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', idx);
  requestAnimationFrame(() => e.target.classList.add('dragging'));
}
function onBlockDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.block.drag-over').forEach(el => el.classList.remove('drag-over'));
  dragSrcIndex = null;
}
function onBlockDragOver(e, idx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const el = document.getElementById('block-' + idx);
  if (idx !== dragSrcIndex && el) el.classList.add('drag-over');
}
function onBlockDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function onBlockDrop(e, targetIdx) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (dragSrcIndex === null || dragSrcIndex === targetIdx) return;
  const [moved] = blocks.splice(dragSrcIndex, 1);
  blocks.splice(targetIdx, 0, moved);
  dragSrcIndex = null;
  renderBlocks(); updateCodePreview();
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════
// CODE GENERATION
// ═══════════════════════════════════════════════════════════════════
function generateCode(bList) {
  return bList.map(b => blockToCode(b)).filter(Boolean).join('\n\n');
}

function blockToCode(b, indent = '    ') {
  switch (b.type) {
    case 'narration':
      return `${indent}"${escRpy(b.text)}"`;

    case 'dialogue': {
      const charId = b.character || '';
      // FIX: character-specific expression — use charId instead of hardcoded "Paul"
      const exprCharId = b.exprTag || getExpressionCharId(charId);
      const expStr = b.expression ? ` ${exprCharId} ${b.expression}` : '';
      const txt = b.thought ? `{i}<<${escRpy(b.text)}>>{/i}` : escRpy(b.text);
      return `${indent}${charId}${expStr} "${txt}"`;
    }

    case 'show': {
      let s = `${indent}show ${b.image}${buildAtClause(b)}`;
      if (b.behind) s += ` behind ${b.behind}`;
      if (b.transition) s += ` with ${b.transition}`;
      return s;
    }

    case 'show_multi': {
      if (!b.sprites || !b.sprites.length) return '';
      const lines = b.sprites.map(sp => {
        let s = `${indent}show ${sp.image}${buildAtClause(sp)}`;
        if (sp.behind) s += ` behind ${sp.behind}`;
        return s;
      });
      if (b.transition) lines.push(`${indent}with ${b.transition}`);
      return lines.join('\n');
    }

    case 'hide': {
      let s = `${indent}hide ${b.image}`;
      if (b.transition) s += `\n${indent}with ${b.transition}`;
      return s;
    }

    case 'hide_multi': {
      if (!b.sprites || !b.sprites.length) return '';
      const lines = b.sprites.map(sp => `${indent}hide ${sp.image}`);
      if (b.transition) lines.push(`${indent}with ${b.transition}`);
      return lines.join('\n');
    }

    case 'scene': {
      let s = `${indent}scene ${b.background}${buildAtClause(b)}`;
      if (b.transition) s += ` with ${b.transition}`;
      return s;
    }

    case 'solid': {
      let s = `${indent}show expression Solid("${b.color}") as ${b.name}`;
      if (b.transition) s += ` with ${b.transition}`;
      return s;
    }

    case 'label':
      return `\nlabel ${b.name}:`;

    case 'menu': {
      if (!b.choices || !b.choices.length) return `${indent}menu:\n${indent}    pass`;
      const lines = [];
      // show_character_choice before menu
      if (b.showCharacterChoice && b.choiceCharacter) {
        lines.push(`${indent}call show_character_choice("${escRpy(b.choiceCharacter)}")`);
      }
      // Choice position: left = thought bubble style
      if (b.choicePosition === 'left') {
        lines.push(`${indent}call set_choice_position("left")`);
      }
      lines.push(`${indent}menu:`);
      const choiceLines = b.choices.map(ch => {
        let block = `\n${indent}    "${escRpy(ch.text)}":\n`;
        const helperPrefix = [];
        if (b.showCharacterChoice && b.choiceCharacter) {
          helperPrefix.push(`${indent}        call hide_character_choice()`);
        }
        if (b.choicePosition === 'left') {
          helperPrefix.push(`${indent}        call set_choice_position("center")`);
        }
        if (helperPrefix.length) {
          block += helperPrefix.join('\n') + '\n';
        }
        if (ch.action === 'jump' && ch.jump) {
          block += `${indent}        jump ${ch.jump}\n`;
        } else if (ch.action === 'call' && ch.jump) {
          block += `${indent}        call ${ch.jump}\n`;
        } else if (ch.action === 'code' && ch.code) {
          block += ch.code.split('\n').map(l => `${indent}        ${l}`).join('\n') + '\n';
        } else if (ch.action === 'blocks' && ch.blocks && ch.blocks.length) {
          const innerIndent = indent + '        ';
          block += ch.blocks.map(ib => blockToCode(ib, innerIndent)).filter(Boolean).join('\n\n') + '\n';
        } else {
          block += `${indent}        pass\n`;
        }
        return block;
      });
      lines.push(choiceLines.join(''));
      return lines.join('\n');
    }

    case 'condition': {
      const cond = (b.condition || '').trim();
      if (!cond) return '';
      const lines = [`${indent}if ${cond}:`];
      if (b.blocks && b.blocks.length) {
        const innerIndent = indent + '    ';
        lines.push(b.blocks.map(ib => blockToCode(ib, innerIndent)).filter(Boolean).join('\n\n'));
      } else {
        lines.push(`${indent}    pass`);
      }
      if (b.elifBlocks && b.elifBlocks.length) {
        const innerIndent = indent + '    ';
        b.elifBlocks.forEach(eb => {
          const elifCond = (eb.condition || '').trim();
          if (!elifCond) return;
          lines.push(`${indent}elif ${elifCond}:`);
          if (eb.blocks && eb.blocks.length) {
            lines.push(eb.blocks.map(ib => blockToCode(ib, innerIndent)).filter(Boolean).join('\n\n'));
          } else {
            lines.push(`${indent}    pass`);
          }
        });
      }
      if (b.hasElse) {
        lines.push(`${indent}else:`);
        if (b.elseBlocks && b.elseBlocks.length) {
          const elseIndent = indent + '    ';
          lines.push(b.elseBlocks.map(ib => blockToCode(ib, elseIndent)).filter(Boolean).join('\n\n'));
        } else {
          lines.push(`${indent}    pass`);
        }
      }
      return lines.join('\n');
    }

    case 'pause':
      return b.duration ? `${indent}pause ${b.duration}` : `${indent}pause`;

    case 'music':
      if (b.action === 'stop') return `${indent}stop music`;
      if (b.action === 'play') {
        let s = `${indent}play music "${b.file}"`;
        if (!b.loop) s += ' noloop';
        return s;
      }
      return `${indent}queue music "${b.file}"`;

    case 'jump':
      return `${indent}jump ${b.label}`;

    case 'call':
      return `${indent}call ${b.label}`;

    case 'comment':
      return `${indent}# ${b.text}`;

    case 'custom':
      return (b.code || '').split('\n').map(l => `${indent}${l}`).join('\n');

    default: return '';
  }
}

// " at <position>, xflip, blur" for the transforms enabled in a show/scene block
function buildAtClause(b) {
  const parts = [];
  if (b.position) parts.push(b.position);
  if (b.flipH) parts.push('xflip');
  if (b.blur) parts.push('blur');
  return parts.length ? ` at ${parts.join(', ')}` : '';
}

// Split an "at" list into { position, flipH, blur }
function parseAtClause(atPart) {
  const res = { position: '', flipH: false, blur: false };
  for (const p of (atPart || '').split(',').map(s => s.trim()).filter(Boolean)) {
    if (p === 'xflip') res.flipH = true;
    else if (p === 'blur') res.blur = true;
    else res.position = p;
  }
  return res;
}

// FIX: % → %% in dialogue text
function escRpy(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/%/g, '%%');
}

// Get the image tag used for side expressions (image = "X" in the Character define)
function getExpressionCharId(charId) {
  const chr = data.characters.find(c => c.id === charId);
  return chr?.imageAttr || charId;
}

// ═══════════════════════════════════════════════════════════════════
// CODE PREVIEW
// ═══════════════════════════════════════════════════════════════════
function highlightRenpyCode(text) {
  if (!text) return '';
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  const tokenRegex = /(#.*)|(".*?"|'.*?')|^(\s*\$\s+)(.*)|\b(label|jump|call|scene|show|hide|window|play|stop|return|menu|if|elif|else|pass|init|python|image|define|default|transform|with|pause|voice)\b|\b(\d+(\.\d+)?)\b/gm;

  html = html.replace(tokenRegex, function(match, isComment, isString, isPythonDollar, isPythonBody, isKeyword, isNumber) {
    if (isComment)   return `<span class="hl-comment">${isComment}</span>`;
    if (isString)    return `<span class="hl-string">${isString}</span>`;
    if (isPythonDollar) return `<span class="hl-keyword">${isPythonDollar}</span><span class="hl-python">${isPythonBody}</span>`;
    if (isKeyword)   return `<span class="hl-keyword">${isKeyword}</span>`;
    if (isNumber)    return `<span class="hl-number">${isNumber}</span>`;
    return match;
  });

  // Color especial para el nombre del label: "label nombre:"
  html = html.replace(/(<span class="hl-keyword">label<\/span>\s+)([a-zA-Z0-9_]+)/g, '$1<span class="hl-function">$2</span>');

  return html;
}

function getCollapsedScriptText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let out = [];
  let inLabel = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^label\s+[a-zA-Z0-9_]+/.test(line)) {
      out.push(line.replace(/\s+$/, '') + ' ...');
      inLabel = true;
    } else if (inLabel) {
      if (line.trim() !== '' && !/^[ \t]/.test(line)) {
        inLabel = false;
        if (/^label\s+[a-zA-Z0-9_]+/.test(line)) {
          out.push(line.replace(/\s+$/, '') + ' ...');
          inLabel = true;
        } else {
          out.push(line);
        }
      }
    } else {
      out.push(line);
    }
  }
  return out.join('\n');
}

function getGeneratedPreviewText() {
  const sel = document.getElementById('target-label');
  const isTargetSelected = sel && sel.value !== '';
  if (blocks.length === 0 && !isTargetSelected) {
    return getCollapsedScriptText(activeScriptText) || t('no_blocks');
  }
  return generateCode(blocks) || t('no_blocks');
}

function getCodePreviewText() {
  return codePreviewHasManual ? codePreviewManualText : getGeneratedPreviewText();
}

function resetManualCodePreview() {
  codePreviewHasManual = false;
  codePreviewManualText = '';
  if (codePreviewIsEditing) {
    codePreviewIsEditing = false;
    const el = document.getElementById('code-preview');
    if (el) el.classList.remove('editing');
  }
}

function updateCodePreview() {
  const generated = getGeneratedPreviewText();
  if (!codePreviewIsEditing && codePreviewHasManual && generated !== lastGeneratedPreviewText) {
    resetManualCodePreview();
  }
  lastGeneratedPreviewText = generated;
  if (codePreviewIsEditing && codePreviewHasManual) return;
  const code = getCodePreviewText();
  document.getElementById('code-preview').innerHTML = highlightRenpyCode(code);
}

function enterCodePreviewEdit() {
  if (codePreviewIsEditing) return;
  const el = document.getElementById('code-preview');
  codePreviewIsEditing = true;
  el.classList.add('editing');
  codePreviewDirty = false;
  codePreviewUndoStack = [{ text: getCodePreviewText(), caret: getCaretOffsetWithin(el) }];
  codePreviewRedoStack = [];
}

function syncManualCodePreview() {
  const el = document.getElementById('code-preview');
  const plain = (el.textContent || '').replace(/\r\n/g, '\n');
  codePreviewManualText = plain;
  codePreviewHasManual = true;
}

function exitCodePreviewEdit() {
  if (!codePreviewIsEditing) return;
  if (codePreviewDirty) syncManualCodePreview();
  codePreviewIsEditing = false;
  document.getElementById('code-preview').classList.remove('editing');
  updateCodePreview();
  codePreviewUndoStack = [];
  codePreviewRedoStack = [];
  codePreviewDirty = false;
}

function insertTextAtCursor(text) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function getCaretOffsetWithin(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.endContainer)) return 0;
  const preRange = range.cloneRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
}

function setCaretOffsetWithin(el, offset) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let node = walker.nextNode();
  let count = 0;
  while (node) {
    const nextCount = count + node.textContent.length;
    if (offset <= nextCount) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(node, Math.max(0, offset - count));
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    count = nextCount;
    node = walker.nextNode();
  }
}

function getCurrentLineIndent(el) {
  const text = (el.textContent || '').replace(/\r\n/g, '\n');
  const caretOffset = getCaretOffsetWithin(el);
  const lineStart = text.lastIndexOf('\n', Math.max(0, caretOffset - 1)) + 1;
  const line = text.slice(lineStart, caretOffset);
  const match = line.match(/^[ \t]*/);
  return match ? match[0] : '';
}

function refreshEditingHighlight() {
  if (codePreviewIsSyncing) return;
  const el = document.getElementById('code-preview');
  const caretOffset = getCaretOffsetWithin(el);
  const plain = (el.textContent || '').replace(/\r\n/g, '\n');
  codePreviewIsSyncing = true;
  el.innerHTML = highlightRenpyCode(plain);
  setCaretOffsetWithin(el, caretOffset);
  codePreviewIsSyncing = false;
}

function scheduleEditingHighlight() {
  if (codePreviewRefreshTimer) clearTimeout(codePreviewRefreshTimer);
  codePreviewRefreshTimer = setTimeout(() => {
    refreshEditingHighlight();
    codePreviewRefreshTimer = null;
  }, 80);
}

function pushUndoState() {
  const el = document.getElementById('code-preview');
  if (!el) return;
  const text = (el.textContent || '').replace(/\r\n/g, '\n');
  const caret = getCaretOffsetWithin(el);
  const last = codePreviewUndoStack[codePreviewUndoStack.length - 1];
  if (!last || last.text !== text) {
    codePreviewUndoStack.push({ text, caret });
    if (codePreviewUndoStack.length > 200) codePreviewUndoStack.shift();
    codePreviewRedoStack = [];
  }
}

function applyUndoRedoState(state) {
  const el = document.getElementById('code-preview');
  if (!el) return;
  codePreviewIsSyncing = true;
  el.innerHTML = highlightRenpyCode(state.text);
  setCaretOffsetWithin(el, Math.min(state.caret, state.text.length));
  codePreviewIsSyncing = false;
  codePreviewManualText = state.text;
  codePreviewHasManual = true;
}

function undoCodePreview() {
  if (codePreviewUndoStack.length <= 1) return;
  const current = codePreviewUndoStack.pop();
  codePreviewRedoStack.push(current);
  const prev = codePreviewUndoStack[codePreviewUndoStack.length - 1];
  applyUndoRedoState(prev);
  scheduleBlocksFromManualText();
}

function redoCodePreview() {
  if (!codePreviewRedoStack.length) return;
  const next = codePreviewRedoStack.pop();
  codePreviewUndoStack.push(next);
  applyUndoRedoState(next);
  scheduleBlocksFromManualText();
}

function updateBlocksFromManualText() {
  if (!codePreviewHasManual) return;
  const raw = (codePreviewManualText || '').replace(/\r\n/g, '\n');
  if (!raw.trim()) {
    blocks = [];
  } else {
    blocks = parseLabelContentToBlocks(raw);
  }
  renderBlocks();
}

function scheduleBlocksFromManualText() {
  if (codePreviewBlocksTimer) clearTimeout(codePreviewBlocksTimer);
  codePreviewBlocksTimer = setTimeout(() => {
    updateBlocksFromManualText();
    codePreviewBlocksTimer = null;
  }, 200);
}

async function copyCode() {
  const code = codePreviewHasManual ? codePreviewManualText : generateCode(blocks);
  await navigator.clipboard.writeText(code);
  notify(t('code_copied'), 'ok');
}

function findInsertPosition(scriptText, labelName) {
  if (!labelName) return scriptText.length;
  const labelRe = new RegExp('^label\\s+' + labelName + '\\s*:', 'm');
  const match = labelRe.exec(scriptText);
  if (!match) return scriptText.length;
  const searchFrom = match.index + match[0].length;
  const nextLabelRe = /^label\s+\w+\s*:/gm;
  nextLabelRe.lastIndex = searchFrom;
  const nextMatch = nextLabelRe.exec(scriptText);
  const labelEnd = nextMatch ? nextMatch.index : scriptText.length;
  const labelContent = scriptText.slice(searchFrom, labelEnd);
  const returnRe = /^[ \t]+return[ \t]*$/gm;
  let lastReturn = null, m2;
  while ((m2 = returnRe.exec(labelContent)) !== null) lastReturn = m2;
  if (lastReturn) return searchFrom + lastReturn.index;
  return labelEnd;
}

function buildModifiedScript(existing, newCode) {
  const labelName = (document.getElementById('target-label')?.value || '').trim();
  if (!labelName) {
    return existing.replace(/\n+$/, '') + '\n\n' + newCode + '\n';
  }
  const labelRe = new RegExp('^label\\s+' + labelName + '\\s*:', 'm');
  const match = labelRe.exec(existing);
  if (!match) {
    return existing.replace(/\n+$/, '') + '\n\n' + newCode + '\n';
  }
  const contentStart = match.index + match[0].length;
  const nextLabelRe = /^label\s+\w+\s*:/gm;
  nextLabelRe.lastIndex = contentStart;
  const nextMatch = nextLabelRe.exec(existing);
  const labelEnd = nextMatch ? nextMatch.index : existing.length;
  const before = existing.slice(0, contentStart);
  const after = existing.slice(labelEnd).replace(/^\n+/, '');
  const needsReturn = !/\breturn\b/.test(newCode.split('\n').pop() || '');
  const returnLine = needsReturn ? '\n\n    return\n' : '\n';
  return before + '\n' + newCode + returnLine + '\n' + after;
}

async function appendToScript() {
  if (!gamePath) { notify(t('open_project_first'), 'err'); return; }
  const codeText = codePreviewHasManual ? codePreviewManualText : generateCode(blocks);
  if (!codeText.trim()) { notify(t('no_blocks_to_save'), 'err'); return; }

  const labelName = (document.getElementById('target-label')?.value || '').trim();
  if (labelName) {
    if (!await showConfirm(t('overwrite_label', labelName), { type: 'warning' })) return;
  }

  const newCode = codeText;
  const existing = await getScriptText() || '';
  const modified = buildModifiedScript(existing, newCode);

  const ok = await window.api.writeFile(activeRpyFile, modified);
  if (ok) {
    const where = labelName ? t('overwritten_in', labelName) : t('appended_to_end');
    notify(t('save_ok', where), 'ok');

    // Re-seleccionar automaticamente la carpeta actual (sin dialogo)
    // para reproducir la reinicializacion que evita el bloqueo.
    const result = await window.api.reselectProjectFolder();
    if (!result) return;
    gamePath = result;
    await loadProjectData();
    renderAssetBrowser();
    renderBlocks();
    updateCodePreview();
    setStatus(gamePath, 'ok');
  } else {
    notify(t('save_error', 'write failed'), 'err');
  }
}

function refreshLabelSelector() {
  const sel = document.getElementById('target-label');
  if (!sel) return;
  const current = sel.value;
  const allLabels = [...new Set(data.labels)];
  sel.innerHTML = `<option value="">${t('end_of_file')}</option>` +
    allLabels.map(l => `<option value="${l}" ${l===current?'selected':''}>${l}</option>`).join('');
  sel.dataset.prev = sel.value;
}

// ═══════════════════════════════════════════════════════════════════
// LABEL CONTENT PARSING
// ═══════════════════════════════════════════════════════════════════
function extractLabelContent(scriptText, labelName) {
  const labelRe = new RegExp('^label\\s+' + labelName + '\\s*:', 'm');
  const match = labelRe.exec(scriptText);
  if (!match) return null;
  const searchFrom = match.index + match[0].length;
  const nextLabelRe = /^label\s+\w+\s*:/gm;
  nextLabelRe.lastIndex = searchFrom;
  const nextMatch = nextLabelRe.exec(scriptText);
  const labelEnd = nextMatch ? nextMatch.index : scriptText.length;
  return scriptText.slice(searchFrom, labelEnd).replace(/\n+$/, '');
}

function unescRpy(s) { return (s || '').replace(/\\"/g, '"').replace(/\\\\/g, '\\'); }

function parseLabelContentToBlocks(labelText) {
  const lines = labelText.split('\n');
  const result = [];
  let i = 0;
  let _pendingMenuContext = null;

  while (i < lines.length) {
    let raw = lines[i];
    let trimmed = raw.trim();
    if (!trimmed) { i++; continue; }

    // Comment
    if (trimmed.startsWith('#')) {
      result.push({ type: 'comment', text: trimmed.slice(1).trim() });
      i++; continue;
    }

    // Label
    const labelM = trimmed.match(/^label\s+(\w+)\s*:$/);
    if (labelM) { result.push({ type: 'label', name: labelM[1] }); i++; continue; }

    // Scene
    const sceneM = trimmed.match(/^scene\s+(.+?)(?:\s+at\s+(.+?))?(?:\s+with\s+(\w+))?$/);
    if (sceneM) {
      const at = parseAtClause(sceneM[2]);
      const scene = { type: 'scene', background: sceneM[1], transition: sceneM[3] || '' };
      if (at.blur) scene.blur = true;
      // Keep other transforms in the name so they aren't lost
      const extra = sceneM[2] ? sceneM[2].split(',').map(s => s.trim()).filter(p => p && p !== 'blur') : [];
      if (extra.length) scene.background += ' at ' + extra.join(', ');
      result.push(scene);
      i++; continue;
    }

    // Solid: show expression Solid("#000B") as name
    const solidM = trimmed.match(/^show\s+expression\s+Solid\(\s*"(#[0-9A-Fa-f]{3,8})"\s*\)\s+as\s+(\w+)(?:\s+with\s+(\w+))?$/);
    if (solidM) {
      let transition = solidM[3] || '';
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      const withM = !transition && j < lines.length ? lines[j].trim().match(/^with\s+(\w+)$/) : null;
      if (withM) { transition = withM[1]; i = j; }
      result.push({ type: 'solid', color: solidM[1], name: solidM[2], transition });
      i++; continue;
    }

    // Show
    const showM = trimmed.match(/^show\s+(.+?)(?:\s+at\s+(.+?))?(?:\s+behind\s+(\w+))?(?:\s+with\s+(\w+))?$/);
    if (showM) {
      const imgName = showM[1];
      const atPart = showM[2] || '';
      const behind = showM[3] || '';
      const transition = showM[4] || '';
      const { position, flipH, blur } = parseAtClause(atPart);
      let j = i + 1;
      const showGroup = [{ image: imgName, position, behind, flipH, blur }];
      let multiTrans = transition;
      while (j < lines.length) {
        const nextTrimmed = lines[j].trim();
        if (!nextTrimmed) { j++; continue; }
        const nextShow = nextTrimmed.match(/^show\s+(.+?)(?:\s+at\s+(.+?))?(?:\s+behind\s+(\w+))?$/);
        if (nextShow) {
          const nat = parseAtClause(nextShow[2]);
          showGroup.push({ image: nextShow[1], position: nat.position, behind: nextShow[3] || '', flipH: nat.flipH, blur: nat.blur });
          j++;
        } else {
          const withM = nextTrimmed.match(/^with\s+(\w+)$/);
          if (withM) { multiTrans = withM[1]; j++; }
          break;
        }
      }
      if (showGroup.length > 1) {
        result.push({ type: 'show_multi', sprites: showGroup, transition: multiTrans });
        i = j; continue;
      } else {
        if (!transition && multiTrans) showGroup[0].transition = multiTrans;
        result.push({ type: 'show', ...showGroup[0], transition: transition || multiTrans || '' });
        i = j; continue;
      }
    }

    // Hide
    const hideM = trimmed.match(/^hide\s+(.+?)(?:\s+with\s+(\w+))?$/);
    if (hideM && !trimmed.startsWith('hide screen')) {
      let j = i + 1;
      const hideGroup = [{ image: hideM[1] }];
      let hideTrans = hideM[2] || '';
      while (j < lines.length) {
        const nextTrimmed = lines[j].trim();
        if (!nextTrimmed) { j++; continue; }
        const nextHide = nextTrimmed.match(/^hide\s+(.+?)(?:\s+with\s+(\w+))?$/);
        if (nextHide && !nextTrimmed.startsWith('hide screen')) {
          hideGroup.push({ image: nextHide[1] });
          if (nextHide[2]) hideTrans = nextHide[2];
          j++;
        } else {
          const withM = nextTrimmed.match(/^with\s+(\w+)$/);
          if (withM) { hideTrans = withM[1]; j++; }
          break;
        }
      }
      if (hideGroup.length > 1) {
        result.push({ type: 'hide_multi', sprites: hideGroup, transition: hideTrans });
        i = j; continue;
      } else {
        result.push({ type: 'hide', image: hideM[1], transition: hideTrans });
        i = j; continue;
      }
    }

    // Pause
    const pauseM = trimmed.match(/^pause(?:\s+(\d+(?:\.\d+)?))?$/);
    if (pauseM) { result.push({ type: 'pause', duration: pauseM[1] || '' }); i++; continue; }

    // Music
    const playM = trimmed.match(/^play\s+music\s+"([^"]+)"(.*)$/);
    if (playM) { result.push({ type: 'music', action: 'play', file: playM[1], loop: !/noloop/i.test(playM[2]) }); i++; continue; }
    if (trimmed === 'stop music') { result.push({ type: 'music', action: 'stop', file: '' }); i++; continue; }
    const queueM = trimmed.match(/^queue\s+music\s+"([^"]+)"$/);
    if (queueM) { result.push({ type: 'music', action: 'queue', file: queueM[1] }); i++; continue; }

    // Jump
    const jumpM = trimmed.match(/^jump\s+(\w+)$/);
    if (jumpM) { result.push({ type: 'jump', label: jumpM[1] }); i++; continue; }

    // Call
    const callM = trimmed.match(/^call\s+(\w+)$/);
    if (callM) { result.push({ type: 'call', label: callM[1] }); i++; continue; }

    // Menu (with optional show_character_choice / set_choice_position context)
    // Detect call show_character_choice("CharId") or $ show_character_choice("CharId") before menu
    const showCharChoiceM = trimmed.match(/^(?:call|\\$)\s*show_character_choice\(\s*"([^"]+)"\s*\)$/);
    if (showCharChoiceM) {
      // Peek ahead for set_choice_position and menu:
      let menuCharacter = showCharChoiceM[1];
      let choicePosition = 'center';
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) {
        const posM = lines[j].trim().match(/^(?:call|\\$)\s*set_choice_position\(\s*"([^"]+)"\s*\)$/);
        if (posM) { choicePosition = posM[1]; j++; }
      }
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length && lines[j].trim() === 'menu:') {
        i = j;
        raw = lines[i];
        trimmed = raw.trim();
        _pendingMenuContext = { showCharacterChoice: true, choiceCharacter: menuCharacter, choicePosition };
        // Fall through to 'menu:' parsing below
      } else {
        result.push({ type: 'custom', code: trimmed }); i++; continue;
      }
    }

    // Detect call set_choice_position("left") or $ set_choice_position("left") before menu (without show_character_choice)
    const setPosM = trimmed.match(/^(?:call|\\$)\s*set_choice_position\(\s*"([^"]+)"\s*\)$/);
    if (setPosM && !showCharChoiceM) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length && lines[j].trim() === 'menu:') {
        _pendingMenuContext = { choicePosition: setPosM[1] };
        i = j;
        raw = lines[i];
        trimmed = raw.trim();
        // Fall through to 'menu:' parsing below
      } else {
        result.push({ type: 'custom', code: trimmed }); i++; continue;
      }
    }

    if (trimmed === 'menu:') {
      const choices = [];
      const menuIndent = raw.match(/^(\s*)/)[1].length;
      const choiceIndent = menuIndent + 4;
      i++;
      while (i < lines.length) {
        const mLine = lines[i];
        const mTrimmed = mLine.trim();
        if (!mTrimmed) { i++; continue; }
        const choiceM = mTrimmed.match(/^"([^"]*)":\s*$/);
        if (!choiceM) break;
        const choiceText = unescRpy(choiceM[1]);
        const bodyIndent = choiceIndent + 4;
        const choiceBodyLines = [];
        i++;
        while (i < lines.length) {
          const bLine = lines[i];
          const bTrimmed = bLine.trim();
          if (!bTrimmed) { choiceBodyLines.push(''); i++; continue; }
          const bIndent = bLine.match(/^(\s*)/)[1].length;
          if (bIndent >= bodyIndent) { choiceBodyLines.push(bLine); i++; } else break;
        }

        // Ignore helper calls auto-generated at the beginning of each choice body.
        const normalizedChoiceBodyLines = [...choiceBodyLines];
        while (normalizedChoiceBodyLines.length) {
          const firstTrimmed = normalizedChoiceBodyLines[0].trim();
          if (!firstTrimmed) { normalizedChoiceBodyLines.shift(); continue; }
          if (/^(?:call|\$)\s*hide_character_choice\(\)\s*$/.test(firstTrimmed) ||
              /^(?:call|\$)\s*set_choice_position\(\s*"center"\s*\)\s*$/.test(firstTrimmed)) {
            normalizedChoiceBodyLines.shift();
            continue;
          }
          break;
        }

        let action = 'pass', jump = '', code = '', choiceBlocks = [];
        const bodyText = normalizedChoiceBodyLines.join('\n').trim();
        if (!bodyText || bodyText === 'pass') {
          action = 'pass';
        } else if (normalizedChoiceBodyLines.filter(l => l.trim()).length === 1) {
          const onlyLine = bodyText;
          const jumpM2 = onlyLine.match(/^jump\s+(\w+)$/);
          const callM2 = onlyLine.match(/^call\s+(\w+)/);
          if (jumpM2) { action = 'jump'; jump = jumpM2[1]; }
          else if (callM2) { action = 'call'; jump = callM2[1]; }
          else {
            const parsed = parseLabelContentToBlocks(normalizedChoiceBodyLines.join('\n'));
            if (parsed.length) { action = 'blocks'; choiceBlocks = parsed; }
            else { action = 'code'; code = bodyText; }
          }
        } else {
          const parsed = parseLabelContentToBlocks(normalizedChoiceBodyLines.join('\n'));
          if (parsed.length) { action = 'blocks'; choiceBlocks = parsed; }
          else { action = 'code'; code = bodyText; }
        }
        choices.push({ text: choiceText, action, jump, code, blocks: choiceBlocks });
      }
      const menuBlock = { type: 'menu', choices };
      // Apply context from show_character_choice / set_choice_position
      if (_pendingMenuContext) {
        if (_pendingMenuContext.showCharacterChoice) {
          menuBlock.showCharacterChoice = true;
          menuBlock.choiceCharacter = _pendingMenuContext.choiceCharacter || '';
        }
        menuBlock.choicePosition = _pendingMenuContext.choicePosition || 'center';
        _pendingMenuContext = null;
      }
      // Skip trailing hide_character_choice() and set_choice_position("center")
      while (i < lines.length) {
        const nextTrimmed = lines[i]?.trim();
        if (!nextTrimmed) { i++; continue; }
        if (/^(?:call|\$)\s*hide_character_choice\(\)$/.test(nextTrimmed) ||
            /^(?:call|\$)\s*set_choice_position\(\s*"center"\s*\)$/.test(nextTrimmed)) {
          i++; continue;
        }
        break;
      }
      result.push(menuBlock);
      continue;
    }

    // Condition (if / else)
    const ifM = trimmed.match(/^if\s+(.+)\s*:\s*$/);
    if (ifM) {
      const cond = ifM[1].trim();
      const baseIndent = raw.match(/^(\s*)/)[1].length;
      const collectBranchLines = (startIdx) => {
        const branchLines = [];
        let idx = startIdx;
        while (idx < lines.length) {
          const nextRaw = lines[idx];
          const nextTrimmed = nextRaw.trim();
          if (!nextTrimmed) { branchLines.push(''); idx++; continue; }
          const nextIndent = nextRaw.match(/^(\s*)/)[1].length;
          if (nextIndent <= baseIndent) break;
          const stripIndent = baseIndent + 4;
          if (nextRaw.startsWith(' '.repeat(stripIndent))) {
            branchLines.push(nextRaw.slice(stripIndent));
          } else {
            branchLines.push(nextRaw.trimStart());
          }
          idx++;
        }
        return { branchLines, nextIdx: idx };
      };

      const { branchLines: thenLines, nextIdx: thenEnd } = collectBranchLines(i + 1);
      const thenBlocks = parseLabelContentToBlocks(thenLines.join('\n'));
      const elifBlocks = [];
      let hasElse = false;
      let elseBlocks = [];

      let k = thenEnd;
      while (k < lines.length) {
        while (k < lines.length && !lines[k].trim()) k++;
        if (k >= lines.length) break;
        const branchRaw = lines[k];
        const branchTrimmed = branchRaw.trim();
        const branchIndent = branchRaw.match(/^(\s*)/)[1].length;
        if (branchIndent !== baseIndent) break;

        const elifM = branchTrimmed.match(/^elif\s+(.+)\s*:\s*$/);
        if (elifM) {
          const elifCond = elifM[1].trim();
          const { branchLines, nextIdx } = collectBranchLines(k + 1);
          elifBlocks.push({ condition: elifCond, blocks: parseLabelContentToBlocks(branchLines.join('\n')) });
          k = nextIdx;
          continue;
        }

        if (/^else\s*:\s*$/.test(branchTrimmed)) {
          hasElse = true;
          const { branchLines, nextIdx } = collectBranchLines(k + 1);
          elseBlocks = parseLabelContentToBlocks(branchLines.join('\n'));
          k = nextIdx;
        }
        break;
      }

      result.push({ type: 'condition', condition: cond, blocks: thenBlocks, elifBlocks, hasElse, elseBlocks });
      i = k;
      continue;
    }

    // Narration
    const narrM = trimmed.match(/^"((?:[^"\\]|\\.)*)"$/);
    if (narrM) { result.push({ type: 'narration', text: unescRpy(narrM[1]) }); i++; continue; }

    // Dialogue
    const dlgM = trimmed.match(/^(\w+)(?:\s+(\w+)\s+(\w+))?\s+"((?:[^"\\]|\\.)*)"$/);
    if (dlgM) {
      const text = unescRpy(dlgM[4]);
      let thought = false, cleanText = text;
      const thoughtM = text.match(/^\{i\}<<(.+)>>\{\/i\}$/);
      if (thoughtM) { thought = true; cleanText = thoughtM[1]; }
      const dlg = { type: 'dialogue', character: dlgM[1], expression: dlgM[3] || '', text: cleanText, thought };
      if (dlgM[3]) dlg.exprTag = dlgM[2];
      result.push(dlg);
      i++; continue;
    }

    // Standalone with
    if (/^with\s+\w+$/.test(trimmed)) { i++; continue; }

    // Multi-line blocks
    if (/^(if\s+.+|while\s+.+|for\s+.+|python\s*):/.test(trimmed)) {
      const baseIndent = raw.match(/^(\s*)/)[1].length;
      const blockLines = [trimmed];
      let j = i + 1;
      while (j < lines.length) {
        const nextRaw = lines[j];
        const nextTrimmed = nextRaw.trim();
        if (!nextTrimmed) { blockLines.push(''); j++; continue; }
        const nextIndent = nextRaw.match(/^(\s*)/)[1].length;
        if (nextIndent > baseIndent) { blockLines.push(' '.repeat(nextIndent - baseIndent) + nextTrimmed); j++; }
        else if (nextIndent === baseIndent && /^(elif\s+.+|else\s*):/.test(nextTrimmed)) { blockLines.push(nextTrimmed); j++; }
        else break;
      }
      while (blockLines.length && !blockLines[blockLines.length - 1].trim()) blockLines.pop();
      result.push({ type: 'custom', code: blockLines.join('\n') });
      i = j; continue;
    }

    // Everything else
    result.push({ type: 'custom', code: trimmed });
    i++;
  }
  return result;
}

async function getScriptText() {
  return await window.api.readFile(activeRpyFile) || '';
}

async function onTargetLabelChange() {
  const sel = document.getElementById('target-label');
  const labelName = sel.value;
  resetManualCodePreview();
  if (!labelName) {
    sel.dataset.prev = labelName;
    return;
  }
  if (blocks.length > 0) {
    if (!await showConfirm(t('load_label_confirm', blocks.length, labelName), { type: 'warning' })) {
      sel.value = sel.dataset.prev || '';
      return;
    }
  }

  // Workaround: reselect/reload project when switching labels to avoid input lock state.
  const reselectedPath = await window.api.reselectProjectFolder();
  if (reselectedPath) {
    gamePath = reselectedPath;
    await loadProjectData();
    renderAssetBrowser();
    setStatus(gamePath, 'ok');
  }

  const scriptText = await getScriptText();
  if (!scriptText) {
    notify(t('could_not_read', activeRpyFile), 'err');
    sel.value = sel.dataset.prev || '';
    return;
  }
  const content = extractLabelContent(scriptText, labelName);
  if (content === null) {
    notify(t('label_not_found', labelName), 'err');
    sel.value = sel.dataset.prev || '';
    return;
  }
  const parsed = parseLabelContentToBlocks(content);
  blocks = parsed;
  sel.dataset.prev = labelName;
  renderBlocks(); updateCodePreview();
  notify(t('loaded_blocks', parsed.length, labelName), 'ok');
}

function exportToFile() {
  const code = codePreviewHasManual ? codePreviewManualText : generateCode(blocks);
  if (!code.trim()) { notify(t('no_code_export'), 'err'); return; }
  const blob = new Blob([code], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'script_addition.rpy';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ═══════════════════════════════════════════════════════════════════
// SHOWN SPRITES DETECTION — FIX: also looks inside choice blocks
// ═══════════════════════════════════════════════════════════════════
function getShownSprites(blockList, limit) {
  if (!blockList) blockList = blocks;
  
  if (limit === undefined) {
    if (choiceBlockContext && blockList === blocks) {
      limit = choiceBlockContext.savedEditingIndex >= 0 ? choiceBlockContext.savedEditingIndex : blocks.length;
    } else {
      limit = editingIndex >= 0 ? editingIndex : blockList.length;
    }
  }

  const shown = new Map();
  for (let i = 0; i < limit; i++) {
    const b = blockList[i];
    if (!b) continue;
    if (b.type === 'show' && b.image) shown.set(b.image, b.image);
    else if (b.type === 'solid' && b.name) shown.set(b.name, b.name);
    else if (b.type === 'show_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.set(sp.image, sp.image); });
    else if (b.type === 'hide' && b.image) shown.delete(b.image);
    else if (b.type === 'hide_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.delete(sp.image); });
    else if (b.type === 'scene') shown.clear();
    // FIX: look inside choice blocks
    else if (b.type === 'menu' && b.choices) {
      for (let chIdx = 0; chIdx < b.choices.length; chIdx++) {
        const ch = b.choices[chIdx];
        if (ch.action === 'blocks' && ch.blocks) {
          const innerLimit = ch.blocks.length;
          const innerShown = getShownSprites(ch.blocks, innerLimit);
          // Sprites shown in any choice branch might be visible
          innerShown.forEach(k => shown.set(k, k));
        }
      }
    }
    else if (b.type === 'condition') {
      const thenShown = getShownSprites(b.blocks || [], (b.blocks || []).length);
      thenShown.forEach(k => shown.set(k, k));
      if (b.elifBlocks && b.elifBlocks.length) {
        b.elifBlocks.forEach(eb => {
          const elifShown = getShownSprites(eb.blocks || [], (eb.blocks || []).length);
          elifShown.forEach(k => shown.set(k, k));
        });
      }
      if (b.hasElse && b.elseBlocks) {
        const elseShown = getShownSprites(b.elseBlocks, b.elseBlocks.length);
        elseShown.forEach(k => shown.set(k, k));
      }
    }
  }

  // Si estamos evaluando la lista principal y estamos dentro de un bloque choice,
  // añadir también los sprites del branch actual evaluados hasta el bloque actual.
  if (choiceBlockContext && blockList === blocks) {
    const currentMenuBlock = choiceBlockContext.savedMenuBlock;
    const currentChoice = currentMenuBlock?.choices?.[choiceBlockContext.choiceIdx];
    if (currentChoice && currentChoice.blocks) {
      const innerLimit = choiceBlockContext.blockIdx >= 0 ? choiceBlockContext.blockIdx : currentChoice.blocks.length;
      for (let i = 0; i < innerLimit; i++) {
        const b = currentChoice.blocks[i];
        if (!b) continue;
        if (b.type === 'show' && b.image) shown.set(b.image, b.image);
        else if (b.type === 'solid' && b.name) shown.set(b.name, b.name);
        else if (b.type === 'show_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.set(sp.image, sp.image); });
        else if (b.type === 'hide' && b.image) shown.delete(b.image);
        else if (b.type === 'hide_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.delete(sp.image); });
        else if (b.type === 'scene') shown.clear();
      }
    }
  }

  // Si estamos dentro de un bloque condition, añadir sprites del branch actual
  // evaluados hasta el bloque en edición.
  if (conditionBlockContext && blockList === blocks) {
    const currentConditionBlock = conditionBlockContext.savedConditionBlock;
    const branchBlocks = getConditionBranchBlocks(currentConditionBlock, conditionBlockContext.branch);
    const innerLimit = conditionBlockContext.blockIdx >= 0
      ? conditionBlockContext.blockIdx
      : branchBlocks.length;

    for (let i = 0; i < innerLimit; i++) {
      const b = branchBlocks[i];
      if (!b) continue;
      if (b.type === 'show' && b.image) shown.set(b.image, b.image);
      else if (b.type === 'solid' && b.name) shown.set(b.name, b.name);
      else if (b.type === 'show_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.set(sp.image, sp.image); });
      else if (b.type === 'hide' && b.image) shown.delete(b.image);
      else if (b.type === 'hide_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.delete(sp.image); });
      else if (b.type === 'scene') shown.clear();
    }
  }

  return [...shown.values()];
}

// ═══════════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════════
let pendingBlock = {};

function openModal(type, existing) {
  if (audioPreviewFile) stopAudioPreview();
  pendingBlock = existing ? { ...existing } : { type };
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const modalBox = document.getElementById('modal-box');

  const meta = BLOCK_META[type] || { icon: '?', labelKey: type };
  title.textContent = `${meta.icon} ${existing ? t('edit') : t('add')}: ${t(meta.labelKey)}`;
  body.innerHTML = buildModalBody(type, pendingBlock);
  overlay.classList.add('open');

  // Aplicar clase narrow para modales estrechos
  if (['label', 'call', 'jump', 'pause'].includes(type)) {
    modalBox.classList.add('modal-narrow');
  } else {
    modalBox.classList.remove('modal-narrow');
  }

  // Aplicar clase tall para modales altos
  if (type === 'scene') {
    modalBox.classList.add('modal-tall');
  } else {
    modalBox.classList.remove('modal-tall');
  }

  // Post-render tasks
  if (type === 'dialogue' || type === 'show') {
    setTimeout(() => populateCharSelect(type, pendingBlock), 50);
  }
  if (type === 'dialogue') {
    setTimeout(() => populateExpressionPicker(pendingBlock.character, pendingBlock.expression), 50);
  }
  if (type === 'show_multi') {
    const sprites = pendingBlock.sprites || [{}];
    sprites.forEach((sp, i) => setTimeout(() => populateSMPicker('sm', i, sp.image), 50));
  }
  if (type === 'hide_multi') {
    const sprites = pendingBlock.sprites || [{}];
    sprites.forEach((sp, i) => setTimeout(() => populateHMPicker(i, sp.image), 50));
    setTimeout(() => populateHMShownSprites(pendingBlock.sprites), 50);
  }
  if (type === 'hide') {
    setTimeout(() => populateShownSpritesPicker(pendingBlock.image), 50);
  }
  if (type === 'scene') {
    setTimeout(() => initializeScenePicker(pendingBlock.background), 50);
  }
  if (type === 'music') {
    renderAudioList();
    refreshAudioFiles();
  }
  if (type === 'solid') updateSolidPreview();
  if (type === 'menu') {
    setTimeout(() => {
      const sprite = pendingBlock.choiceCharacter || '';
      if (sprite) {
        const chr = data.characters.find(c => c.images.some(im => im.key === sprite));
        if (chr) {
          const sel = document.getElementById('f-menu-char');
          if (sel) sel.value = chr.id;
          populateMenuSpritePicker(chr.id, sprite);
        }
      }
    }, 50);
  }
  if (type === 'condition') {
    setTimeout(() => {
      renderConditionBlocks('then');
      renderAllElifBlocks();
      renderConditionBlocks('else');
    }, 50);
  }
}

let choiceBlockContext = null;
let conditionBlockContext = null;

function restoreMenuPosition(choiceIdx, savedMenuScrollTop, savedChoiceBlocksScrollTop, savedChoiceBlocksAtBottom) {
  const restoreGeneralScroll = () => {
    const modalBox = document.getElementById('modal-box');
    if (modalBox) modalBox.scrollTop = savedMenuScrollTop || 0;
  };

  // Primer intento inmediato.
  setTimeout(() => {
    restoreGeneralScroll();

    const choiceEl = document.getElementById('choice-' + choiceIdx);
    if (choiceEl) {
      choiceEl.classList.add('choice-focus');
      setTimeout(() => choiceEl.classList.remove('choice-focus'), 900);
    }

    const textInput = document.getElementById('ct-' + choiceIdx);
    if (textInput) textInput.focus({ preventScroll: true });
  }, 0);

  // Segundo intento tras el render tardio de bloques para fijar el scroll correcto.
  setTimeout(() => {
    restoreGeneralScroll();
    const choiceBlocksList = document.getElementById('cbl-' + choiceIdx);
    if (choiceBlocksList) {
      if (savedChoiceBlocksAtBottom) choiceBlocksList.scrollTop = choiceBlocksList.scrollHeight;
      else choiceBlocksList.scrollTop = savedChoiceBlocksScrollTop || 0;
    }
  }, 140);
}

function closeModal() {
  if (audioPreviewFile) stopAudioPreview();
  document.getElementById('modal-overlay').classList.remove('open');
  if (conditionBlockContext) {
    const { savedConditionBlock, savedEditingIndex, parentConditionContext, parentChoiceContext, branch, savedConditionScrollTop, savedBranchScrollTop, savedBranchAtBottom } = conditionBlockContext;
    conditionBlockContext = parentConditionContext || null;
    choiceBlockContext = parentChoiceContext || null;
    editingIndex = savedEditingIndex;
    pendingBlock = {};
    openModal('condition', savedConditionBlock);
    restoreConditionPosition(branch, savedConditionScrollTop, savedBranchScrollTop, savedBranchAtBottom);
    return;
  }
  if (choiceBlockContext) {
    const { savedMenuBlock, savedEditingIndex, savedMenuScrollTop, savedChoiceBlocksScrollTop, savedChoiceBlocksAtBottom, choiceIdx, parentChoiceContext, parentConditionContext } = choiceBlockContext;
    choiceBlockContext = parentChoiceContext || null;
    conditionBlockContext = parentConditionContext || null;
    editingIndex = savedEditingIndex;
    pendingBlock = {};
    openModal('menu', savedMenuBlock);
    restoreMenuPosition(choiceIdx, savedMenuScrollTop, savedChoiceBlocksScrollTop, savedChoiceBlocksAtBottom);
    return;
  }
  pendingBlock = {};
}

// ═══════════════════════════════════════════════════════════════════
// SPRITE TYPE SELECTORS — sprites are searched by character and type
// ═══════════════════════════════════════════════════════════════════
const NO_TYPE_SELECTED = '__none__';

// Type to preselect: the preferred one if valid, the only one if there is just one,
// otherwise null (the user has to choose)
function resolveSpriteType(types, preferred) {
  if (preferred !== undefined && preferred !== null && types.includes(preferred)) return preferred;
  return types.length === 1 ? types[0] : null;
}

function fillSpriteTypeSelect(sel, types, selected) {
  if (!sel) return;
  sel.innerHTML = `<option value="${NO_TYPE_SELECTED}" ${selected === null ? 'selected' : ''}>${t('select_type')}</option>` +
    types.map(tp => `<option value="${escHtml(tp)}" ${tp === selected ? 'selected' : ''}>${escHtml(tp || t('no_type'))}</option>`).join('');
  sel.disabled = !types.length;
}

function readSpriteTypeSelect(id) {
  const sel = document.getElementById(id);
  return !sel || sel.value === NO_TYPE_SELECTED ? null : sel.value;
}

function spriteTypeSelectHtml(id, onchange) {
  return `<select class="form-select" id="${id}" onchange="${onchange}" disabled><option value="${NO_TYPE_SELECTED}">${t('select_type')}</option></select>`;
}

function pickerMessage(msg) {
  return `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${msg}</div>`;
}

// Sets up the type select of a picker and returns { type, images } to show.
// images is empty until a type is chosen.
function prepareTypedSpritePicker(typeSelId, chr, selectedImage, preferredType, filterFn) {
  const available = (chr?.images || []).filter(img => !filterFn || filterFn(img));
  const types = [...new Set(available.map(img => getSpriteType(chr, img.key)))];
  const preferred = preferredType !== undefined
    ? preferredType
    : (selectedImage && available.some(im => im.key === selectedImage) ? getSpriteType(chr, selectedImage) : undefined);
  const type = resolveSpriteType(types, preferred);
  fillSpriteTypeSelect(document.getElementById(typeSelId), types, type);
  const images = type === null ? [] : available.filter(img => getSpriteType(chr, img.key) === type);
  return { type, types, images };
}

function spriteLabel(chr, key) {
  return parseSpriteKey(chr.id, key).id;
}

// ═══════════════════════════════════════════════════════════════════
// MODAL BODY BUILDERS
// ═══════════════════════════════════════════════════════════════════

function buildShowMultiBody(b) {
  const sprites = b.sprites || [{ image: '', position: '', flipH: false, behind: '' }];
  // FIX: transition at top
  return `
    <div class="form-group">
      <label class="form-label">${t('joint_transition')}</label>
      ${buildTransitionSelect('sm-trans', b.transition)}
    </div>
    <div style="font-size:11px;color:var(--text2);margin-bottom:10px;">${t('sprites_each_line')}</div>
    <div id="sm-list">
      ${sprites.map((sp, i) => buildSpriteRowHtml(sp, i, 'sm')).join('')}
    </div>
    <button class="btn btn-secondary" style="width:100%;margin-top:6px;" onclick="addSpriteRow('sm')">${t('add_sprite')}</button>`;
}

function buildHideMultiBody(b) {
  const sprites = b.sprites || [{ image: '' }];
  // FIX: transition at top
  return `
    <div class="form-group">
      <label class="form-label">${t('joint_transition')}</label>
      ${buildTransitionSelect('hm-trans', b.transition)}
    </div>
    <div class="form-group">
      <label class="form-label">${t('shown_on_screen')}</label>
      <div id="hm-shown-sprites" class="img-picker"></div>
    </div>
    <div id="hm-list">
      ${sprites.map((sp, i) => buildHideSpriteRowHtml(sp, i)).join('')}
    </div>
    <button class="btn btn-secondary" style="width:100%;margin-top:6px;" onclick="addHideSpriteRow()">${t('add_sprite')}</button>`;
}

function buildSpriteRowHtml(sp, i, prefix) {
  const posOpts = ['', 'left', 'center_left', 'center', 'center_right', 'right', 'truecenter', ...data.animations]
    .map(p => `<option value="${p}" ${sp.position === p ? 'selected' : ''}>${p || t('no_position')}</option>`).join('');
  // FIX: behind shows only visible sprites
  const shownKeys = getShownSprites();
  const behindOpts = ['', ...shownKeys].map(k => `<option value="${k}" ${(sp.behind||'')===k?'selected':''}>${k || t('behind_placeholder')}</option>`).join('');
  return `<div class="choice-item" id="${prefix}-row-${i}">
    <div class="choice-header">
      <span class="choice-number">${t('sprite')} ${i + 1}</span>
      <button class="btn btn-secondary choice-remove" onclick="removeSpriteRow('${prefix}',${i})">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('character')}</label>
        <select class="form-select" id="${prefix}-char-${i}" onchange="onSMCharChange('${prefix}',${i})">${buildCharOptions(sp._charId || '')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">${t('sprite_type')}</label>
        ${spriteTypeSelectHtml(`${prefix}-type-${i}`, `onSMTypeChange('${prefix}',${i})`)}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('select_sprite')}</label>
      <div id="${prefix}-sprite-picker-${i}" class="img-picker"></div>
      <input type="hidden" id="${prefix}-img-${i}" value="${sp.image || ''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('position_at')}</label>
        <select class="form-select" id="${prefix}-pos-${i}">${posOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">${t('behind_label')}</label>
        <select class="form-select" id="${prefix}-beh-${i}">${behindOpts}</select>
      </div>
    </div>
    <div class="radio-group">
      <label class="radio-option"><input type="checkbox" id="${prefix}-flip-${i}" ${sp.flipH ? 'checked' : ''}> ${t('flip_image')}</label>
      <label class="radio-option"><input type="checkbox" id="${prefix}-blur-${i}" ${sp.blur ? 'checked' : ''}> ${t('blur_image')}</label>
    </div>
  </div>`;
}

function onSMCharChange(prefix, i) {
  if (prefix === 'hm') populateHMPicker(i, '');
  else populateSMPicker(prefix, i, '');
}

function onSMTypeChange(prefix, i) {
  const type = readSpriteTypeSelect(`${prefix}-type-${i}`);
  const selected = document.getElementById(`${prefix}-img-${i}`)?.value || '';
  if (prefix === 'hm') populateHMPicker(i, selected, type);
  else populateSMPicker(prefix, i, selected, type);
}

function populateSMPicker(prefix, i, selectedImage, preferredType) {
  const charSel = document.getElementById(`${prefix}-char-${i}`);
  if (!charSel) return;
  if (!charSel.value && selectedImage) {
    const chr = data.characters.find(c => c.images.some(im => im.key === selectedImage));
    if (chr) charSel.value = chr.id;
  }
  const charId = charSel.value || data.characters[0]?.id || '';
  if (charSel.value !== charId) charSel.value = charId;
  const picker = document.getElementById(`${prefix}-sprite-picker-${i}`);
  if (!picker) return;
  const chr = data.characters.find(c => c.id === charId);
  const { type, images } = prepareTypedSpritePicker(`${prefix}-type-${i}`, chr, selectedImage, preferredType);
  if (!chr || !chr.images.length) { picker.innerHTML = pickerMessage(t('no_images')); return; }
  if (type === null) { picker.innerHTML = pickerMessage(t('select_type_first')); return; }
  picker.innerHTML = images.map(img =>
    `<div class="img-option ${img.key === selectedImage ? 'selected' : ''}" onclick="selectSMSprite('${prefix}',${i},'${img.key}')" title="${img.key}" id="${prefix}-spi-${img.key}-${i}">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${spriteLabel(chr, img.key)}</div>
    </div>`).join('');
}

function selectSMSprite(prefix, i, key) {
  const picker = document.getElementById(`${prefix}-sprite-picker-${i}`);
  picker?.querySelectorAll('.img-option').forEach(el => el.classList.remove('selected'));
  document.getElementById(`${prefix}-spi-${key}-${i}`)?.classList.add('selected');
  const inp = document.getElementById(`${prefix}-img-${i}`);
  if (inp) inp.value = key;
}

function buildHideSpriteRowHtml(sp, i) {
  return `<div class="choice-item" id="hm-row-${i}">
    <div class="choice-header">
      <span class="choice-number">${t('sprite')} ${i + 1}</span>
      <button class="btn btn-secondary choice-remove" onclick="removeSpriteRow('hm',${i})">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('character')}</label>
        <select class="form-select" id="hm-char-${i}" onchange="onSMCharChange('hm',${i})">${buildCharOptions(sp._charId || '')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">${t('sprite_type')}</label>
        ${spriteTypeSelectHtml(`hm-type-${i}`, `onSMTypeChange('hm',${i})`)}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('sprite_to_hide')}</label>
      <div id="hm-sprite-picker-${i}" class="img-picker"></div>
      <input type="hidden" id="hm-img-${i}" value="${sp.image || ''}">
    </div>
  </div>`;
}

function addSpriteRow(prefix) {
  const list = document.getElementById(prefix + '-list');
  const i = list.children.length;
  const div = document.createElement('div');
  if (prefix === 'hm') {
    div.innerHTML = buildHideSpriteRowHtml({ image: '' }, i);
  } else {
    div.innerHTML = buildSpriteRowHtml({ image: '', position: '', flipH: false, blur: false, behind: '' }, i, prefix);
  }
  list.appendChild(div.firstElementChild);
  if (prefix === 'hm') setTimeout(() => populateHMPicker(i, ''), 30);
  else setTimeout(() => populateSMPicker(prefix, i, ''), 30);
}

function addHideSpriteRow() { addSpriteRow('hm'); }

function removeSpriteRow(prefix, i) {
  const el = document.getElementById(prefix + '-row-' + i);
  const list = document.getElementById(prefix + '-list');
  if (el && list.children.length > 1) el.remove();
  else notify(t('min_one_sprite'), 'err');
}

function readSpriteRows(prefix, withPos) {
  const list = document.getElementById(prefix + '-list');
  if (!list) return [];
  const sprites = [];
  for (let i = 0; i < list.children.length; i++) {
    const image = document.getElementById(`${prefix}-img-${i}`)?.value.trim() || '';
    if (!image) continue;
    const sp = { image };
    if (withPos) {
      sp.position = document.getElementById(`${prefix}-pos-${i}`)?.value || '';
      sp.behind = document.getElementById(`${prefix}-beh-${i}`)?.value.trim() || '';
      sp.flipH = document.getElementById(`${prefix}-flip-${i}`)?.checked || false;
      sp.blur = document.getElementById(`${prefix}-blur-${i}`)?.checked || false;
    }
    sprites.push(sp);
  }
  return sprites;
}

function buildModalBody(type, b) {
  switch (type) {
    case 'show_multi': return buildShowMultiBody(b);
    case 'hide_multi': return buildHideMultiBody(b);

    case 'narration': return `
      <div class="form-group">
        <label class="form-label">${t('narrator_text')}</label>
        <textarea class="form-textarea" id="f-text" rows="4" spellcheck="true" placeholder="${t('write_narration')}">${b.text || ''}</textarea>
      </div>`;

    case 'dialogue': return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('character')}</label>
          <select class="form-select" id="f-char" onchange="onDialogueCharChange()">${buildCharOptions(b.character)}</select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('sprite_type')}</label>
          ${spriteTypeSelectHtml('f-expr-type', 'onDialogueExprTypeChange()')}
        </div>
        <div class="form-group">
          <label class="form-label">${t('expression_side')}</label>
          <select class="form-select" id="f-expr" onchange="onExpressionSelectChange()"><option value="">${t('no_transition')}</option></select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('expression_preview')}</label>
        <div id="expr-picker" class="img-picker"></div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('dialogue_text')}</label>
        <textarea class="form-textarea" id="f-text" rows="4" spellcheck="true" placeholder="${t('write_dialogue')}">${b.text || ''}</textarea>
      </div>
      <div class="form-group" style="margin-top:4px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text);">
          <input type="checkbox" id="f-thought" ${b.thought ? 'checked' : ''}>
          💭 ${t('is_thought')} <span style="color:var(--text3);font-size:11px;">({i}&lt;&lt;Texto&gt;&gt;{/i})</span>
        </label>
      </div>`;

    case 'show': {
      // FIX: behind shows only visible sprites
      const shownKeys = getShownSprites();
      const behindOpts = ['', ...shownKeys].map(k => `<option value="${k}" ${(b.behind||'')===k?'selected':''}>${k || t('behind_placeholder')}</option>`).join('');
      return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('character')}</label>
          <select class="form-select" id="f-char" onchange="onShowCharChange()">${buildCharOptions(getShowBlockCharId(b))}</select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('sprite_type')}</label>
          ${spriteTypeSelectHtml('f-sprite-type', 'onShowTypeChange()')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('select_sprite')}</label>
        <div id="sprite-picker" class="img-picker"></div>
      </div>
      <input type="hidden" id="f-image" value="${b.image || ''}">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('position_at')}</label>
          <select class="form-select" id="f-pos">
            <option value="">${t('no_position')}</option>
            <optgroup label="${t('standard_positions')}">
              ${['left', 'center_left', 'center', 'center_right', 'right', 'truecenter'].map(p => `<option value="${p}" ${b.position === p ? 'selected' : ''}>${p}</option>`).join('')}
            </optgroup>
            ${data.animations.length ? `<optgroup label="${t('animations_label')}">${data.animations.map(a => `<option value="${a}" ${b.position === a ? 'selected' : ''}>${a}</option>`).join('')}</optgroup>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('transition_with')}</label>
          ${buildTransitionSelect('f-trans', b.transition)}
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('behind_label')}</label>
          <select class="form-select" id="f-behind">${behindOpts}</select>
        </div>
        <div class="form-group" style="align-self:flex-end;">
          <label class="radio-option" style="margin-top:24px;"><input type="checkbox" id="f-flip" ${b.flipH ? 'checked' : ''}> ${t('flip_image')}</label>
          <label class="radio-option" style="margin-top:6px;"><input type="checkbox" id="f-blur" ${b.blur ? 'checked' : ''}> ${t('blur_image')}</label>
        </div>
      </div>`;
    }

    case 'hide': return `
      <div class="form-group">
        <label class="form-label">${t('shown_sprites')}</label>
        <div id="shown-sprites-picker" class="img-picker"></div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('or_write_manually')}</label>
        <input class="form-input" id="f-image" list="dl-images" value="${b.image || ''}" placeholder="Ej: Ryu_hunter_sonrisa">
        <datalist id="dl-images">${getAllImageKeys().map(k => `<option value="${k}">`).join('')}</datalist>
      </div>
      <div class="form-group">
        <label class="form-label">${t('transition_with')}</label>
        ${buildTransitionSelect('f-trans', b.transition)}
      </div>`;

    case 'scene': {
      const selectedSceneAsset = b.background || '';
      return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('transition_with')}</label>
          ${buildTransitionSelect('f-trans', b.transition)}
        </div>
        <div class="form-group" style="align-self:flex-end;">
          <label class="radio-option" style="margin-bottom:10px;"><input type="checkbox" id="f-blur" ${b.blur ? 'checked' : ''}> ${t('blur_image')}</label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('select_scene_asset')}</label>
        <div class="scene-picker-tabs">
          <button type="button" id="scene-tab-backgrounds" class="scene-picker-tab" onclick="switchScenePickerTab('backgrounds')">${t('tab_backgrounds')}</button>
          <button type="button" id="scene-tab-scenes" class="scene-picker-tab" onclick="switchScenePickerTab('scenes')">${t('tab_scenes')}</button>
        </div>
        <div id="scene-picker-backgrounds" class="img-picker" style="grid-template-columns:repeat(3,1fr);"></div>
        <div id="scene-picker-scenes" class="img-picker" style="grid-template-columns:repeat(3,1fr);display:none;"></div>
        <input type="hidden" id="f-bg" value="${selectedSceneAsset}">
      </div>`;
    }

    case 'solid': return buildSolidBody(b);

    case 'label': return `
      <div class="form-group">
        <label class="form-label">${t('label_name')}</label>
        <input class="form-input" id="f-name" value="${b.name || ''}" placeholder="Ej: capitulo_2_inicio">
      </div>
      <div style="font-size:11px;color:var(--text2);margin-top:6px;">${t('label_hint')}</div>
      ${(!b.name || editingIndex < 0) ? `
      <div class="form-group" style="margin-top: 15px;">
        <label class="form-label">${t('label_placement')}</label>
        <div style="display:flex; flex-direction:column; gap:6px; font-size:12px;">
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="radio" name="f-label-pos" id="f-pos-after" value="after" ${!b.endOfFile ? 'checked' : ''}>
            <span>${t('label_pos_after')}</span>
          </label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="radio" name="f-label-pos" id="f-pos-end" value="end" ${b.endOfFile ? 'checked' : ''}>
            <span>${t('label_pos_end')}</span>
          </label>
        </div>
      </div>
      ` : ''}`;

    case 'menu': return buildMenuBody(b);

    case 'condition': return buildConditionBody(b);

    case 'pause': return `
      <div class="form-group">
        <label class="form-label">${t('pause_duration')}</label>
        <input class="form-input" id="f-dur" type="number" min="0.1" step="0.1" value="${b.duration || ''}" placeholder="Ej: 2.0">
      </div>`;

    case 'music': {
      const isStop = (b.action || 'play') === 'stop';
      return `
      <div class="form-group">
        <label class="form-label">${t('music_action')}</label>
        <div class="radio-group">
          ${['play', 'stop', 'queue'].map(a => `<label class="radio-option"><input type="radio" name="f-action" value="${a}" onchange="onMusicActionChange()" ${(b.action || 'play') === a ? 'checked' : ''}> ${a}</label>`).join('')}
        </div>
      </div>
      <div class="form-group music-file-section" ${isStop ? 'style="display:none"' : ''}>
        <label class="form-label">${t('audio_file')}</label>
        <input class="form-input" id="f-file" value="${escHtml(b.file || '')}" placeholder="Ej: audio/Morning.mp3" oninput="renderAudioList()">
      </div>
      <div class="form-group music-file-section" ${isStop ? 'style="display:none"' : ''}>
        <label class="form-label">${t('audio_folder_files')}</label>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <input class="form-input" id="f-audio-filter" placeholder="${t('search_placeholder')}" oninput="renderAudioList()">
          <button class="btn btn-secondary" type="button" onclick="stopAudioPreview()" title="${t('stop_preview')}">⏹</button>
        </div>
        <div id="audio-list" class="audio-list"></div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px;">${t('audio_click_hint')}</div>
      </div>
      <div class="form-group music-file-section" id="fg-loop" ${isStop ? 'style="display:none"' : ''}>
        <label class="radio-option"><input type="checkbox" id="f-loop" ${b.loop !== false ? 'checked' : ''}> ${t('loop_playback')}</label>
      </div>`;
    }

    case 'jump': return `
      <div class="form-group">
        <label class="form-label">${t('jump_label')}</label>
        <select class="form-select" id="f-label">
          <option value="" disabled selected>${t('select_label')}</option>
          ${data.labels.map(l => `<option value="${l}" ${b.label === l ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>`;

    case 'call': return `
      <div class="form-group">
        <label class="form-label">${t('jump_label')}</label>
        <select class="form-select" id="f-label">
          <option value="" disabled selected>${t('select_label')}</option>
          ${data.labels.map(l => `<option value="${l}" ${b.label === l ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>`;

    case 'comment': return `
      <div class="form-group">
        <label class="form-label">${t('comment_text')}</label>
        <input class="form-input" id="f-text" spellcheck="true" value="${b.text || ''}" placeholder="Ej: TO-DO: añadir expresión aquí">
      </div>`;

    case 'custom': return `
      <div class="form-group">
        <label class="form-label">${t('custom_code')}</label>
        <textarea class="form-textarea" id="f-code" rows="8" style="font-family:monospace;" placeholder="Escribe cualquier código RenPy..." onkeydown="handleCustomCodeKeydown(event, this)">${b.code || ''}</textarea>
      </div>
      <div style="font-size:10px;color:var(--text3);">${t('custom_code_hint')}</div>`;

    default: return `<p>${t('unknown_type')}</p>`;
  }
}

function handleCustomCodeKeydown(e, el) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = el.value.substring(0, start) + '    ' + el.value.substring(end);
    el.selectionStart = el.selectionEnd = start + 4;
  } else if (e.key === 'Backspace') {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end && start > 0) {
      if (start >= 4 && el.value.substring(start - 4, start) === '    ') {
        e.preventDefault();
        el.value = el.value.substring(0, start - 4) + el.value.substring(start);
        el.selectionStart = el.selectionEnd = start - 4;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SOLID MODAL — show expression Solid("#RRGGBBAA") as name
// ═══════════════════════════════════════════════════════════════════
const SOLID_PALETTE = [
  '#000000', '#ffffff', '#808080', '#1a1a2e', '#e94560', '#c0392b', '#e67e22', '#f1c40f',
  '#2ecc71', '#16a085', '#3498db', '#2c3e50', '#9b59b6', '#ff9ff3', '#f5deb3', '#8b4513'
];

// "#RGB", "#RGBA", "#RRGGBB" or "#RRGGBBAA" -> { r, g, b, a } (0-255), or null
function parseHexColor(hex) {
  const m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec((hex || '').trim());
  if (!m) return null;
  let h = m[1];
  if (h.length <= 4) h = h.split('').map(c => c + c).join('');
  const n = i => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 255 };
}

function toHex2(v) { return Math.round(v).toString(16).padStart(2, '0'); }

function formatHexColor({ r, g, b, a }) {
  return '#' + toHex2(r) + toHex2(g) + toHex2(b) + (a < 255 ? toHex2(a) : '');
}

function buildSolidBody(b) {
  const color = parseHexColor(b.color) || { r: 0, g: 0, b: 0, a: 187 };
  const hex = b.color || formatHexColor(color);
  const alphaPct = Math.round(color.a / 255 * 100);
  return `
    <div class="form-group">
      <label class="form-label">${t('solid_color')}</label>
      <div class="solid-color-row">
        <input type="color" id="f-solid-picker" class="solid-picker" value="${formatHexColor({ ...color, a: 255 })}" oninput="onSolidPickerInput()" title="${t('solid_pick_color')}">
        <input class="form-input" id="f-solid-hex" value="${escHtml(hex)}" maxlength="9" placeholder="#000000B0" oninput="onSolidHexInput()" style="max-width:140px;font-family:monospace;">
        <div class="solid-preview"><div id="f-solid-preview"></div></div>
      </div>
      <div class="solid-palette">
        ${SOLID_PALETTE.map(c => `<button type="button" class="solid-swatch" style="background:${c}" title="${c}" onclick="onSolidSwatch('${c}')"></button>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('solid_opacity')}: <span id="f-solid-alpha-val">${alphaPct}%</span></label>
      <input type="range" id="f-solid-alpha" min="0" max="100" value="${alphaPct}" oninput="onSolidAlphaInput()" style="width:100%;">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('solid_name')}</label>
        <input class="form-input" id="f-solid-name" value="${escHtml(b.name || '')}" placeholder="Ej: oscurecer" oninput="updateSolidPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">${t('transition_with')}</label>
        ${buildTransitionSelect('f-trans', b.transition)}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('solid_code_preview')}</label>
      <code id="f-solid-code" class="solid-code"></code>
    </div>`;
}

function updateSolidPreview() {
  const hex = (document.getElementById('f-solid-hex')?.value || '').trim();
  const color = parseHexColor(hex);
  const prev = document.getElementById('f-solid-preview');
  if (prev) prev.style.background = color ? formatHexColor(color) : 'transparent';
  document.getElementById('f-solid-hex')?.classList.toggle('invalid', !color);
  const name = (document.getElementById('f-solid-name')?.value || '').trim() || '...';
  const code = document.getElementById('f-solid-code');
  if (code) code.textContent = `show expression Solid("${hex}") as ${name}`;
}

// Picker, swatches and slider rewrite the hex field; typing a hex updates them
function setSolidFromParts(rgbHex, alphaPct) {
  const c = parseHexColor(rgbHex);
  if (!c) return;
  c.a = Math.round(alphaPct / 100 * 255);
  document.getElementById('f-solid-hex').value = formatHexColor(c);
  updateSolidPreview();
}

function onSolidPickerInput() {
  setSolidFromParts(document.getElementById('f-solid-picker').value, +document.getElementById('f-solid-alpha').value);
}

function onSolidSwatch(c) {
  document.getElementById('f-solid-picker').value = c;
  onSolidPickerInput();
}

function onSolidAlphaInput() {
  const pct = +document.getElementById('f-solid-alpha').value;
  document.getElementById('f-solid-alpha-val').textContent = pct + '%';
  setSolidFromParts(document.getElementById('f-solid-picker').value, pct);
}

function onSolidHexInput() {
  const c = parseHexColor(document.getElementById('f-solid-hex').value);
  if (c) {
    const pct = Math.round(c.a / 255 * 100);
    document.getElementById('f-solid-picker').value = formatHexColor({ ...c, a: 255 });
    document.getElementById('f-solid-alpha').value = pct;
    document.getElementById('f-solid-alpha-val').textContent = pct + '%';
  }
  updateSolidPreview();
}

// ═══════════════════════════════════════════════════════════════════
// MUSIC MODAL — list of game/audio files with click-to-play preview
// ═══════════════════════════════════════════════════════════════════
const audioPreview = new Audio();
let audioPreviewFile = '';
audioPreview.addEventListener('ended', () => { audioPreviewFile = ''; renderAudioList(); });
audioPreview.addEventListener('error', () => {
  if (!audioPreviewFile) return;
  notify(t('audio_play_error', audioPreviewFile), 'err');
  audioPreviewFile = '';
  renderAudioList();
});

function stopAudioPreview() {
  audioPreview.pause();
  audioPreviewFile = '';
  renderAudioList();
}

function playAudioPreview(file) {
  audioPreview.pause();
  audioPreviewFile = file;
  audioPreview.src = getGameFileURL(file);
  audioPreview.currentTime = 0;
  audioPreview.play().catch(() => {});
}

function onMusicActionChange() {
  const action = document.querySelector('input[name="f-action"]:checked')?.value || 'play';
  document.querySelectorAll('.music-file-section').forEach(el => { el.style.display = action === 'stop' ? 'none' : ''; });
  if (action === 'stop') stopAudioPreview();
}

function renderAudioList() {
  const list = document.getElementById('audio-list');
  if (!list) return;
  if (!data.audioFiles.length) {
    list.innerHTML = `<div class="audio-empty">${t('no_audio_files')}</div>`;
    return;
  }
  const filter = (document.getElementById('f-audio-filter')?.value || '').trim().toLowerCase();
  const selected = document.getElementById('f-file')?.value || '';
  const items = data.audioFiles
    .map((file, idx) => ({ file, idx }))
    .filter(({ file }) => !filter || file.toLowerCase().includes(filter));
  if (!items.length) {
    list.innerHTML = `<div class="audio-empty">${t('no_results')}</div>`;
    return;
  }
  list.innerHTML = items.map(({ file, idx }) => {
    const playing = file === audioPreviewFile;
    const name = file.replace(/^audio\//, '');
    return `<div class="audio-item ${file === selected ? 'selected' : ''} ${playing ? 'playing' : ''}" onclick="onAudioItemClick(${idx})" title="${escHtml(file)}">
      <span class="audio-play">${playing ? '⏸' : '▶'}</span>
      <span class="audio-name">${escHtml(name)}</span>
    </div>`;
  }).join('');
}

// Clicking a file selects it and plays it (clicking the playing one pauses it)
function onAudioItemClick(idx) {
  const file = data.audioFiles[idx];
  if (!file) return;
  const input = document.getElementById('f-file');
  if (input) input.value = file;
  if (audioPreviewFile === file && !audioPreview.paused) {
    audioPreview.pause();
    audioPreviewFile = '';
  } else {
    playAudioPreview(file);
  }
  renderAudioList();
}

async function refreshAudioFiles() {
  if (gamePath) data.audioFiles = await window.api.listAudioFiles();
  renderAudioList();
}

// ═══════════════════════════════════════════════════════════════════
// MENU MODAL
// ═══════════════════════════════════════════════════════════════════
function buildMenuBody(b) {
  const choices = b.choices || [{ text: '', action: 'blocks', jump: '', code: '', blocks: [] }];
  const showChar = !!b.showCharacterChoice;
  const html = `
    <div style="font-size:11px;color:var(--text2);margin-bottom:10px;">${t('menu_hint')}</div>
    <div class="choice-item" style="margin-bottom:12px;">
      <div class="form-group">
        <label class="radio-option">
          <input type="checkbox" id="f-menu-show-char" ${showChar ? 'checked' : ''} onchange="toggleMenuChar()">
          ${t('menu_show_character')}
        </label>
      </div>
      <div id="menu-char-section" ${showChar ? '' : 'style="display:none"'}>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">${t('character')}</label>
            <select class="form-select" id="f-menu-char" onchange="onMenuCharChange()">${buildCharOptions('')}</select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('sprite_type')}</label>
            ${spriteTypeSelectHtml('f-menu-type', 'onMenuTypeChange()')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('select_sprite')}</label>
          <div id="menu-sprite-picker" class="img-picker"></div>
        </div>
        <input type="hidden" id="f-menu-sprite" value="${escHtml(b.choiceCharacter || '')}">
      </div>
    </div>
    <div id="choices-list">
      ${choices.map((ch, i) => buildChoiceHtml(ch, i)).join('')}
    </div>
    <button class="btn btn-secondary" style="width:100%;margin-top:6px;" onclick="addChoice()">${t('add_option')}</button>`;
  setTimeout(() => {
    choices.forEach((ch, i) => renderChoiceBlocks(i));
  }, 60);
  return html;
}

function buildConditionBody(b) {
  const blocksJson = b.blocks ? escHtml(JSON.stringify(b.blocks)) : '[]';
  const elseBlocksJson = b.elseBlocks ? escHtml(JSON.stringify(b.elseBlocks)) : '[]';
  const elifBlocks = Array.isArray(b.elifBlocks) ? b.elifBlocks : [];
  const hasElse = !!b.hasElse;
  return `
    <div style="font-size:11px;color:var(--text2);margin-bottom:10px;">${t('condition_hint')}</div>
    <div class="form-group">
      <label class="form-label">${t('condition_expression')}</label>
      <input class="form-input" id="f-cond" value="${escHtml(b.condition || '')}" placeholder="${t('condition_expression_placeholder')}">
    </div>
    <div class="form-group">
      <label class="form-label">${t('condition_blocks')}</label>
      <input type="hidden" id="ifb" value="${blocksJson}">
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">
        ${['narration','dialogue','show','show_multi','hide','hide_multi','scene','solid','menu','condition','pause','music','jump','call','comment','custom'].map(t2 => {
          const m = BLOCK_META[t2];
          return `<button class="btn btn-secondary" style="font-size:10px;padding:3px 8px;" onclick="addConditionBlock('then','${t2}')">${m.icon}</button>`;
        }).join('')}
      </div>
      <div id="ifbl" class="choice-blocks-list"></div>
    </div>
    <div class="form-group" style="margin-top:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <label class="form-label" style="margin-bottom:0;">${t('condition_elif_blocks')}</label>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="btn btn-secondary btn-sm" type="button" onclick="addElifBlock()">${t('condition_add_elif')}</button>
          <button class="btn btn-secondary btn-sm toggle-btn ${hasElse ? 'active' : ''}" type="button" onclick="toggleConditionElse()" id="f-cond-has-else">${hasElse ? t('condition_else_added') : t('condition_enable_else')}</button>
        </div>
      </div>
      <div id="elif-list" style="margin-top:6px;">
        ${elifBlocks.map((eb, i) => buildConditionElifHtml(eb, i)).join('')}
      </div>
    </div>
    <div id="if-else-section" ${hasElse ? '' : 'style="display:none"'}>
      <div class="form-group">
        <label class="form-label">${t('condition_else_blocks')}</label>
        <input type="hidden" id="ifeb" value="${elseBlocksJson}">
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">
          ${['narration','dialogue','show','show_multi','hide','hide_multi','scene','solid','menu','condition','pause','music','jump','call','comment','custom'].map(t2 => {
            const m = BLOCK_META[t2];
            return `<button class="btn btn-secondary" style="font-size:10px;padding:3px 8px;" onclick="addConditionBlock('else','${t2}')">${m.icon}</button>`;
          }).join('')}
        </div>
        <div id="ifebl" class="choice-blocks-list"></div>
      </div>
    </div>`;
}

function buildConditionElifHtml(eb, i) {
  const blocksJson = eb.blocks ? escHtml(JSON.stringify(eb.blocks)) : '[]';
  return `<div class="choice-item" id="elif-${i}" data-elif-index="${i}">
    <div class="choice-header">
      <span class="choice-number">ELIF ${i + 1}</span>
      <button class="btn btn-secondary choice-remove" type="button" onclick="removeElifBlock(${i})" title="${t('remove_elif')}">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">${t('condition_elif_condition')}</label>
      <input class="form-input" id="ife-cond-${i}" value="${escHtml(eb.condition || '')}" placeholder="${t('condition_expression_placeholder')}">
    </div>
    <div class="form-group">
      <label class="form-label">${t('condition_elif_blocks')}</label>
      <input type="hidden" id="ife-${i}" value="${blocksJson}">
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">
        ${['narration','dialogue','show','show_multi','hide','hide_multi','scene','solid','menu','condition','pause','music','jump','call','comment','custom'].map(t2 => {
          const m = BLOCK_META[t2];
          return `<button class="btn btn-secondary" style="font-size:10px;padding:3px 8px;" onclick="addConditionBlock('elif-${i}','${t2}')">${m.icon}</button>`;
        }).join('')}
      </div>
      <div id="ifel-${i}" class="choice-blocks-list"></div>
    </div>
  </div>`;
}

function toggleConditionElse() {
  const btn = document.getElementById('f-cond-has-else');
  const show = !btn?.classList.contains('active');
  if (btn) {
    btn.classList.toggle('active', show);
    btn.textContent = show ? t('condition_else_added') : t('condition_enable_else');
  }
  const sec = document.getElementById('if-else-section');
  if (sec) sec.style.display = show ? '' : 'none';
  if (show) renderConditionBlocks('else');
}

function toggleMenuChar() {
  const show = document.getElementById('f-menu-show-char')?.checked;
  document.getElementById('menu-char-section').style.display = show ? '' : 'none';
  if (show) {
    const charId = document.getElementById('f-menu-char')?.value;
    const currentSprite = document.getElementById('f-menu-sprite')?.value || '';
    populateMenuSpritePicker(charId, currentSprite);
  }
}

function onMenuCharChange() {
  const charId = document.getElementById('f-menu-char')?.value;
  populateMenuSpritePicker(charId, '');
  document.getElementById('f-menu-sprite').value = '';
}

function onMenuTypeChange() {
  const charId = document.getElementById('f-menu-char')?.value;
  const selected = document.getElementById('f-menu-sprite')?.value || '';
  populateMenuSpritePicker(charId, selected, readSpriteTypeSelect('f-menu-type'));
}

function populateMenuSpritePicker(charId, selectedImage, preferredType) {
  const picker = document.getElementById('menu-sprite-picker');
  if (!picker) return;
  const chr = data.characters.find(c => c.id === charId);
  const { type, images } = prepareTypedSpritePicker('f-menu-type', chr, selectedImage, preferredType);
  if (!chr || !chr.images.length) { picker.innerHTML = pickerMessage(t('no_char_images')); return; }
  if (type === null) { picker.innerHTML = pickerMessage(t('select_type_first')); return; }
  picker.innerHTML = images.map(img =>
    `<div class="img-option ${img.key === selectedImage ? 'selected' : ''}" onclick="selectMenuSprite('${img.key}')" title="${img.key}" id="msp-${img.key}">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${spriteLabel(chr, img.key)}</div>
    </div>`).join('');
}

function selectMenuSprite(key) {
  document.querySelectorAll('#menu-sprite-picker .img-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('msp-' + key)?.classList.add('selected');
  document.getElementById('f-menu-sprite').value = key;
}

function buildChoiceHtml(ch, i) {
  const blocksJson = ch.blocks ? escHtml(JSON.stringify(ch.blocks)) : '[]';
  return `<div class="choice-item" id="choice-${i}">
    <div class="choice-header">
      <span class="choice-number">${t('option')} ${i + 1}</span>
      <button class="btn btn-secondary choice-remove" onclick="removeChoice(${i})">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">${t('option_text')}</label>
      <input class="form-input" id="ct-${i}" spellcheck="true" value="${escHtml(ch.text || '')}" placeholder="Ej: Ir con Lucco">
    </div>
    <input type="hidden" id="cb-${i}" value="${blocksJson}">
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">
      ${['narration','dialogue','show','show_multi','hide','hide_multi','scene','solid','condition','pause','music','jump','call','comment','custom'].map(t2 => {
        const m = BLOCK_META[t2];
        return `<button class="btn btn-secondary" style="font-size:10px;padding:3px 8px;" onclick="addChoiceBlock(${i},'${t2}')">${m.icon}</button>`;
      }).join('')}
    </div>
    <div id="cbl-${i}" class="choice-blocks-list"></div>
  </div>`;
}

function toggleChoiceAction(i) {
  const action = document.querySelector(`input[name="ca-${i}"]:checked`)?.value || 'jump';
  document.getElementById('caj-' + i).style.display = (action === 'code' || action === 'none' || action === 'blocks') ? 'none' : '';
  document.getElementById('cac-' + i).style.display = action === 'code' ? '' : 'none';
  document.getElementById('cab-' + i).style.display = action === 'blocks' ? '' : 'none';
  if (action === 'blocks') renderChoiceBlocks(i);
}

// ── Choice inline blocks ──
function getChoiceBlocks(i) {
  try { return JSON.parse(document.getElementById('cb-' + i)?.value || '[]'); }
  catch (e) { return []; }
}
function setChoiceBlocks(i, bArr) {
  const inp = document.getElementById('cb-' + i);
  if (inp) inp.value = JSON.stringify(bArr);
  renderChoiceBlocks(i);
}

function renderChoiceBlocks(i) {
  const list = document.getElementById('cbl-' + i);
  if (!list) return;
  attachInnerListDropHandlers(list, 'choice-' + i);
  const bArr = getChoiceBlocks(i);
  if (!bArr.length) {
    list.innerHTML = `<div style="color:var(--text3);font-size:11px;text-align:center;padding:10px;">${t('no_blocks_in_choice')}</div>`;
    return;
  }
  list.innerHTML = bArr.map((b, j) => {
    const meta = BLOCK_META[b.type] || { icon: '?', labelKey: b.type };
    return `<div class="inner-block" style="border-left-color:${meta.color || 'var(--border)'};" draggable="true"
      ondragstart="onInnerDragStart(event,'choice-${i}',${j})" ondragend="onInnerDragEnd(event)"
      ondragover="onInnerDragOver(event,'choice-${i}',${j})" ondragleave="onInnerDragLeave(event)"
      ondrop="onInnerDrop(event,'choice-${i}',${j})">
      <span class="inner-block-handle" title="${t('drag_to_reorder')}">⋮⋮</span>
      <span style="font-size:12px;">${meta.icon}</span>
      <span style="flex:1;font-size:11px;color:var(--text);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${escHtml(blockDesc(b))}</span>
      <button class="block-btn block-btn-sm" onclick="editChoiceBlock(${i},${j})" title="${t('btn_edit')}">✏️</button>
      <button class="block-btn block-btn-sm" onclick="duplicateChoiceBlock(${i},${j})" title="${t('btn_duplicate')}">📋</button>
      <button class="block-btn block-btn-sm" onclick="duplicateChoiceBlockToEnd(${i},${j})" title="${t('btn_duplicate_end')}">⬇️</button>
      <button class="block-btn block-btn-sm danger" onclick="removeChoiceBlock(${i},${j})" title="${t('btn_delete')}">🗑</button>
    </div>`;
  }).join('');
}

// ── Inner blocks drag & drop (choices of a menu and branches of a condition) ──
// listKey: 'choice-<idx>' for a menu choice, 'cond-<branch>' for a condition branch
let innerDragSrc = null;

function getInnerBlocks(listKey) {
  if (listKey.startsWith('choice-')) return getChoiceBlocks(parseInt(listKey.slice(7), 10));
  return getConditionBlocks(listKey.slice(5));
}

function setInnerBlocks(listKey, bArr) {
  if (listKey.startsWith('choice-')) setChoiceBlocks(parseInt(listKey.slice(7), 10), bArr);
  else setConditionBlocks(listKey.slice(5), bArr);
}

function clearInnerDropMarkers() {
  document.querySelectorAll('.inner-block.drop-before, .inner-block.drop-after')
    .forEach(el => el.classList.remove('drop-before', 'drop-after'));
  document.querySelectorAll('.choice-blocks-list.drop-end')
    .forEach(el => el.classList.remove('drop-end'));
}

function moveInnerBlock(listKey, fromIdx, toIdx) {
  if (fromIdx < toIdx) toIdx--;
  if (fromIdx === toIdx) return;
  const bArr = getInnerBlocks(listKey);
  if (fromIdx < 0 || fromIdx >= bArr.length) return;
  const [moved] = bArr.splice(fromIdx, 1);
  bArr.splice(Math.max(0, Math.min(toIdx, bArr.length)), 0, moved);
  setInnerBlocks(listKey, bArr);
}

function isDropAfter(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  return e.clientY > rect.top + rect.height / 2;
}

function onInnerDragStart(e, listKey, blockIdx) {
  innerDragSrc = { listKey, blockIdx };
  e.stopPropagation();
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(blockIdx));
  const row = e.currentTarget;
  requestAnimationFrame(() => row.classList.add('dragging'));
}

function onInnerDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  clearInnerDropMarkers();
  innerDragSrc = null;
}

function onInnerDragOver(e, listKey, blockIdx) {
  if (!innerDragSrc || innerDragSrc.listKey !== listKey) return;
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'move';
  autoScrollInnerList(e, e.currentTarget.parentElement);
  const after = isDropAfter(e);
  clearInnerDropMarkers();
  if (blockIdx === innerDragSrc.blockIdx) return;
  e.currentTarget.classList.add(after ? 'drop-after' : 'drop-before');
}

function onInnerDragLeave(e) {
  if (e.currentTarget.contains(e.relatedTarget)) return;
  e.currentTarget.classList.remove('drop-before', 'drop-after');
}

function onInnerDrop(e, listKey, targetIdx) {
  if (!innerDragSrc || innerDragSrc.listKey !== listKey) return;
  e.preventDefault();
  e.stopPropagation();
  const toIdx = isDropAfter(e) ? targetIdx + 1 : targetIdx;
  const fromIdx = innerDragSrc.blockIdx;
  clearInnerDropMarkers();
  innerDragSrc = null;
  moveInnerBlock(listKey, fromIdx, toIdx);
}

// Scroll the list (and the modal) while dragging near their edges
function autoScrollInnerList(e, listEl) {
  const EDGE = 28, STEP = 12;
  if (listEl) {
    const r = listEl.getBoundingClientRect();
    if (e.clientY < r.top + EDGE) listEl.scrollTop -= STEP;
    else if (e.clientY > r.bottom - EDGE) listEl.scrollTop += STEP;
  }
  const modalBox = document.getElementById('modal-box');
  if (modalBox) {
    const r = modalBox.getBoundingClientRect();
    if (e.clientY < r.top + EDGE) modalBox.scrollTop -= STEP;
    else if (e.clientY > r.bottom - EDGE) modalBox.scrollTop += STEP;
  }
}

// Dropping on the empty area of a list moves the block to the end
function attachInnerListDropHandlers(listEl, listKey) {
  listEl.ondragover = (e) => {
    if (!innerDragSrc || innerDragSrc.listKey !== listKey) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    autoScrollInnerList(e, listEl);
    if (e.target === listEl) {
      clearInnerDropMarkers();
      listEl.classList.add('drop-end');
    }
  };
  listEl.ondragleave = (e) => {
    if (!listEl.contains(e.relatedTarget)) listEl.classList.remove('drop-end');
  };
  listEl.ondrop = (e) => {
    if (!innerDragSrc || innerDragSrc.listKey !== listKey) return;
    e.preventDefault();
    const fromIdx = innerDragSrc.blockIdx;
    clearInnerDropMarkers();
    innerDragSrc = null;
    moveInnerBlock(listKey, fromIdx, getInnerBlocks(listKey).length);
  };
}

function readCurrentMenuState() {
  const list = document.getElementById('choices-list');
  const choices = [];
  for (let i = 0; i < list.children.length; i++) {
    const txt = document.getElementById('ct-' + i)?.value || '';
    let choiceBlocks = [];
    try { choiceBlocks = JSON.parse(document.getElementById('cb-' + i)?.value || '[]'); } catch (e) {}
    choices.push({ text: txt, action: 'blocks', jump: '', code: '', blocks: choiceBlocks });
  }
  const menuBlock = { type: 'menu', choices };
  // Capture menu character choice state
  if (document.getElementById('f-menu-show-char')?.checked) {
    menuBlock.showCharacterChoice = true;
    menuBlock.choiceCharacter = document.getElementById('f-menu-sprite')?.value || '';
    menuBlock.choicePosition = 'left';
  } else {
    menuBlock.choicePosition = 'center';
  }
  return menuBlock;
}

function addChoiceBlock(choiceIdx, type) {
  const savedMenuBlock = readCurrentMenuState();
  const savedMenuScrollTop = document.getElementById('modal-box')?.scrollTop || 0;
  const savedChoiceBlocksScrollTop = document.getElementById('cbl-' + choiceIdx)?.scrollTop || 0;
  const choiceBlocksList = document.getElementById('cbl-' + choiceIdx);
  const savedChoiceBlocksAtBottom = choiceBlocksList
    ? (choiceBlocksList.scrollTop + choiceBlocksList.clientHeight >= choiceBlocksList.scrollHeight - 8)
    : false;
  choiceBlockContext = {
    choiceIdx,
    blockIdx: -1,
    savedMenuBlock,
    savedEditingIndex: editingIndex,
    savedMenuScrollTop,
    savedChoiceBlocksScrollTop,
    savedChoiceBlocksAtBottom,
    parentChoiceContext: choiceBlockContext,
    parentConditionContext: conditionBlockContext
  };
  document.getElementById('modal-overlay').classList.remove('open');
  editingIndex = -1;
  openModal(type);
}

function editChoiceBlock(choiceIdx, blockIdx) {
  const savedMenuBlock = readCurrentMenuState();
  const block = savedMenuBlock.choices[choiceIdx]?.blocks?.[blockIdx];
  if (!block) return;
  const savedMenuScrollTop = document.getElementById('modal-box')?.scrollTop || 0;
  const savedChoiceBlocksScrollTop = document.getElementById('cbl-' + choiceIdx)?.scrollTop || 0;
  const choiceBlocksList = document.getElementById('cbl-' + choiceIdx);
  const savedChoiceBlocksAtBottom = choiceBlocksList
    ? (choiceBlocksList.scrollTop + choiceBlocksList.clientHeight >= choiceBlocksList.scrollHeight - 8)
    : false;
  choiceBlockContext = {
    choiceIdx,
    blockIdx,
    savedMenuBlock,
    savedEditingIndex: editingIndex,
    savedMenuScrollTop,
    savedChoiceBlocksScrollTop,
    savedChoiceBlocksAtBottom,
    parentChoiceContext: choiceBlockContext,
    parentConditionContext: conditionBlockContext
  };
  document.getElementById('modal-overlay').classList.remove('open');
  editingIndex = -1;
  openModal(block.type, { ...block });
}

function duplicateChoiceBlock(choiceIdx, blockIdx) {
  const bArr = getChoiceBlocks(choiceIdx);
  const clone = JSON.parse(JSON.stringify(bArr[blockIdx]));
  bArr.splice(blockIdx + 1, 0, clone);
  setChoiceBlocks(choiceIdx, bArr);
}

// FIX: copy-to-end for choice blocks
function duplicateChoiceBlockToEnd(choiceIdx, blockIdx) {
  const bArr = getChoiceBlocks(choiceIdx);
  const clone = JSON.parse(JSON.stringify(bArr[blockIdx]));
  bArr.push(clone);
  setChoiceBlocks(choiceIdx, bArr);
  scrollChoiceBlocksToBottom(choiceIdx);
}

async function removeChoiceBlock(choiceIdx, blockIdx) {
  const bArr = getChoiceBlocks(choiceIdx);
  if (!await confirmDeleteBlock(bArr[blockIdx])) return;
  bArr.splice(blockIdx, 1);
  setChoiceBlocks(choiceIdx, bArr);
}

function scrollChoiceBlocksToBottom(choiceIdx) {
  const doScroll = () => {
    const listEl = document.getElementById('cbl-' + choiceIdx);
    if (listEl) listEl.scrollTop = listEl.scrollHeight;
  };
  setTimeout(doScroll, 0);
  setTimeout(doScroll, 140);
}

function addChoice() {
  const list = document.getElementById('choices-list');
  const i = list.children.length;
  const div = document.createElement('div');
  div.innerHTML = buildChoiceHtml({ text: '', action: 'blocks', jump: '', code: '', blocks: [] }, i);
  list.appendChild(div.firstElementChild);
}

function parseConditionBranch(branch) {
  if (branch === 'then' || branch === 'else') return { type: branch };
  const m = /^elif-(\d+)$/.exec(branch);
  if (m) return { type: 'elif', index: parseInt(m[1], 10) };
  return { type: 'then' };
}

function getConditionBranchListId(branch) {
  const info = parseConditionBranch(branch);
  if (info.type === 'else') return 'ifebl';
  if (info.type === 'elif') return `ifel-${info.index}`;
  return 'ifbl';
}

function restoreConditionPosition(branch, savedModalScrollTop, savedBranchScrollTop, savedBranchAtBottom) {
  const restore = () => {
    const modalBox = document.getElementById('modal-box');
    if (modalBox) modalBox.scrollTop = savedModalScrollTop || 0;
    const listId = getConditionBranchListId(branch);
    const listEl = document.getElementById(listId);
    if (listEl) {
      if (savedBranchAtBottom) listEl.scrollTop = listEl.scrollHeight;
      else listEl.scrollTop = savedBranchScrollTop || 0;
    }
  };
  setTimeout(restore, 0);
  setTimeout(restore, 140);
}

function scrollConditionBranchToBottom(branch) {
  const doScroll = () => {
    const listId = getConditionBranchListId(branch);
    const listEl = document.getElementById(listId);
    if (listEl) listEl.scrollTop = listEl.scrollHeight;
  };
  setTimeout(doScroll, 0);
  setTimeout(doScroll, 140);
}

function getConditionBranchBlocks(conditionBlock, branch) {
  const info = parseConditionBranch(branch);
  if (info.type === 'else') return conditionBlock?.elseBlocks || [];
  if (info.type === 'elif') return conditionBlock?.elifBlocks?.[info.index]?.blocks || [];
  return conditionBlock?.blocks || [];
}

function getConditionBlocks(branch = 'then') {
  const info = parseConditionBranch(branch);
  const id = info.type === 'else'
    ? 'ifeb'
    : info.type === 'elif'
      ? `ife-${info.index}`
      : 'ifb';
  try { return JSON.parse(document.getElementById(id)?.value || '[]'); }
  catch (e) { return []; }
}

function setConditionBlocks(branch, bArr) {
  const info = parseConditionBranch(branch);
  const id = info.type === 'else'
    ? 'ifeb'
    : info.type === 'elif'
      ? `ife-${info.index}`
      : 'ifb';
  const inp = document.getElementById(id);
  if (inp) inp.value = JSON.stringify(bArr);
  renderConditionBlocks(branch);
}

function renderConditionBlocks(branch = 'then') {
  const info = parseConditionBranch(branch);
  const listId = info.type === 'else'
    ? 'ifebl'
    : info.type === 'elif'
      ? `ifel-${info.index}`
      : 'ifbl';
  const list = document.getElementById(listId);
  if (!list) return;
  attachInnerListDropHandlers(list, 'cond-' + branch);
  const bArr = getConditionBlocks(branch);
  if (!bArr.length) {
    const emptyMsg = info.type === 'else'
      ? t('no_blocks_in_condition_else')
      : info.type === 'elif'
        ? t('no_blocks_in_condition_elif')
        : t('no_blocks_in_condition');
    list.innerHTML = `<div style="color:var(--text3);font-size:11px;text-align:center;padding:10px;">${emptyMsg}</div>`;
    return;
  }
  list.innerHTML = bArr.map((b, j) => {
    const meta = BLOCK_META[b.type] || { icon: '?', labelKey: b.type };
    return `<div class="inner-block" style="border-left-color:${meta.color || 'var(--border)'};" draggable="true"
      ondragstart="onInnerDragStart(event,'cond-${branch}',${j})" ondragend="onInnerDragEnd(event)"
      ondragover="onInnerDragOver(event,'cond-${branch}',${j})" ondragleave="onInnerDragLeave(event)"
      ondrop="onInnerDrop(event,'cond-${branch}',${j})">
      <span class="inner-block-handle" title="${t('drag_to_reorder')}">⋮⋮</span>
      <span style="font-size:12px;">${meta.icon}</span>
      <span style="flex:1;font-size:11px;color:var(--text);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${escHtml(blockDesc(b))}</span>
      <button class="block-btn block-btn-sm" onclick="editConditionBlock('${branch}',${j})" title="${t('btn_edit')}">✏️</button>
      <button class="block-btn block-btn-sm" onclick="duplicateConditionBlock('${branch}',${j})" title="${t('btn_duplicate')}">📋</button>
      <button class="block-btn block-btn-sm" onclick="duplicateConditionBlockToEnd('${branch}',${j})" title="${t('btn_duplicate_end')}">⬇️</button>
      <button class="block-btn block-btn-sm danger" onclick="removeConditionBlock('${branch}',${j})" title="${t('btn_delete')}">🗑</button>
    </div>`;
  }).join('');
}

function renderAllElifBlocks() {
  const list = document.getElementById('elif-list');
  if (!list) return;
  const items = list.querySelectorAll('[data-elif-index]');
  items.forEach(el => {
    const idx = parseInt(el.dataset.elifIndex, 10);
    if (!Number.isNaN(idx)) renderConditionBlocks(`elif-${idx}`);
  });
}

function readConditionElifs() {
  const list = document.getElementById('elif-list');
  if (!list) return [];
  const items = list.querySelectorAll('[data-elif-index]');
  const elifs = [];
  items.forEach(el => {
    const idx = parseInt(el.dataset.elifIndex, 10);
    const condition = document.getElementById(`ife-cond-${idx}`)?.value || '';
    let blocks = [];
    try { blocks = JSON.parse(document.getElementById(`ife-${idx}`)?.value || '[]'); } catch (e) { blocks = []; }
    elifs.push({ condition: condition.trim(), blocks });
  });
  return elifs;
}

function rebuildElifList(elifs) {
  const list = document.getElementById('elif-list');
  if (!list) return;
  list.innerHTML = (elifs || []).map((eb, i) => buildConditionElifHtml(eb, i)).join('');
  renderAllElifBlocks();
}

function addElifBlock() {
  const current = readCurrentConditionState();
  current.elifBlocks = current.elifBlocks || [];
  current.elifBlocks.push({ condition: '', blocks: [] });
  rebuildElifList(current.elifBlocks);
}

function removeElifBlock(idx) {
  const current = readCurrentConditionState();
  current.elifBlocks = (current.elifBlocks || []).filter((_, i) => i !== idx);
  rebuildElifList(current.elifBlocks);
}

function readCurrentConditionState() {
  let condBlocks = [];
  let elseBlocks = [];
  try { condBlocks = JSON.parse(document.getElementById('ifb')?.value || '[]'); } catch (e) {}
  try { elseBlocks = JSON.parse(document.getElementById('ifeb')?.value || '[]'); } catch (e) {}
  const hasElse = document.getElementById('f-cond-has-else')?.classList.contains('active');
  return {
    type: 'condition',
    condition: (document.getElementById('f-cond')?.value || '').trim(),
    blocks: condBlocks,
    elifBlocks: readConditionElifs(),
    hasElse: !!hasElse,
    elseBlocks
  };
}

function addConditionBlock(branch, type) {
  const savedConditionBlock = readCurrentConditionState();
  const modalBox = document.getElementById('modal-box');
  const listId = getConditionBranchListId(branch);
  const listEl = document.getElementById(listId);
  const savedConditionScrollTop = modalBox?.scrollTop || 0;
  const savedBranchScrollTop = listEl?.scrollTop || 0;
  const savedBranchAtBottom = listEl
    ? (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 8)
    : false;
  conditionBlockContext = {
    branch,
    blockIdx: -1,
    savedConditionBlock,
    savedEditingIndex: editingIndex,
    savedConditionScrollTop,
    savedBranchScrollTop,
    savedBranchAtBottom,
    parentConditionContext: conditionBlockContext,
    parentChoiceContext: choiceBlockContext
  };
  document.getElementById('modal-overlay').classList.remove('open');
  editingIndex = -1;
  openModal(type);
}

function editConditionBlock(branch, blockIdx) {
  const savedConditionBlock = readCurrentConditionState();
  const source = getConditionBranchBlocks(savedConditionBlock, branch);
  const block = source?.[blockIdx];
  if (!block) return;
  const modalBox = document.getElementById('modal-box');
  const listId = getConditionBranchListId(branch);
  const listEl = document.getElementById(listId);
  const savedConditionScrollTop = modalBox?.scrollTop || 0;
  const savedBranchScrollTop = listEl?.scrollTop || 0;
  const savedBranchAtBottom = listEl
    ? (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 8)
    : false;
  conditionBlockContext = {
    branch,
    blockIdx,
    savedConditionBlock,
    savedEditingIndex: editingIndex,
    savedConditionScrollTop,
    savedBranchScrollTop,
    savedBranchAtBottom,
    parentConditionContext: conditionBlockContext,
    parentChoiceContext: choiceBlockContext
  };
  document.getElementById('modal-overlay').classList.remove('open');
  editingIndex = -1;
  openModal(block.type, { ...block });
}

function duplicateConditionBlock(branch, blockIdx) {
  const bArr = getConditionBlocks(branch);
  const clone = JSON.parse(JSON.stringify(bArr[blockIdx]));
  bArr.splice(blockIdx + 1, 0, clone);
  setConditionBlocks(branch, bArr);
}

function duplicateConditionBlockToEnd(branch, blockIdx) {
  const bArr = getConditionBlocks(branch);
  const clone = JSON.parse(JSON.stringify(bArr[blockIdx]));
  bArr.push(clone);
  setConditionBlocks(branch, bArr);
  scrollConditionBranchToBottom(branch);
}

async function removeConditionBlock(branch, blockIdx) {
  const bArr = getConditionBlocks(branch);
  if (!await confirmDeleteBlock(bArr[blockIdx])) return;
  bArr.splice(blockIdx, 1);
  setConditionBlocks(branch, bArr);
}

function removeChoice(i) {
  const el = document.getElementById('choice-' + i);
  if (el && document.getElementById('choices-list').children.length > 1) el.remove();
  else notify(t('min_one_option'), 'err');
}

// ═══════════════════════════════════════════════════════════════════
// SAVE BLOCK
// ═══════════════════════════════════════════════════════════════════
async function saveBlock() {
  const b = readModalValues();
  if (!b) return;

  if (b.type === 'label' && b.endOfFile) {
    // Añadir directamente al final del archivo
    const scriptText = await getScriptText() || '';
    const newCode = `\n\nlabel ${b.name}:\n    return\n`;
    const modified = scriptText.replace(/\n+$/, '') + newCode;
    const ok = await window.api.writeFile(activeRpyFile, modified);
    if (ok) {
      notify(t('block_added'), 'ok');
      const result = await window.api.reselectProjectFolder();
      if (result) {
        gamePath = result;
        await loadProjectData();
        renderAssetBrowser();
        setStatus(gamePath, 'ok');
      }
    } else {
      notify(t('save_error', 'write failed'), 'err');
    }
    closeModal();
    return;
  }

  if (conditionBlockContext) {
    const ctx = conditionBlockContext;
    const { branch, blockIdx, savedConditionBlock, savedConditionScrollTop, savedBranchScrollTop, savedBranchAtBottom } = ctx;
    const info = parseConditionBranch(branch);
    let targetArr = [];
    if (info.type === 'else') {
      savedConditionBlock.hasElse = true;
      targetArr = savedConditionBlock.elseBlocks;
    } else if (info.type === 'elif') {
      if (!savedConditionBlock.elifBlocks) savedConditionBlock.elifBlocks = [];
      if (!savedConditionBlock.elifBlocks[info.index]) {
        savedConditionBlock.elifBlocks[info.index] = { condition: '', blocks: [] };
      }
      targetArr = savedConditionBlock.elifBlocks[info.index].blocks;
    } else {
      targetArr = savedConditionBlock.blocks;
    }
    if (blockIdx >= 0) {
      targetArr[blockIdx] = b;
    } else {
      targetArr.push(b);
    }
    conditionBlockContext = ctx.parentConditionContext || null;
    choiceBlockContext = ctx.parentChoiceContext || null;
    editingIndex = ctx.savedEditingIndex;
    document.getElementById('modal-overlay').classList.remove('open');
    pendingBlock = {};
    openModal('condition', savedConditionBlock);
    restoreConditionPosition(branch, savedConditionScrollTop, savedBranchScrollTop, savedBranchAtBottom);
    notify(ctx.blockIdx >= 0 ? t('condition_block_edited') : t('condition_block_added'), 'ok');
    return;
  }

  if (choiceBlockContext) {
    const ctx = choiceBlockContext;
    const { choiceIdx, blockIdx, savedMenuBlock, savedMenuScrollTop, savedChoiceBlocksScrollTop, savedChoiceBlocksAtBottom } = ctx;
    if (blockIdx >= 0) {
      savedMenuBlock.choices[choiceIdx].blocks[blockIdx] = b;
    } else {
      savedMenuBlock.choices[choiceIdx].blocks.push(b);
    }
    choiceBlockContext = ctx.parentChoiceContext || null;
    conditionBlockContext = ctx.parentConditionContext || null;
    editingIndex = ctx.savedEditingIndex;
    document.getElementById('modal-overlay').classList.remove('open');
    pendingBlock = {};
    openModal('menu', savedMenuBlock);
    restoreMenuPosition(choiceIdx, savedMenuScrollTop, savedChoiceBlocksScrollTop, savedChoiceBlocksAtBottom);
    notify(ctx.blockIdx >= 0 ? t('choice_block_edited') : t('choice_block_added'), 'ok');
    return;
  }

  if (editingIndex >= 0) {
    blocks[editingIndex] = b;
  } else {
    const last = blocks[blocks.length - 1];
    if (last && last.type === 'custom' && last.code.trim() === 'return') {
      blocks.splice(blocks.length - 1, 0, b);
    } else {
      blocks.push(b);
    }
  }

  renderBlocks(); updateCodePreview();
  closeModal();
  notify(editingIndex >= 0 ? t('block_edited') : t('block_added'), 'ok');
}

function readModalValues() {
  const tp = pendingBlock.type;
  const b = { type: tp };
  const g = id => document.getElementById(id)?.value ?? undefined;
  const gb = id => document.getElementById(id)?.checked ?? false;

  switch (tp) {
    case 'narration':
      b.text = g('f-text') || '';
      if (!b.text.trim()) { notify(t('text_empty'), 'err'); return null; }
      break;
    case 'dialogue':
      b.character = g('f-char') || '';
      b.expression = g('f-expr') || '';
      b.text = g('f-text') || '';
      b.thought = gb('f-thought');
      if (!b.character) { notify(t('select_character'), 'err'); return null; }
      if (!b.text.trim()) { notify(t('text_empty'), 'err'); return null; }
      break;
    case 'show':
      b.image = g('f-image') || '';
      b.position = g('f-pos') || '';
      b.behind = (g('f-behind') || '').trim();
      b.transition = g('f-trans') || '';
      b.flipH = gb('f-flip');
      b.blur = gb('f-blur');
      if (!b.image) { notify(t('select_image'), 'err'); return null; }
      break;
    case 'show_multi': {
      const sps = readSpriteRows('sm', true);
      if (!sps.length) { notify(t('add_one_sprite'), 'err'); return null; }
      b.sprites = sps;
      b.transition = document.getElementById('sm-trans')?.value || '';
      break;
    }
    case 'hide':
      b.image = g('f-image') || '';
      b.transition = g('f-trans') || '';
      if (!b.image) { notify(t('write_image_name'), 'err'); return null; }
      break;
    case 'hide_multi': {
      const sps = readSpriteRows('hm', false);
      if (!sps.length) { notify(t('add_one_sprite'), 'err'); return null; }
      b.sprites = sps;
      b.transition = document.getElementById('hm-trans')?.value || '';
      break;
    }
    case 'scene':
      b.background = g('f-bg') || '';
      if (!b.background) { notify(t('select_background'), 'err'); return null; }
      b.transition = g('f-trans') || '';
      b.blur = gb('f-blur');
      break;
    case 'solid': {
      let color = (g('f-solid-hex') || '').trim();
      if (color && !color.startsWith('#')) color = '#' + color;
      if (!parseHexColor(color)) { notify(t('solid_invalid_color'), 'err'); return null; }
      b.color = color;
      b.name = (g('f-solid-name') || '').trim().replace(/\s+/g, '_');
      if (!/^[A-Za-z_]\w*$/.test(b.name)) { notify(t('solid_invalid_name'), 'err'); return null; }
      b.transition = g('f-trans') || '';
      break;
    }
    case 'label':
      b.name = (g('f-name') || '').trim().replace(/\s+/g, '_');
      if (!b.name) { notify(t('label_empty'), 'err'); return null; }
      if (document.getElementById('f-pos-end')) {
        b.endOfFile = gb('f-pos-end');
      }
      break;
    case 'menu': {
      const list = document.getElementById('choices-list');
      const choices = [];
      for (let i = 0; i < list.children.length; i++) {
        const txt = document.getElementById('ct-' + i)?.value || '';
        let choiceBlocks = [];
        try { choiceBlocks = JSON.parse(document.getElementById('cb-' + i)?.value || '[]'); } catch (e) {}
        if (txt) choices.push({ text: txt, action: 'blocks', jump: '', code: '', blocks: choiceBlocks });
      }
      if (!choices.length) { notify(t('add_one_option'), 'err'); return null; }
      b.choices = choices;
      // Menu character choice display
      if (gb('f-menu-show-char')) {
        b.showCharacterChoice = true;
        b.choiceCharacter = g('f-menu-sprite') || '';
      }
      b.choicePosition = document.querySelector('input[name="f-choice-pos"]:checked')?.value || 'center';
      break;
    }
    case 'condition': {
      b.condition = (g('f-cond') || '').trim();
      if (!b.condition) { notify(t('write_condition'), 'err'); return null; }
      try {
        b.blocks = JSON.parse(document.getElementById('ifb')?.value || '[]');
      } catch (e) {
        b.blocks = [];
      }
      b.elifBlocks = readConditionElifs();
      for (const eb of b.elifBlocks) {
        if (!eb.condition) { notify(t('write_elif_condition'), 'err'); return null; }
      }
      b.hasElse = !!document.getElementById('f-cond-has-else')?.classList.contains('active');
      try {
        b.elseBlocks = JSON.parse(document.getElementById('ifeb')?.value || '[]');
      } catch (e) {
        b.elseBlocks = [];
      }
      if (!b.hasElse) b.elseBlocks = [];
      break;
    }
    case 'pause':
      b.duration = g('f-dur') ? parseFloat(g('f-dur')) || null : null;
      break;
    case 'music':
      b.action = document.querySelector('input[name="f-action"]:checked')?.value || 'play';
      b.file = g('f-file') || '';
      b.loop = gb('f-loop');
      if (b.action !== 'stop' && !b.file) { notify(t('write_audio_file'), 'err'); return null; }
      break;
    case 'jump':
      b.label = (g('f-label') || '').trim();
      if (!b.label) { notify(t('write_label_dest'), 'err'); return null; }
      break;
    case 'call':
      b.label = (g('f-label') || '').trim();
      if (!b.label) { notify(t('write_label_dest'), 'err'); return null; }
      break;
    case 'comment':
      b.text = g('f-text') || '';
      break;
    case 'custom':
      b.code = g('f-code') || '';
      break;
  }
  return b;
}

// ═══════════════════════════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════════════
function buildCharOptions(selected) {
  const chars = data.characters.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.displayName} (${c.id})</option>`).join('');
  const extras = ['Narrador', 'Alumnos', 'Interrogacion', 'LuccoExtrano', 'MarioExtrano', 'AntonExtrano', 'CoryExtrano', 'KitoExtrano', 'SergiExtrano', 'MasumiExtrana', 'ManoloExtrano', 'TochasExtrano'];
  const extraOpts = extras.map(e => `<option value="${e}" ${e === selected ? 'selected' : ''}>${e}</option>`).join('');
  return `<option value="">${t('select_opt')}</option>${chars}<optgroup label="${t('extras')}">${extraOpts}</optgroup>`;
}

function buildTransitionSelect(id, selected) {
  const transitions = ['', 'fade', 'dissolve', 'Dissolve(0.3)', 'Dissolve(0.5)', 'moveinleft', 'moveinright', 'moveoutleft', 'moveoutright', 'pixellate', 'wipeleft', 'wiperight'];
  return `<select class="form-select" id="${id}">
    ${transitions.map(t2 => `<option value="${t2}" ${t2 === selected ? 'selected' : ''}>${t2 || t('no_transition')}</option>`).join('')}
  </select>`;
}

function getAllImageKeys() {
  return data.characters.flatMap(c => c.images.map(i => i.key));
}

// Changing the character resets type and expression: nothing is shown until a type is chosen
function onDialogueCharChange() {
  const charId = document.getElementById('f-char')?.value || '';
  populateExpressionPicker(charId, '', null);
}

function onDialogueExprTypeChange() {
  const charId = document.getElementById('f-char')?.value || '';
  populateExpressionPicker(charId, '', readSpriteTypeSelect('f-expr-type'));
}

function onExpressionSelectChange() {
  const key = document.getElementById('f-expr')?.value || '';
  document.querySelectorAll('#expr-picker .img-option').forEach(el =>
    el.classList.toggle('selected', el.dataset.key === key));
}

// ── Visual background picker ──
function getSceneAssetType(key) {
  if (!key) return 'backgrounds';
  if (data.scenes.some(s => s.key === key)) return 'scenes';
  return 'backgrounds';
}

function switchScenePickerTab(type) {
  const isScenes = type === 'scenes';
  const bgTab = document.getElementById('scene-tab-backgrounds');
  const scTab = document.getElementById('scene-tab-scenes');
  const bgPanel = document.getElementById('scene-picker-backgrounds');
  const scPanel = document.getElementById('scene-picker-scenes');
  if (!bgTab || !scTab || !bgPanel || !scPanel) return;

  bgTab.classList.toggle('active', !isScenes);
  scTab.classList.toggle('active', isScenes);
  bgPanel.style.display = isScenes ? 'none' : '';
  scPanel.style.display = isScenes ? '' : 'none';
}

function renderSceneAssetPicker(type, selectedKey) {
  const pickerId = type === 'scenes' ? 'scene-picker-scenes' : 'scene-picker-backgrounds';
  const picker = document.getElementById(pickerId);
  if (!picker) return;

  const assets = type === 'scenes' ? data.scenes : data.backgrounds;
  if (!assets.length) {
    const msg = type === 'scenes' ? t('no_scenes_declared') : t('no_backgrounds_declared');
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${msg}</div>`;
    return;
  }

  picker.innerHTML = assets.map(asset => {
    const safeId = `sap-${type}-${encodeURIComponent(asset.key)}`;
    return `<div class="img-option ${asset.key === selectedKey ? 'selected' : ''}" onclick="selectSceneAsset('${type}','${asset.key.replace(/'/g, "\\'")}')" title="${asset.key}" id="${safeId}" style="aspect-ratio:16/9;overflow:hidden;">
      <img src="${getImageURL(asset.path)}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'" />
      <div class="lbl">${asset.key}</div>
    </div>`;
  }).join('');
}

function initializeScenePicker(selectedKey) {
  renderSceneAssetPicker('backgrounds', selectedKey);
  renderSceneAssetPicker('scenes', selectedKey);
  switchScenePickerTab(getSceneAssetType(selectedKey));
}

function selectSceneAsset(type, key) {
  ['scene-picker-backgrounds', 'scene-picker-scenes'].forEach(pid => {
    document.querySelectorAll('#' + pid + ' .img-option').forEach(el => el.classList.remove('selected'));
  });
  const safeId = `sap-${type}-${encodeURIComponent(key)}`;
  document.getElementById(safeId)?.classList.add('selected');
  document.getElementById('f-bg').value = key;
}

// ── Shown sprites picker for hide ──
function populateShownSpritesPicker(selectedImage) {
  const picker = document.getElementById('shown-sprites-picker');
  if (!picker) return;
  const shownKeys = getShownSprites();
  if (!shownKeys.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('no_shown_sprites')}</div>`;
    return;
  }
  const allImages = data.characters.flatMap(c => c.images);
  picker.innerHTML = shownKeys.map(key => {
    const img = allImages.find(im => im.key === key);
    return `<div class="img-option ${key === selectedImage ? 'selected' : ''}" onclick="selectShownSprite('${key}')" title="${key}" id="shsp-${key}">
      ${img ? `<img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />` : `<div style="height:60px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--text3)">${key}</div>`}
      <div class="lbl">${key}</div>
    </div>`;
  }).join('');
}

function selectShownSprite(key) {
  document.querySelectorAll('#shown-sprites-picker .img-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('shsp-' + key)?.classList.add('selected');
  document.getElementById('f-image').value = key;
}

// ── Hide multi pickers ──
function populateHMPicker(i, selectedImage, preferredType) {
  const charSel = document.getElementById('hm-char-' + i);
  if (!charSel) return;
  if (!charSel.value && selectedImage) {
    const chr = data.characters.find(c => c.images.some(im => im.key === selectedImage));
    if (chr) charSel.value = chr.id;
  }
  const charId = charSel.value || '';
  const picker = document.getElementById('hm-sprite-picker-' + i);
  if (!picker) return;
  const shownKeys = new Set(getShownSprites());
  const chr = data.characters.find(c => c.id === charId);
  const { type, types, images } = prepareTypedSpritePicker(`hm-type-${i}`, chr, selectedImage, preferredType, img => shownKeys.has(img.key));
  if (!chr) { picker.innerHTML = pickerMessage(t('select_character')); return; }
  if (!types.length) { picker.innerHTML = pickerMessage(t('no_char_images')); return; }
  if (type === null) { picker.innerHTML = pickerMessage(t('select_type_first')); return; }
  picker.innerHTML = images.map(img =>
    `<div class="img-option ${img.key === selectedImage ? 'selected' : ''}" onclick="selectSMSprite('hm',${i},'${img.key}')" title="${img.key}" id="hm-spi-${img.key}-${i}">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${spriteLabel(chr, img.key)}</div>
    </div>`).join('');
}

function populateHMShownSprites(existingSprites) {
  const picker = document.getElementById('hm-shown-sprites');
  if (!picker) return;
  const shownKeys = getShownSprites();
  const alreadySelected = new Set((existingSprites || []).map(s => s.image).filter(Boolean));
  const available = shownKeys.filter(k => !alreadySelected.has(k));
  if (!available.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('no_more_sprites_on_screen')}</div>`;
    return;
  }
  const allImages = data.characters.flatMap(c => c.images);
  picker.innerHTML = available.map(key => {
    const img = allImages.find(im => im.key === key);
    return `<div class="img-option" onclick="addHMSpriteFromShown('${key}')" title="${key}" id="hmsh-${key}" style="cursor:pointer;">
      ${img ? `<img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />` : `<div style="height:60px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--text3)">${key}</div>`}
      <div class="lbl">${key}</div>
    </div>`;
  }).join('');
}

function addHMSpriteFromShown(key) {
  const list = document.getElementById('hm-list');
  let targetIdx = -1;
  for (let j = 0; j < list.children.length; j++) {
    const img = document.getElementById('hm-img-' + j);
    if (img && !img.value.trim()) { targetIdx = j; break; }
  }
  if (targetIdx >= 0) {
    document.getElementById('hm-img-' + targetIdx).value = key;
    const chr = data.characters.find(c => c.images.some(im => im.key === key));
    if (chr) { const s = document.getElementById('hm-char-' + targetIdx); if (s) s.value = chr.id; }
    setTimeout(() => populateHMPicker(targetIdx, key), 30);
  } else {
    const i = list.children.length;
    const div = document.createElement('div');
    div.innerHTML = buildHideSpriteRowHtml({ image: key }, i);
    list.appendChild(div.firstElementChild);
    document.getElementById('hm-img-' + i).value = key;
    const chr = data.characters.find(c => c.images.some(im => im.key === key));
    if (chr) { const s = document.getElementById('hm-char-' + i); if (s) s.value = chr.id; }
    setTimeout(() => populateHMPicker(i, key), 30);
  }
  const el = document.getElementById('hmsh-' + key);
  if (el) el.remove();
  const picker = document.getElementById('hm-shown-sprites');
  if (picker && !picker.children.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('no_more_sprites_on_screen')}</div>`;
  }
}

// Expressions are only listed once a character and one of its types are selected.
// preferredType: undefined = deduce from selectedKey, null = none chosen.
function populateExpressionPicker(charId, selectedKey, preferredType) {
  const picker = document.getElementById('expr-picker');
  const exprSel = document.getElementById('f-expr');
  if (!picker) return;
  picker.classList.remove('fitted');
  picker.style.gridTemplateColumns = '';
  const chr = data.characters.find(c => c.id === charId) || null;
  const exprs = getCharExpressions(data.characters, chr, data.expressions);
  const types = [...new Set(exprs.map(e => getExpressionType(chr, e.key)))];

  let type = preferredType;
  if (type === undefined) {
    type = selectedKey && exprs.some(e => e.key === selectedKey) ? getExpressionType(chr, selectedKey) : null;
  }
  if (type !== null && !types.includes(type)) type = null;
  fillSpriteTypeSelect(document.getElementById('f-expr-type'), types, type);

  const shown = type === null ? [] : exprs.filter(e => getExpressionType(chr, e.key) === type);
  if (exprSel) {
    let opts = `<option value="">${t('no_transition')}</option>` +
      shown.map(e => `<option value="${e.key}" ${e.key === selectedKey ? 'selected' : ''}>${escHtml(expressionLabel(chr, e.key))}</option>`).join('');
    // Keep an expression that can't be listed (e.g. loaded from the script) so it isn't lost
    if (selectedKey && !shown.some(e => e.key === selectedKey)) {
      opts += `<option value="${escHtml(selectedKey)}" selected>${escHtml(selectedKey)}</option>`;
    }
    exprSel.innerHTML = opts;
  }

  if (!chr) { picker.innerHTML = pickerMessage(t('select_character_for_expr')); return; }
  if (!exprs.length) { picker.innerHTML = pickerMessage(t('no_expressions_char')); return; }
  if (type === null) { picker.innerHTML = pickerMessage(t('select_type_for_expr')); return; }
  picker.innerHTML = shown.map(e =>
    `<div class="img-option ${e.key === selectedKey ? 'selected' : ''}" onclick="selectExpression('${e.key}')" title="${e.key}" data-key="${e.key}">
      <img src="${getImageURL(e.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${escHtml(expressionLabel(chr, e.key))}</div>
    </div>`).join('');
  fitPickerToImages(picker);
}

// Size the tiles of a picker to its images (they are assumed to share one size):
// same proportions as the image, and a width that follows the image width.
function fitPickerToImages(picker) {
  const img = picker.querySelector('img');
  if (!img) return;
  const apply = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return;
    const tileW = Math.round(Math.max(90, Math.min(w / 2, 220)));
    picker.style.setProperty('--img-ratio', `${w} / ${h}`);
    picker.style.gridTemplateColumns = `repeat(auto-fill, ${tileW}px)`;
    picker.classList.add('fitted');
  };
  if (img.complete) apply();
  else img.addEventListener('load', apply, { once: true });
}

function selectExpression(key) {
  const sel = document.getElementById('f-expr');
  if (sel) sel.value = key;
  onExpressionSelectChange();
}

function onShowCharChange() {
  const charId = document.getElementById('f-char')?.value;
  const currentImage = document.getElementById('f-image')?.value;
  populateSpritePicker(charId, currentImage);
}

function onShowTypeChange() {
  const charId = document.getElementById('f-char')?.value;
  const currentImage = document.getElementById('f-image')?.value;
  populateSpritePicker(charId, currentImage, readSpriteTypeSelect('f-sprite-type'));
}

function populateSpritePicker(charId, selectedImage, preferredType) {
  const picker = document.getElementById('sprite-picker');
  if (!picker) return;
  const chr = data.characters.find(c => c.id === charId);
  const { type, images } = prepareTypedSpritePicker('f-sprite-type', chr, selectedImage, preferredType);
  if (!chr || !chr.images.length) { picker.innerHTML = pickerMessage(t('no_char_images')); return; }
  if (type === null) { picker.innerHTML = pickerMessage(t('select_type_first')); return; }
  picker.innerHTML = images.map(img =>
    `<div class="img-option ${img.key === selectedImage ? 'selected' : ''}" onclick="selectSpriteImage('${img.key}')" title="${img.key}" id="sp-${img.key}">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${spriteLabel(chr, img.key)}</div>
    </div>`).join('')
    || pickerMessage(t('no_char_images'));
}

function selectSpriteImage(key) {
  document.querySelectorAll('#sprite-picker .img-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('sp-' + key)?.classList.add('selected');
  document.getElementById('f-image').value = key;
}

// Character of a show block: stored one, else the owner of its image
function getShowBlockCharId(b) {
  if (b.character) return b.character;
  if (b.image) {
    const chr = findCharForSpriteKey(data.characters, b.image.split(/\s+/)[0]);
    if (chr) return chr.id;
  }
  return '';
}

function populateCharSelect(type, b) {
  if (type === 'show') {
    const charId = getShowBlockCharId(b) || (data.characters[0]?.id);
    const sel = document.getElementById('f-char');
    if (sel && charId) { sel.value = charId; populateSpritePicker(charId, b.image); }
    else if (sel) populateSpritePicker(sel.value, b.image);
  }
}

// ═══════════════════════════════════════════════════════════════════
// DECLARATIONS — opens separate window
// ═══════════════════════════════════════════════════════════════════
function openDeclarations() {
  if (!gamePath) { notify(t('open_project_first'), 'err'); return; }
  window.api.openDeclarationWindow();
}

// ═══════════════════════════════════════════════════════════════════
// MAIN MENU — opens separate window
// ═══════════════════════════════════════════════════════════════════
function openMainMenuEditor() {
  if (!gamePath) { notify(t('open_project_first'), 'err'); return; }
  window.api.openMainMenuWindow();
}

async function launchProjectFromEditor() {
  if (!gamePath) {
    notify(t('open_project_first'), 'err');
    return;
  }

  setStatus(t('launching_project'));
  const result = await window.api.launchRenpyProject();

  if (result?.ok) {
    setStatus(t('project_launched'), 'ok');
    notify(t('project_launched'), 'ok');
    return;
  }

  if (result?.error === 'cancelled') {
    setStatus(t('launch_cancelled'), 'err');
    notify(t('launch_cancelled'), 'err');
    return;
  }

  if (result?.error === 'invalid-executable') {
    notify(t('launch_invalid_executable'), 'err');
    return;
  }

  if (result?.error === 'invalid-project') {
    notify(t('launch_invalid_project'), 'err');
    return;
  }

  notify(t('launch_failed'), 'err');
}

// ═══════════════════════════════════════════════════════════════════
// REN'PY SDK — warning when it isn't installed and automatic install
// ═══════════════════════════════════════════════════════════════════
let renpyInstalling = false;
let renpyExecutablePath = '';

function updateRenpyPathLabel() {
  const el = document.getElementById('setting-renpy-path');
  if (!el) return;
  el.textContent = renpyExecutablePath || t('renpy_not_installed_short');
  el.title = renpyExecutablePath || '';
}

// On startup: if Ren'Py isn't found, explain that it's needed and offer to install it
async function checkRenpyInstallation() {
  const st = await window.api.checkRenpy();
  renpyExecutablePath = st.installed ? st.path : '';
  updateRenpyPathLabel();
  if (st.installed) {
    if (st.detected) notify(t('renpy_detected', st.path), 'ok');
    return true;
  }
  openRenpyDialog();
  return false;
}

function openRenpyDialog() {
  document.getElementById('renpy-body').innerHTML = `
    <p class="renpy-msg">${t('renpy_missing_message')}</p>
    <div class="renpy-actions">
      <button class="btn btn-primary" onclick="installRenpyAutomatically()">⬇️ ${t('renpy_install_auto')}</button>
      <button class="btn btn-secondary" onclick="window.api.openRenpyWebsite()">🌐 ${t('renpy_go_website')}</button>
      <button class="btn btn-secondary" onclick="selectRenpyExecutableManually()">📂 ${t('renpy_select_existing')}</button>
    </div>
    <div class="np-hint">${t('renpy_install_hint')}</div>
    <div id="renpy-progress" class="renpy-progress" style="display:none;">
      <div class="renpy-progress-text" id="renpy-progress-text"></div>
      <div class="renpy-bar"><div id="renpy-bar-fill"></div></div>
      <button class="btn btn-secondary btn-sm" id="renpy-cancel-btn" onclick="window.api.cancelRenpyInstall()">${t('cancel')}</button>
    </div>`;
  document.getElementById('renpy-later-btn').disabled = false;
  document.getElementById('renpy-overlay').classList.add('open');
}

function closeRenpyDialog() {
  if (renpyInstalling) return;
  document.getElementById('renpy-overlay').classList.remove('open');
}

function setRenpyDialogBusy(busy) {
  renpyInstalling = busy;
  document.querySelectorAll('#renpy-box .renpy-actions button, #renpy-later-btn').forEach(el => { el.disabled = busy; });
}

function formatMB(bytes) { return (bytes / 1048576).toFixed(1); }

function onRenpyInstallProgress(p) {
  const box = document.getElementById('renpy-progress');
  const text = document.getElementById('renpy-progress-text');
  const fill = document.getElementById('renpy-bar-fill');
  const cancel = document.getElementById('renpy-cancel-btn');
  if (!box || !text || !fill) return;
  box.style.display = '';
  fill.classList.remove('indeterminate');
  if (cancel) cancel.style.display = p.phase === 'resolve' || p.phase === 'download' ? '' : 'none';
  if (p.phase === 'resolve') {
    text.textContent = t('renpy_step_resolve');
    fill.classList.add('indeterminate');
  } else if (p.phase === 'download') {
    const pct = p.total ? Math.round(p.received / p.total * 100) : 0;
    text.textContent = p.total
      ? t('renpy_step_download', formatMB(p.received), formatMB(p.total), pct)
      : t('renpy_step_download_unknown', formatMB(p.received));
    fill.style.width = pct + '%';
    if (!p.total) fill.classList.add('indeterminate');
  } else if (p.phase === 'extract') {
    text.textContent = t('renpy_step_extract');
    fill.classList.add('indeterminate');
  } else if (p.phase === 'done') {
    text.textContent = t('renpy_step_done');
    fill.style.width = '100%';
  }
}

async function installRenpyAutomatically() {
  if (renpyInstalling) return;
  setRenpyDialogBusy(true);
  const res = await window.api.installRenpy();
  setRenpyDialogBusy(false);
  if (res?.ok) {
    renpyExecutablePath = res.path;
    updateRenpyPathLabel();
    notify(t('renpy_installed', res.version || ''), 'ok');
    document.getElementById('renpy-overlay').classList.remove('open');
    return;
  }
  if (res?.error === 'cancelled') return;
  const msg = res?.error === 'aborted' ? t('renpy_install_aborted') : t('renpy_install_failed', res?.message || '');
  const text = document.getElementById('renpy-progress-text');
  if (text) { text.textContent = msg; document.getElementById('renpy-progress').style.display = ''; }
  const fill = document.getElementById('renpy-bar-fill');
  if (fill) { fill.classList.remove('indeterminate'); fill.style.width = '0%'; }
  const cancel = document.getElementById('renpy-cancel-btn');
  if (cancel) cancel.style.display = 'none';
  notify(msg, 'err');
}

async function selectRenpyExecutableManually() {
  const exe = await window.api.selectRenpyExecutable();
  if (!exe) return;
  renpyExecutablePath = exe;
  updateRenpyPathLabel();
  notify(t('renpy_path_saved'), 'ok');
  document.getElementById('renpy-overlay').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════════
// NEW REN'PY PROJECT
// Same options as the Ren'Py launcher: name, resolution and GUI colors
// ═══════════════════════════════════════════════════════════════════
const PROJECT_RESOLUTIONS = [[1280, 720], [1920, 1080], [2560, 1440], [3840, 2160]];
// Launcher color themes: [accent, background, light]
const PROJECT_THEMES = [
  ...['#0099cc', '#99ccff', '#66cc00', '#cccc00', '#cc6600', '#0066cc', '#9933ff', '#00cc99', '#cc0066', '#cc0000']
    .map(c => [c, '#000000', false]),
  ...['#003366', '#0099ff', '#336600', '#000000', '#cc6600', '#000066', '#660066', '#006666', '#cc0066', '#990000']
    .map(c => [c, '#ffffff', true])
];
let projectsDirectory = '';
let selectedProjectTheme = 0;
let creatingProject = false;

function updateProjectsDirLabel() {
  const el = document.getElementById('setting-projects-dir');
  if (!el) return;
  el.textContent = projectsDirectory || t('projects_dir_not_set');
  el.title = projectsDirectory || '';
}

async function changeProjectsDirectory() {
  const dir = await window.api.selectProjectsDirectory();
  if (!dir) return;
  projectsDirectory = dir;
  updateProjectsDirLabel();
  notify(t('projects_dir_saved'), 'ok');
}

async function newProject() {
  // If the projects folder isn't set (or no longer exists) the folder dialog opens first
  const dir = await window.api.ensureProjectsDirectory();
  if (!dir) return;
  projectsDirectory = dir;
  updateProjectsDirLabel();
  openProjectDialog();
}

function openProjectDialog() {
  selectedProjectTheme = 0;
  document.getElementById('project-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">${t('project_name')}</label>
      <input class="form-input" id="np-name" maxlength="60" placeholder="${t('project_name_placeholder')}" oninput="updateProjectLocation()">
      <div class="np-hint" id="np-location"></div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('project_resolution')}</label>
      <select class="form-select" id="np-size" onchange="onProjectSizeChange()">
        ${PROJECT_RESOLUTIONS.map(([w, h]) => `<option value="${w}x${h}" ${w === 1920 ? 'selected' : ''}>${w}x${h}</option>`).join('')}
        <option value="custom">${t('project_resolution_custom')}</option>
      </select>
      <div class="np-hint">${t('project_resolution_hint')}</div>
    </div>
    <div class="form-row" id="np-custom-size" style="display:none;">
      <div class="form-group"><label class="form-label">${t('project_width')}</label><input class="form-input" id="np-width" type="number" min="1" value="1920"></div>
      <div class="form-group"><label class="form-label">${t('project_height')}</label><input class="form-input" id="np-height" type="number" min="1" value="1080"></div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('project_theme')}</label>
      <div class="np-theme-label">${t('project_theme_dark')}</div>
      <div class="np-themes">${PROJECT_THEMES.map((th, i) => th[2] ? '' : projectThemeSwatch(th, i)).join('')}</div>
      <div class="np-theme-label">${t('project_theme_light')}</div>
      <div class="np-themes">${PROJECT_THEMES.map((th, i) => th[2] ? projectThemeSwatch(th, i) : '').join('')}</div>
    </div>
    <div id="np-progress" class="np-progress" style="display:none;"></div>`;
  setProjectDialogBusy(false);
  document.getElementById('project-overlay').classList.add('open');
  updateProjectLocation();
  setTimeout(() => document.getElementById('np-name')?.focus(), 30);
}

function projectThemeSwatch([accent, boring], i) {
  return `<button type="button" class="np-theme ${i === selectedProjectTheme ? 'selected' : ''}" id="np-theme-${i}"
    style="background:${boring};" onclick="selectProjectTheme(${i})" title="${accent}">
    <span style="background:${accent};"></span>
  </button>`;
}

function selectProjectTheme(i) {
  selectedProjectTheme = i;
  document.querySelectorAll('.np-theme').forEach(el => el.classList.remove('selected'));
  document.getElementById('np-theme-' + i)?.classList.add('selected');
}

function onProjectSizeChange() {
  const custom = document.getElementById('np-size').value === 'custom';
  document.getElementById('np-custom-size').style.display = custom ? '' : 'none';
}

function updateProjectLocation() {
  const name = (document.getElementById('np-name')?.value || '').trim();
  const el = document.getElementById('np-location');
  if (el) el.textContent = t('project_location', projectsDirectory.replace(/[\\/]+$/, '') + (name ? '\\' + name : ''));
}

function closeProjectDialog() {
  if (creatingProject) return;
  document.getElementById('project-overlay').classList.remove('open');
}

function setProjectDialogBusy(busy) {
  creatingProject = busy;
  document.querySelectorAll('#project-box button, #project-box input, #project-box select')
    .forEach(el => { el.disabled = busy; });
}

function showProjectProgress(msg, type = '') {
  const el = document.getElementById('np-progress');
  if (!el) return;
  el.style.display = '';
  el.className = 'np-progress ' + type;
  el.textContent = msg;
}

async function createProject() {
  if (creatingProject) return;
  const name = (document.getElementById('np-name')?.value || '').trim();
  if (!name) { notify(t('project_name_empty'), 'err'); return; }
  if (!/^[A-Za-z0-9 _]+$/.test(name)) { notify(t('project_name_invalid'), 'err'); return; }

  let width, height;
  const size = document.getElementById('np-size').value;
  if (size === 'custom') {
    width = parseInt(document.getElementById('np-width').value, 10);
    height = parseInt(document.getElementById('np-height').value, 10);
    if (!(width > 0 && height > 0)) { notify(t('project_size_invalid'), 'err'); return; }
  } else {
    [width, height] = size.split('x').map(Number);
  }
  const [accent, boring, light] = PROJECT_THEMES[selectedProjectTheme];

  if (blocks.length > 0 && !await showConfirm(t('project_discard_blocks', blocks.length), { type: 'warning' })) return;

  setProjectDialogBusy(true);
  showProjectProgress(t('project_step_generating'));
  let result;
  try {
    result = await window.api.createRenpyProject({ name, width, height, accent, boring, light });
  } catch (e) {
    result = { ok: false, error: 'generate-failed', message: e.message };
  }
  setProjectDialogBusy(false);

  if (!result?.ok) {
    const errors = {
      'invalid-name': t('project_name_invalid'),
      'invalid-size': t('project_size_invalid'),
      'no-projects-dir': t('projects_dir_not_set'),
      'project-exists': t('project_exists', result?.path || name),
      'cancelled': t('launch_cancelled'),
      'invalid-sdk': t('project_invalid_sdk', result?.path || ''),
      'generate-failed': t('project_generate_failed', result?.message || '')
    };
    const msg = errors[result?.error] || t('project_generate_failed', result?.message || '');
    showProjectProgress(msg, 'err');
    notify(msg, 'err');
    return;
  }

  // Open the new project in the editor
  document.getElementById('project-overlay').classList.remove('open');
  resetManualCodePreview();
  blocks = [];
  activeRpyFile = 'script.rpy';
  gamePath = result.gamePath;
  await loadProjectData();
  renderAssetBrowser();
  renderBlocks();
  updateCodePreview();
  setStatus(gamePath, 'ok');
  notify(t('project_created', name), 'ok');
}

// ═══════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════
function setStatus(msg, type = '') {
  const el = document.getElementById('status-bar');
  el.textContent = msg;
  el.className = type === 'ok' ? 'status-ok' : type === 'err' ? 'status-err' : '';
}

let notifTimer;
function notify(msg, type = 'ok') {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.className = type;
  el.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ═══════════════════════════════════════════════════════════════════
// PANEL RESIZE
// ═══════════════════════════════════════════════════════════════════
(function () {
  const handle = document.getElementById('panel-resize-handle');
  const panelCode = document.getElementById('panel-code');
  let isDragging = false, startX, startW;

  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startW = panelCode.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = startX - e.clientX;
    const newW = Math.max(280, Math.min(startW + delta, window.innerWidth * 0.7));
    panelCode.style.width = newW + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    // Save the new panel size
    const finalWidth = panelCode.offsetWidth;
    window.api.saveSettings({ panelSizes: { panelCode: finalWidth } }).catch(e => {});
  });
})();

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════
(async function init() {
  // Load settings
  const s = await window.api.getSettings();
  customTheme = { ...CUSTOM_THEME_DEFAULT, ...(s.customTheme || {}) };
  if (s.theme) {
    applyTheme(s);
    document.getElementById('setting-theme').value = s.theme;
  }
  if (s.language) {
    document.getElementById('setting-lang').value = s.language;
    await loadI18n(s.language);
  } else {
    await loadI18n('es');
  }
  
  // Restore panel sizes
  if (s.panelSizes) {
    if (s.panelSizes.panelCode) {
      const panelCode = document.getElementById('panel-code');
      if (panelCode) panelCode.style.width = s.panelSizes.panelCode + 'px';
    }
    if (s.panelSizes.panelAssets) {
      const panelAssets = document.getElementById('panel-assets');
      if (panelAssets) panelAssets.style.width = s.panelSizes.panelAssets + 'px';
    }
  }
  
  projectsDirectory = s.projectsDirectory || '';

  applyI18n();
  updateProjectsDirLabel();
  updateRenpyPathLabel();
  renderCustomThemeEditor(s.theme);
  initSpellcheckSettings(s);
  renderBlocks();
  updateCodePreview();
  new ResizeObserver(scaleScenePreview).observe(document.getElementById('scene-preview'));

  window.api.onRenpyInstallProgress(onRenpyInstallProgress);

  window.api.onProjectCreationProgress((step) => {
    if (creatingProject) showProjectProgress(t('project_step_' + step.replace(/-/g, '_')));
  });

  const codePreview = document.getElementById('code-preview');
  if (codePreview) {
    codePreview.setAttribute('contenteditable', 'true');
    codePreview.setAttribute('spellcheck', 'false');
    codePreview.addEventListener('focus', enterCodePreviewEdit);
    codePreview.addEventListener('blur', exitCodePreviewEdit);
    codePreview.addEventListener('input', () => {
      codePreviewDirty = true;
      syncManualCodePreview();
      pushUndoState();
      scheduleEditingHighlight();
      scheduleBlocksFromManualText();
    });
    codePreview.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (text) insertTextAtCursor(text.replace(/\r\n/g, '\n'));
      codePreviewDirty = true;
      syncManualCodePreview();
      pushUndoState();
      scheduleEditingHighlight();
      scheduleBlocksFromManualText();
    });
    codePreview.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoCodePreview();
        else undoCodePreview();
        return;
      }
      if (e.ctrlKey && key === 'y') {
        e.preventDefault();
        redoCodePreview();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        insertTextAtCursor('    ');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const indent = getCurrentLineIndent(codePreview);
        insertTextAtCursor('\n' + indent);
        codePreviewDirty = true;
        syncManualCodePreview();
        pushUndoState();
        scheduleEditingHighlight();
        scheduleBlocksFromManualText();
      }
    });
  }

  // Try to auto-load last project
  const lastPath = await window.api.loadLastProject();
  if (lastPath) {
    gamePath = lastPath;
    await loadProjectData();
    renderAssetBrowser();
    renderBlocks();
    updateCodePreview();
    setStatus(gamePath, 'ok');
    notify(t('active_file', activeRpyFile), 'ok');
  }

  // Warn if Ren'Py isn't installed (offers to download and install it)
  await checkRenpyInstallation();

  // Listen for reload events from declaration window
  window.api.onReloadData(async () => {
    if (gamePath) {
      await loadProjectData();
      renderAssetBrowser();
      notify('Datos recargados', 'ok');
    }
  });

  // Dialogs requested by the main process (e.g. image folder migration)
  window.api.onShowAppDialog(opts => showDialog(opts));

  // Listen for settings changes from other windows
  window.api.onSettingsChanged((s) => {
    // This window owns the custom colors, so keep the local copy (avoids flicker while dragging)
    applyTheme({ ...s, customTheme });
    if (s.language && s.language !== currentLang) {
      loadI18n(s.language).then(() => { applyI18n(); renderBlocks(); renderCustomThemeEditor(s.theme); });
    }
  });

  // Listen for external file changes in the game folder
  window.api.onFileChanged(async (filename) => {
    if (!gamePath) return;
    await loadProjectData();
    renderAssetBrowser();
    renderBlocks();
    updateCodePreview();
    notify(t('files_reloaded') || `Archivo actualizado: ${filename}`, 'ok');
  });
})();

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// Close settings panel on click outside
document.addEventListener('click', (e) => {
  if (settingsOpen && !e.target.closest('#settings-panel') && !e.target.closest('[onclick*="toggleSettings"]')) {
    settingsOpen = false;
    document.getElementById('settings-panel').classList.remove('open');
  }
});
