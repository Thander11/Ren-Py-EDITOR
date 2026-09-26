// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Declaration Window Renderer
// ═══════════════════════════════════════════════════════════

let gamePath = '';
let translations = {};

// Image subfolders (relative to game/images/) used by the editor
const IMAGE_DIRS = {
  characters: 'characters',
  backgrounds: 'backgrounds',
  scenes: 'scenes',
  expressions: 'expressions'
};
let currentLang = 'es';

function getImageURL(relativePath) {
  if (!gamePath) return '';
  const absPath = gamePath.replace(/\\/g, '/') + '/images/' + relativePath;
  const parts = absPath.split('/');
  const encoded = parts.map((s, i) => {
    if (i === 0 && /^[a-zA-Z]:$/.test(s)) return s;
    return encodeURIComponent(s);
  }).join('/');
  return 'file:///' + encoded;
}

// Parsed data
let characters = [];   // { id, displayName, imageAttr, images[] }
let backgrounds = [];  // { key, path }
let scenes = [];       // { key, path }
let expressions = [];  // { charId, key, path }
let transformsAnim = ''; // raw text of animations.rpy
let transformsPos = '';  // raw text of positions.rpy

// ── I18N ──
async function loadI18n(lang) {
  try {
    const raw = await window.declApi.readI18n(lang);
    translations = JSON.parse(raw);
    currentLang = lang;
  } catch (e) { translations = {}; }
}
function t(key, ...args) {
  let str = translations[key] || key;
  args.forEach((a, i) => { str = str.replace(`{${i}}`, a); });
  return str;
}
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.getAttribute('data-i18n'));
    if (val !== el.getAttribute('data-i18n')) el.textContent = val;
  });
}

// ── TABS ──
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name)?.classList.add('active');
  const tabs = document.querySelectorAll('.tab');
  const tabNames = ['characters', 'sprites', 'expressions', 'backgrounds', 'scenes', 'animations', 'positions'];
  const idx = tabNames.indexOf(name);
  if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');

  if (name === 'sprites') { populateCharSelector('sp-char'); loadCharSprites(); }
  if (name === 'expressions') { populateCharSelector('ex-char'); loadCharExpressions(); }
  if (name === 'backgrounds') loadBackgrounds();
  if (name === 'scenes') loadScenes();
  if (name === 'animations') loadAnimations();
  if (name === 'positions') loadPositions();
}

function populateCharSelector(selId) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = characters.map(c =>
    `<option value="${c.id}">${c.displayName} (${c.id})</option>`).join('');
}

// ═══════════════════════════════════════════════════════════
// LOAD DATA
// ═══════════════════════════════════════════════════════════
async function loadAllData() {
  gamePath = await window.declApi.getGamePath();
  if (!gamePath) return;

  const ptxt = await window.declApi.readFile('characters.rpy');
  const ftxt = await window.declApi.readFile('backgrounds.rpy');
  const stxt = await window.declApi.readFile('scenes.rpy');
  const etxt = await window.declApi.readFile('expressions.rpy');
  transformsAnim = await window.declApi.readFile('animations.rpy') || '';
  transformsPos = await window.declApi.readFile('positions.rpy') || '';

  characters = []; backgrounds = []; scenes = []; expressions = [];
  if (ptxt) parsePersonajes(ptxt);
  if (ftxt) parseFondos(ftxt);
  if (stxt) parseScenes(stxt);
  if (etxt) parseExpresiones(etxt);

  renderCharList();
}

function parsePersonajes(text) {
  const chars = {};
  const order = [];
  const defineRe = /define\s+(\w+)\s*=\s*Character\s*\(\s*"([^"]+)"(?:.*?image\s*=\s*"([^"]+)")?/g;
  let m;
  while ((m = defineRe.exec(text)) !== null) {
    const id = m[1], name = m[2], img = m[3] || '';
    if (!chars[id]) { chars[id] = { id, displayName: name, imageAttr: img, images: [] }; order.push(id); }
  }
  const imageRe = /^image\s+(\w+)\s*=\s*"([^"]+)"/gm;
  const charList = order.map(id => chars[id]);
  while ((m = imageRe.exec(text)) !== null) {
    const key = m[1], path = m[2];
    const chr = findCharForSpriteKey(charList, key);
    if (chr) chr.images.push({ key, path });
  }
  characters = charList;
}

function parseFondos(text) {
  const re = /^image\s+(.+?)\s*=\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(text)) !== null) backgrounds.push({ key: m[1], path: m[2] });
}

function parseScenes(text) {
  const re = /^image\s+(.+?)\s*=\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(text)) !== null) scenes.push({ key: m[1], path: m[2] });
}

function parseExpresiones(text) {
  const re = /^image\s+side\s+(\w+)\s+(\w+)\s*=\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(text)) !== null) expressions.push({ charId: m[1], key: m[2], path: m[3] });
}

// ═══════════════════════════════════════════════════════════
// CHARACTERS TAB
// ═══════════════════════════════════════════════════════════
let editingCharIdx = -1; // -1 = adding, >= 0 = editing index

function populateExpressionDropdown() {
  const sel = document.getElementById('nc-image');
  if (!sel) return;
  // Get unique expression charIds (image attributes)
  const attrs = [...new Set(expressions.map(e => e.charId))];
  sel.innerHTML = `<option value="">${t('no_expressions_option')}</option>` +
    attrs.map(a => `<option value="${a}">${a}</option>`).join('');
}

function showAddCharForm(editIdx) {
  editingCharIdx = (editIdx !== undefined) ? editIdx : -1;
  const form = document.getElementById('add-char-form');
  const label = document.getElementById('edit-char-label');
  form.style.display = '';
  populateExpressionDropdown();

  if (editingCharIdx >= 0) {
    const c = characters[editingCharIdx];
    document.getElementById('nc-id').value = c.id;
    document.getElementById('nc-name').value = c.displayName;
    document.getElementById('nc-image').value = c.imageAttr || '';
    label.style.display = '';
  } else {
    document.getElementById('nc-id').value = '';
    document.getElementById('nc-name').value = '';
    document.getElementById('nc-image').value = '';
    label.style.display = 'none';
  }
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideAddCharForm() {
  document.getElementById('add-char-form').style.display = 'none';
  editingCharIdx = -1;
}

async function saveCharacter() {
  const id = document.getElementById('nc-id').value.trim();
  const name = document.getElementById('nc-name').value.trim();
  const imageAttr = document.getElementById('nc-image').value.trim();
  if (!id || !name) { notify(t('fill_all_fields'), 'err'); return; }

  if (editingCharIdx >= 0) {
    // ── EDIT existing character ──
    const oldChar = characters[editingCharIdx];
    const ptxt = await window.declApi.readFile('characters.rpy') || '';
    const lines = ptxt.split('\n');

    // Update define line
    const defineRe = new RegExp(`^define\\s+${oldChar.id}\\s*=\\s*Character\\s*\\(`);
    for (let i = 0; i < lines.length; i++) {
      if (defineRe.test(lines[i])) {
        const imgPart = imageAttr ? `, image = "${imageAttr}"` : '';
        lines[i] = `define ${id} = Character("${name}"${imgPart})`;
        break;
      }
    }

    // If id changed, update image lines too
    if (oldChar.id !== id) {
      const imgRe = new RegExp(`^image\\s+${oldChar.id}_`);
      for (let i = 0; i < lines.length; i++) {
        if (imgRe.test(lines[i])) {
          lines[i] = lines[i].replace(new RegExp(`^image\\s+${oldChar.id}_`), `image ${id}_`);
        }
      }
      // Update images in memory
      oldChar.images.forEach(img => {
        img.key = img.key.replace(new RegExp(`^${oldChar.id}_`), `${id}_`);
      });
    }

    await window.declApi.writeFile('characters.rpy', lines.join('\n'));
    oldChar.id = id;
    oldChar.displayName = name;
    oldChar.imageAttr = imageAttr;
    renderCharList();
    hideAddCharForm();
    notifyMainReload();
    notify(t('char_edited', id), 'ok');
  } else {
    // ── ADD new character ──
    if (characters.find(c => c.id === id)) { notify(t('char_exists', id), 'err'); return; }
    const isUnknown = document.getElementById('nc-unknown') && document.getElementById('nc-unknown').checked;
    const ptxt = await window.declApi.readFile('characters.rpy') || '';
    const imgPart = imageAttr ? `, image = "${imageAttr}"` : '';
    const defineLine = `define ${id} = Character("${name}"${imgPart})`;
    
    let newText = '';
    if (isUnknown) {
      const lines = ptxt.split('\n');
      const headerIdx = lines.findIndex(l => l.trim().toLowerCase() === '# unknown');
      if (headerIdx !== -1) {
        lines.splice(headerIdx + 1, 0, defineLine);
        newText = lines.join('\n');
      } else {
        newText = '# Unknown\n' + defineLine + '\n\n' + ptxt.trimStart() + '\n';
      }
    } else {
      newText = ptxt.trimEnd() + '\n\n' + defineLine + '\n';
    }
    
    await window.declApi.writeFile('characters.rpy', newText);
    
    if (isUnknown) {
      characters.unshift({ id, displayName: name, imageAttr, images: [] });
    } else {
      characters.push({ id, displayName: name, imageAttr, images: [] });
    }
    
    renderCharList();
    hideAddCharForm();
    notifyMainReload();
    notify(t('char_added', id), 'ok');
  }
}

async function deleteCharacter(idx) {
  const c = characters[idx];
  if (!confirm(t('confirm_delete_char', c.displayName))) return;

  const ptxt = await window.declApi.readFile('characters.rpy') || '';
  const lines = ptxt.split('\n');
  const filtered = lines.filter(line => {
    if (new RegExp(`^define\\s+${c.id}\\s*=`).test(line)) return false;
    if (new RegExp(`^image\\s+${c.id}_`).test(line)) return false;
    return true;
  });
  await window.declApi.writeFile('characters.rpy', filtered.join('\n'));

  // Offer to delete image files
  if (c.images.length > 0) {
    const del = confirm(t('confirm_delete_char_files'));
    if (del) {
      for (const img of c.images) {
        if (img.path) await window.declApi.deleteImage(img.path);
      }
    }
  }

  characters.splice(idx, 1);
  renderCharList();
  notifyMainReload();
  notify(t('char_deleted', c.displayName), 'ok');
}

function renderCharList() {
  const list = document.getElementById('char-list');
  if (!characters.length) {
    list.innerHTML = `<div style="color:var(--text3);text-align:center;padding:20px;">${t('no_chars')}</div>`;
    return;
  }
  list.innerHTML = characters.map((c, i) =>
    `<div class="item-row">
      <span class="item-name">${c.displayName}</span>
      <span class="item-detail">${c.id}${c.imageAttr ? ' — expr="' + c.imageAttr + '"' : ''} — ${c.images.length} sprites</span>
      <span class="item-actions">
        <button onclick="showAddCharForm(${i})" title="${t('edit_item')}">✏️</button>
        <button onclick="deleteCharacter(${i})" title="${t('delete_item')}">🗑️</button>
      </span>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// SPRITES TAB
// Sprite keys: <charId>_<type>_<id>. Listed grouped by character and type.
// ═══════════════════════════════════════════════════════════
function onSpriteCharChange() {
  loadCharSprites();
}

function refreshSpriteTypeSuggestions() {
  const dl = document.getElementById('sp-variant-list');
  if (!dl) return;
  const chr = characters.find(c => c.id === document.getElementById('sp-char')?.value);
  dl.innerHTML = getSpriteTypes(chr).filter(Boolean).map(tp => `<option value="${tp}">`).join('');
}

function loadCharSprites() {
  refreshSpriteTypeSuggestions();
  const list = document.getElementById('sprite-list');
  if (!list) return;
  if (!characters.length) {
    list.innerHTML = `<div class="empty-msg">${t('no_chars')}</div>`;
    return;
  }
  const selectedId = document.getElementById('sp-char')?.value;
  list.innerHTML = characters.map(chr => {
    const groups = groupSpritesByType(chr);
    const body = groups.length
      ? groups.map(g => `
        <div class="sprite-type-group">
          <div class="sprite-type-title">${g.type || t('no_type')} <span class="group-meta">(${g.images.length})</span></div>
          <div class="preview-grid">
            ${g.images.map(img => {
              const idx = chr.images.indexOf(img);
              const { id } = parseSpriteKey(chr.id, img.key);
              return `<div class="preview-item" title="${img.key}">
                <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
                <div class="lbl">${id}</div>
                <div class="item-actions" style="margin-top:4px;">
                  <button onclick="showSpriteEditForm('${chr.id}', ${idx})" title="${t('edit_item')}">✏️</button>
                  <button onclick="deleteSprite('${chr.id}', ${idx})" title="${t('delete_item')}">🗑️</button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`).join('')
      : `<div class="empty-msg">${t('no_sprites_char')}</div>`;
    return `<details class="sprite-char-group" data-char="${chr.id}" ${chr.id === selectedId ? 'open' : ''} ontoggle="onSpriteGroupToggle(this)">
      <summary>
        <span class="group-title">${chr.displayName}</span>
        <span class="group-meta">${chr.id} — ${t('sprites_count', chr.images.length)} · ${t('types_count', groups.length)}</span>
      </summary>
      ${body}
    </details>`;
  }).join('');
}

// Opening a character group selects it as the target for new sprites
function onSpriteGroupToggle(el) {
  if (!el.open) return;
  const sel = document.getElementById('sp-char');
  if (sel && sel.value !== el.dataset.char) {
    sel.value = el.dataset.char;
    refreshSpriteTypeSuggestions();
  }
}

// ── Sprite edit ──
let editingSpriteCharId = '';
let editingSpriteIdx = -1;
let newSpriteImagePath = '';

function showSpriteEditForm(charId, imgIdx) {
  editingSpriteCharId = charId;
  editingSpriteIdx = imgIdx;
  newSpriteImagePath = '';
  const chr = characters.find(c => c.id === charId);
  if (!chr) return;
  const img = chr.images[imgIdx];
  const { type, id } = parseSpriteKey(charId, img.key);
  document.getElementById('se-char').textContent = `${chr.displayName} (${chr.id})`;
  document.getElementById('se-type').value = type;
  document.getElementById('se-id').value = id;
  document.getElementById('se-file').textContent = t('no_file_selected');
  document.getElementById('se-preview').innerHTML =
    `<img src="${getImageURL(img.path)}" style="max-height:80px;border-radius:4px;" onerror="this.style.display='none'" />`;
  const form = document.getElementById('sprite-edit-form');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideSpriteEditForm() {
  document.getElementById('sprite-edit-form').style.display = 'none';
  editingSpriteIdx = -1;
  newSpriteImagePath = '';
}

async function selectSpriteImage() {
  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;
  newSpriteImagePath = files[0];
  const fileName = newSpriteImagePath.split(/[/\\]/).pop();
  document.getElementById('se-file').textContent = fileName;
}

async function saveSpriteEdit() {
  const chr = characters.find(c => c.id === editingSpriteCharId);
  if (!chr || editingSpriteIdx < 0) return;
  const img = chr.images[editingSpriteIdx];
  const newType = sanitizeSpriteType(document.getElementById('se-type').value);
  const newId = sanitizeSpriteId(document.getElementById('se-id').value);
  if (!newType || !newId) { notify(t('fill_all_fields'), 'err'); return; }
  const newKey = buildSpriteKey(chr.id, newType, newId);
  if (chr.images.some((im, i) => i !== editingSpriteIdx && im.key === newKey)) {
    notify(t('sprite_key_exists', newKey), 'err');
    return;
  }

  // Handle image replacement
  let newPath = img.path;
  if (newSpriteImagePath) {
    const dir = img.path.substring(0, img.path.lastIndexOf('/'));
    const fileName = newSpriteImagePath.split(/[/\\]/).pop();
    newPath = dir ? `${dir}/${fileName}` : fileName;
    await window.declApi.copyImageToProject(newSpriteImagePath, `images/${newPath}`);
  }

  // Remove the old line and insert the new one inside its character/type group
  const ptxt = await window.declApi.readFile('characters.rpy') || '';
  const lines = ptxt.split('\n').filter(line => {
    const m = line.match(/^image\s+(\S+)\s*=/);
    return !(m && m[1] === img.key);
  });
  insertSpriteLines(lines, chr.id, newType, [`image ${newKey} = "${newPath}"`]);
  await window.declApi.writeFile('characters.rpy', lines.join('\n'));

  // Keep the in-memory list ordered like the file
  chr.images.splice(editingSpriteIdx, 1);
  insertSpriteInMemory(chr, newType, { key: newKey, path: newPath });
  loadCharSprites();
  hideSpriteEditForm();
  notifyMainReload();
  notify(t('sprite_edited'), 'ok');
}

async function deleteSprite(charId, imgIdx) {
  const chr = characters.find(c => c.id === charId);
  if (!chr) return;
  const img = chr.images[imgIdx];
  if (!img || !confirm(t('confirm_delete_sprite', img.key))) return;

  const ptxt = await window.declApi.readFile('characters.rpy') || '';
  const lines = ptxt.split('\n');
  const filtered = lines.filter(line => {
    const m = line.match(/^image\s+(\S+)\s*=/);
    return !(m && m[1] === img.key);
  });
  await window.declApi.writeFile('characters.rpy', filtered.join('\n'));

  // Delete image file
  if (img.path) {
    const del = confirm(t('confirm_delete_with_file'));
    if (del) await window.declApi.deleteImage(img.path);
  }

  chr.images.splice(imgIdx, 1);
  loadCharSprites();
  notifyMainReload();
  notify(t('sprite_deleted'), 'ok');
}

// Validates the form and returns { chr, type } or null
function readSpriteAddForm() {
  const charId = document.getElementById('sp-char')?.value;
  const variantInput = document.getElementById('sp-variant');
  if (!charId) { notify(t('select_character'), 'err'); return null; }
  const type = sanitizeSpriteType(variantInput?.value);
  if (!type) { notify(t('write_variant'), 'err'); return null; }
  if (variantInput) variantInput.value = type;
  const chr = characters.find(c => c.id === charId);
  if (!chr) return null;
  return { chr, type };
}

async function addSpriteIndividual() {
  const form = readSpriteAddForm();
  if (!form) return;
  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;
  await importSprites(form.chr, form.type, files.map(fp => ({ src: fp, name: fp.split(/[/\\]/).pop() })));
}

async function addSpriteBatch() {
  const form = readSpriteAddForm();
  if (!form) return;
  const folderPath = await window.declApi.selectImageFolder();
  if (!folderPath) return;
  const files = await window.declApi.listImagesInDir(folderPath);
  if (!files || !files.length) { notify(t('no_images_in_folder'), 'err'); return; }
  await importSprites(form.chr, form.type, files.map(name => ({ src: folderPath + '/' + name, name })));
}

async function importSprites(chr, type, files) {
  let counter = nextSpriteNumber(chr, type);
  const destDir = `${IMAGE_DIRS.characters}/${chr.displayName}/${type}`;
  const newImages = [];
  for (const f of files) {
    const destRelative = `${destDir}/${f.name}`;
    await window.declApi.copyImageToProject(f.src, `images/${destRelative}`);
    newImages.push({ key: buildSpriteKey(chr.id, type, counter), path: destRelative });
    counter++;
  }

  const ptxt = await window.declApi.readFile('characters.rpy') || '';
  const lines = ptxt.split('\n');
  insertSpriteLines(lines, chr.id, type, newImages.map(img => `image ${img.key} = "${img.path}"`));
  await window.declApi.writeFile('characters.rpy', lines.join('\n'));

  newImages.forEach(img => insertSpriteInMemory(chr, type, img));
  loadCharSprites();
  notifyMainReload();
  notify(t('sprites_added', newImages.length), 'ok');
}

// Insert image lines (in place) so the file stays grouped by character and type:
// after the last sprite of the same type, else after the character's last sprite,
// else after its define line, else at the end of the file.
function insertSpriteLines(lines, charId, type, newLines) {
  const imgRe = /^image\s+(\w+)\s*=/;
  const chr = characters.find(c => c.id === charId);
  let lastSameType = -1, lastOfChar = -1, defineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(imgRe);
    if (m && findCharForSpriteKey(characters, m[1]) === chr) {
      lastOfChar = i;
      if (parseSpriteKey(charId, m[1]).type === type) lastSameType = i;
    } else if (new RegExp(`^define\\s+${charId}\\s*=`).test(lines[i])) {
      defineIdx = i;
    }
  }
  let at = lastSameType >= 0 ? lastSameType : lastOfChar >= 0 ? lastOfChar : defineIdx;
  if (at >= 0) {
    lines.splice(at + 1, 0, ...newLines);
  } else {
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.push('', ...newLines, '');
  }
}

function insertSpriteInMemory(chr, type, img) {
  let at = -1;
  chr.images.forEach((im, i) => { if (parseSpriteKey(chr.id, im.key).type === type) at = i; });
  if (at >= 0) chr.images.splice(at + 1, 0, img);
  else chr.images.push(img);
}

// ═══════════════════════════════════════════════════════════
// EXPRESSIONS TAB
// ═══════════════════════════════════════════════════════════
function loadCharExpressions() {
  const charId = document.getElementById('ex-char')?.value;
  const preview = document.getElementById('expr-preview');
  const list = document.getElementById('expr-list');
  if (!charId) { preview.innerHTML = ''; list.innerHTML = ''; return; }

  // Find expressions for this character's image attribute
  const chr = characters.find(c => c.id === charId);
  const imgAttr = chr?.imageAttr || '';
  const charExprs = imgAttr ? expressions.filter(e => e.charId === imgAttr) : [];

  preview.innerHTML = charExprs.map((e, i) => {
    const exprIdx = expressions.indexOf(e);
    return `<div class="preview-item">
      <img src="${getImageURL(e.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${e.key}</div>
      <div class="item-actions" style="margin-top:4px;">
        <button onclick="showExprEditForm(${exprIdx})" title="${t('edit_item')}">✏️</button>
        <button onclick="deleteExpression(${exprIdx})" title="${t('delete_item')}">🗑️</button>
      </div>
    </div>`;
  }).join('');
  list.innerHTML = '';
}

// ── Expression edit ──
let editingExprIdx = -1;
let newExprImagePath = '';

function showExprEditForm(exprIdx) {
  editingExprIdx = exprIdx;
  newExprImagePath = '';
  const expr = expressions[exprIdx];
  if (!expr) return;
  document.getElementById('ee-key').value = expr.key;
  document.getElementById('ee-file').textContent = t('no_file_selected');
  document.getElementById('ee-preview').innerHTML =
    `<img src="${getImageURL(expr.path)}" style="max-height:80px;border-radius:4px;" onerror="this.style.display='none'" />`;
  const form = document.getElementById('expr-edit-form');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideExprEditForm() {
  document.getElementById('expr-edit-form').style.display = 'none';
  editingExprIdx = -1;
  newExprImagePath = '';
}

async function selectExprImage() {
  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;
  newExprImagePath = files[0];
  const fileName = newExprImagePath.split(/[/\\]/).pop();
  document.getElementById('ee-file').textContent = fileName;
}

async function saveExprEdit() {
  if (editingExprIdx < 0) return;
  const expr = expressions[editingExprIdx];
  const newKey = document.getElementById('ee-key').value.trim();
  if (!newKey) return;

  // Handle image replacement
  let newPath = expr.path;
  if (newExprImagePath) {
    const fileName = newExprImagePath.split(/[/\\]/).pop();
    newPath = `${IMAGE_DIRS.expressions}/${fileName}`;
    await window.declApi.copyImageToProject(newExprImagePath, `images/${newPath}`);
  }

  const etxt = await window.declApi.readFile('expressions.rpy') || '';
  const lines = etxt.split('\n');
  const oldPattern = `image side ${expr.charId} ${expr.key}`;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith(oldPattern)) {
      lines[i] = `image side ${expr.charId} ${newKey} = "${newPath}"`;
      break;
    }
  }
  await window.declApi.writeFile('expressions.rpy', lines.join('\n'));
  expr.key = newKey;
  expr.path = newPath;
  loadCharExpressions();
  hideExprEditForm();
  notifyMainReload();
  notify(t('expr_edited'), 'ok');
}

async function deleteExpression(exprIdx) {
  const expr = expressions[exprIdx];
  if (!expr || !confirm(t('confirm_delete_expr', expr.key))) return;

  const etxt = await window.declApi.readFile('expressions.rpy') || '';
  const lines = etxt.split('\n');
  const pattern = `image side ${expr.charId} ${expr.key}`;
  const filtered = lines.filter(line => !line.trimStart().startsWith(pattern));
  await window.declApi.writeFile('expressions.rpy', filtered.join('\n'));

  // Delete image file
  if (expr.path) {
    const del = confirm(t('confirm_delete_with_file'));
    if (del) await window.declApi.deleteImage(expr.path);
  }

  expressions.splice(exprIdx, 1);
  loadCharExpressions();
  notifyMainReload();
  notify(t('expr_deleted'), 'ok');
}

async function addExprIndividual() {
  const charId = document.getElementById('ex-char')?.value;
  if (!charId) { notify(t('select_character'), 'err'); return; }
  const chr = characters.find(c => c.id === charId);
  if (!chr) return;
  const imgAttr = chr.imageAttr;
  if (!imgAttr) { notify(t('select_character'), 'err'); return; }

  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;

  const existingCount = expressions.filter(e => e.charId === imgAttr).length;
  let counter = existingCount + 1;

  const newExprs = [];
  for (const filePath of files) {
    const fileName = filePath.split(/[/\\]/).pop();
    const destRelative = `${IMAGE_DIRS.expressions}/${fileName}`;
    await window.declApi.copyImageToProject(filePath, `images/${destRelative}`);

    const key = `expresion_${counter}`;
    newExprs.push({ charId: imgAttr, key, path: destRelative });
    counter++;
  }

  await appendExpressionsToFile(imgAttr, newExprs);
  expressions.push(...newExprs);
  loadCharExpressions();
  notifyMainReload();
  notify(t('expressions_added', newExprs.length), 'ok');
}

async function addExprBatch() {
  const charId = document.getElementById('ex-char')?.value;
  if (!charId) { notify(t('select_character'), 'err'); return; }
  const chr = characters.find(c => c.id === charId);
  if (!chr) return;
  const imgAttr = chr.imageAttr;
  if (!imgAttr) { notify(t('select_character'), 'err'); return; }

  const folderPath = await window.declApi.selectImageFolder();
  if (!folderPath) return;
  const files = await window.declApi.listImagesInDir(folderPath);
  if (!files || !files.length) { notify(t('no_images_in_folder'), 'err'); return; }

  const existingCount = expressions.filter(e => e.charId === imgAttr).length;
  let counter = existingCount + 1;

  const newExprs = [];
  for (const fileName of files) {
    const srcPath = folderPath + '/' + fileName;
    const destRelative = `${IMAGE_DIRS.expressions}/${fileName}`;
    await window.declApi.copyImageToProject(srcPath, `images/${destRelative}`);

    const key = `expresion_${counter}`;
    newExprs.push({ charId: imgAttr, key, path: destRelative });
    counter++;
  }

  await appendExpressionsToFile(imgAttr, newExprs);
  expressions.push(...newExprs);
  loadCharExpressions();
  notifyMainReload();
  notify(t('expressions_added', newExprs.length), 'ok');
}

async function appendExpressionsToFile(imgAttr, newExprs) {
  const etxt = await window.declApi.readFile('expressions.rpy') || '';
  const newLines = newExprs.map(e => `image side ${e.charId} ${e.key} = "${e.path}"`).join('\n');

  // Find section header for this character
  const lines = etxt.split('\n');
  let sectionIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^#\\s*${imgAttr}`, 'i'))) sectionIdx = i;
  }

  // Find last expression line for this character
  let lastExprIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^image\\s+side\\s+${imgAttr}\\s+`))) lastExprIdx = i;
  }

  let newText;
  if (lastExprIdx >= 0) {
    lines.splice(lastExprIdx + 1, 0, newLines);
    newText = lines.join('\n');
  } else if (sectionIdx >= 0) {
    lines.splice(sectionIdx + 1, 0, newLines);
    newText = lines.join('\n');
  } else {
    newText = etxt.trimEnd() + `\n\n# ${imgAttr}\n` + newLines + '\n';
  }
  await window.declApi.writeFile('expressions.rpy', newText);
}

// ═══════════════════════════════════════════════════════════
// BACKGROUNDS TAB
// ═══════════════════════════════════════════════════════════
function loadBackgrounds() {
  const list = document.getElementById('bg-list');
  list.innerHTML = backgrounds.map((bg, i) =>
    `<div class="preview-item">
      <img src="${getImageURL(bg.path)}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'" />
      <div class="lbl">${bg.key}</div>
      <div class="item-actions" style="margin-top:4px;">
        <button onclick="showBgEditForm(${i})" title="${t('edit_item')}">✏️</button>
        <button onclick="deleteBackground(${i})" title="${t('delete_item')}">🗑️</button>
      </div>
    </div>`).join('');
}

// ── Background add ──
let newBgImagePath = '';

function showBgAddForm() {
  newBgImagePath = '';
  document.getElementById('ba-key').value = '';
  document.getElementById('ba-file').textContent = t('no_file_selected');
  const form = document.getElementById('bg-add-form');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideBgAddForm() {
  document.getElementById('bg-add-form').style.display = 'none';
  newBgImagePath = '';
}

async function selectNewBgImage() {
  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;
  newBgImagePath = files[0];
  const fileName = newBgImagePath.split(/[/\\]/).pop();
  document.getElementById('ba-file').textContent = fileName;
}

async function saveNewBg() {
  const key = document.getElementById('ba-key').value.trim();
  if (!key) { notify(t('bg_needs_name'), 'warn'); return; }
  if (!newBgImagePath) { notify(t('bg_needs_image'), 'warn'); return; }

  const fileName = newBgImagePath.split(/[/\\]/).pop();
  const destRelative = `${IMAGE_DIRS.backgrounds}/${fileName}`;
  await window.declApi.copyImageToProject(newBgImagePath, `images/${destRelative}`);

  const ftxt = await window.declApi.readFile('backgrounds.rpy') || '';
  const newLine = `image ${key} = "${destRelative}"`;
  const newText = ftxt.trimEnd() + '\n' + newLine + '\n';
  await window.declApi.writeFile('backgrounds.rpy', newText);

  backgrounds.push({ key, path: destRelative });
  loadBackgrounds();
  hideBgAddForm();
  notifyMainReload();
  notify(t('backgrounds_added', 1), 'ok');
}

// ── Background edit ──
let editingBgIdx = -1;
let editBgImagePath = '';

function showBgEditForm(idx) {
  editingBgIdx = idx;
  editBgImagePath = '';
  const bg = backgrounds[idx];
  if (!bg) return;
  document.getElementById('be-key').value = bg.key;
  document.getElementById('be-file').textContent = t('no_file_selected');
  document.getElementById('be-preview').innerHTML =
    `<img src="${getImageURL(bg.path)}" style="max-height:80px;border-radius:4px;width:100%;object-fit:cover;" onerror="this.style.display='none'" />`;
  const form = document.getElementById('bg-edit-form');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideBgEditForm() {
  document.getElementById('bg-edit-form').style.display = 'none';
  editingBgIdx = -1;
  editBgImagePath = '';
}

async function selectBgEditImage() {
  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;
  editBgImagePath = files[0];
  const fileName = editBgImagePath.split(/[/\\]/).pop();
  document.getElementById('be-file').textContent = fileName;
}

async function saveBgEdit() {
  if (editingBgIdx < 0) return;
  const bg = backgrounds[editingBgIdx];
  const newKey = document.getElementById('be-key').value.trim();
  if (!newKey) return;

  let newPath = bg.path;
  if (editBgImagePath) {
    const fileName = editBgImagePath.split(/[/\\]/).pop();
    newPath = `${IMAGE_DIRS.backgrounds}/${fileName}`;
    await window.declApi.copyImageToProject(editBgImagePath, `images/${newPath}`);
  }

  const ftxt = await window.declApi.readFile('backgrounds.rpy') || '';
  const lines = ftxt.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^image\s+(.+?)\s*=/);
    if (m && m[1] === bg.key) {
      lines[i] = `image ${newKey} = "${newPath}"`;
      break;
    }
  }
  await window.declApi.writeFile('backgrounds.rpy', lines.join('\n'));
  bg.key = newKey;
  bg.path = newPath;
  loadBackgrounds();
  hideBgEditForm();
  notifyMainReload();
  notify(t('bg_edited'), 'ok');
}

async function deleteBackground(idx) {
  const bg = backgrounds[idx];
  if (!bg || !confirm(t('confirm_delete_bg', bg.key))) return;

  const ftxt = await window.declApi.readFile('backgrounds.rpy') || '';
  const lines = ftxt.split('\n');
  const filtered = lines.filter(line => {
    const m = line.match(/^image\s+(.+?)\s*=/);
    return !(m && m[1] === bg.key);
  });
  await window.declApi.writeFile('backgrounds.rpy', filtered.join('\n'));

  // Delete image file
  if (bg.path) {
    const del = confirm(t('confirm_delete_with_file'));
    if (del) await window.declApi.deleteImage(bg.path);
  }

  backgrounds.splice(idx, 1);
  loadBackgrounds();
  notifyMainReload();
  notify(t('bg_deleted'), 'ok');
}

// ═══════════════════════════════════════════════════════════
// SCENES TAB
// ═══════════════════════════════════════════════════════════
function loadScenes() {
  const list = document.getElementById('sc-list');
  list.innerHTML = scenes.map((sc, i) =>
    `<div class="preview-item">
      <img src="${getImageURL(sc.path)}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'" />
      <div class="lbl">${sc.key}</div>
      <div class="item-actions" style="margin-top:4px;">
        <button onclick="showSceneEditForm(${i})" title="${t('edit_item')}">✏️</button>
        <button onclick="deleteScene(${i})" title="${t('delete_item')}">🗑️</button>
      </div>
    </div>`).join('');
}

let newSceneImagePath = '';

function showSceneAddForm() {
  newSceneImagePath = '';
  document.getElementById('sca-key').value = '';
  document.getElementById('sca-file').textContent = t('no_file_selected');
  const form = document.getElementById('sc-add-form');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideSceneAddForm() {
  document.getElementById('sc-add-form').style.display = 'none';
  newSceneImagePath = '';
}

async function selectNewSceneImage() {
  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;
  newSceneImagePath = files[0];
  const fileName = newSceneImagePath.split(/[/\\]/).pop();
  document.getElementById('sca-file').textContent = fileName;
}

async function saveNewScene() {
  const key = document.getElementById('sca-key').value.trim();
  if (!key) { notify(t('scene_needs_name'), 'warn'); return; }
  if (!newSceneImagePath) { notify(t('scene_needs_image'), 'warn'); return; }

  const fileName = newSceneImagePath.split(/[/\\]/).pop();
  const destRelative = `${IMAGE_DIRS.scenes}/${fileName}`;
  await window.declApi.copyImageToProject(newSceneImagePath, `images/${destRelative}`);

  const stxt = await window.declApi.readFile('scenes.rpy') || '';
  const newLine = `image ${key} = "${destRelative}"`;
  const newText = stxt.trimEnd() + '\n' + newLine + '\n';
  await window.declApi.writeFile('scenes.rpy', newText);

  scenes.push({ key, path: destRelative });
  loadScenes();
  hideSceneAddForm();
  notifyMainReload();
  notify(t('scenes_added', 1), 'ok');
}

let editingSceneIdx = -1;
let editSceneImagePath = '';

function showSceneEditForm(idx) {
  editingSceneIdx = idx;
  editSceneImagePath = '';
  const sc = scenes[idx];
  if (!sc) return;
  document.getElementById('sce-key').value = sc.key;
  document.getElementById('sce-file').textContent = t('no_file_selected');
  document.getElementById('sce-preview').innerHTML =
    `<img src="${getImageURL(sc.path)}" style="max-height:80px;border-radius:4px;width:100%;object-fit:cover;" onerror="this.style.display='none'" />`;
  const form = document.getElementById('sc-edit-form');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideSceneEditForm() {
  document.getElementById('sc-edit-form').style.display = 'none';
  editingSceneIdx = -1;
  editSceneImagePath = '';
}

async function selectSceneEditImage() {
  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;
  editSceneImagePath = files[0];
  const fileName = editSceneImagePath.split(/[/\\]/).pop();
  document.getElementById('sce-file').textContent = fileName;
}

async function saveSceneEdit() {
  if (editingSceneIdx < 0) return;
  const sc = scenes[editingSceneIdx];
  const newKey = document.getElementById('sce-key').value.trim();
  if (!newKey) return;

  let newPath = sc.path;
  if (editSceneImagePath) {
    const fileName = editSceneImagePath.split(/[/\\]/).pop();
    newPath = `${IMAGE_DIRS.scenes}/${fileName}`;
    await window.declApi.copyImageToProject(editSceneImagePath, `images/${newPath}`);
  }

  const stxt = await window.declApi.readFile('scenes.rpy') || '';
  const lines = stxt.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^image\s+(.+?)\s*=/);
    if (m && m[1] === sc.key) {
      lines[i] = `image ${newKey} = "${newPath}"`;
      break;
    }
  }
  await window.declApi.writeFile('scenes.rpy', lines.join('\n'));
  sc.key = newKey;
  sc.path = newPath;
  loadScenes();
  hideSceneEditForm();
  notifyMainReload();
  notify(t('scene_edited'), 'ok');
}

async function deleteScene(idx) {
  const sc = scenes[idx];
  if (!sc || !confirm(t('confirm_delete_scene', sc.key))) return;

  const stxt = await window.declApi.readFile('scenes.rpy') || '';
  const lines = stxt.split('\n');
  const filtered = lines.filter(line => {
    const m = line.match(/^image\s+(.+?)\s*=/);
    return !(m && m[1] === sc.key);
  });
  await window.declApi.writeFile('scenes.rpy', filtered.join('\n'));

  if (sc.path) {
    const del = confirm(t('confirm_delete_with_file'));
    if (del) await window.declApi.deleteImage(sc.path);
  }

  scenes.splice(idx, 1);
  loadScenes();
  notifyMainReload();
  notify(t('scene_deleted'), 'ok');
}

// ═══════════════════════════════════════════════════════════
// ANIMATIONS & POSITIONS
// ═══════════════════════════════════════════════════════════
function loadAnimations() {
  const list = document.getElementById('anim-list');
  const items = [];
  const re = /^(transform|define)\s+(\w+)/gm;
  let m;
  while ((m = re.exec(transformsAnim)) !== null) items.push({ name: m[2], type: m[1] });

  list.innerHTML = items.map(tf =>
    `<div class="item-row">
      <span class="item-name">${tf.name}</span>
      <span class="item-detail">${tf.type}</span>
      <span class="item-actions">
        <button onclick="showTransformEditForm('${tf.name}', 'animations.rpy', 'anim')" title="${t('edit_item')}">✏️</button>
        <button onclick="deleteTransform('${tf.name}', 'animations.rpy')" title="${t('delete_item')}">🗑️</button>
      </span>
    </div>`).join('');
}

function loadPositions() {
  const list = document.getElementById('pos-list');
  const items = [];
  const re = /^(transform|define)\s+(\w+)/gm;
  let m;
  while ((m = re.exec(transformsPos)) !== null) items.push({ name: m[2], type: m[1] });

  list.innerHTML = items.map(tf =>
    `<div class="item-row">
      <span class="item-name">${tf.name}</span>
      <span class="item-detail">${tf.type}</span>
      <span class="item-actions">
        <button onclick="showTransformEditForm('${tf.name}', 'positions.rpy', 'pos')" title="${t('edit_item')}">✏️</button>
        <button onclick="deleteTransform('${tf.name}', 'positions.rpy')" title="${t('delete_item')}">🗑️</button>
      </span>
    </div>`).join('');
}

// ── Edit ──
let editingTransformName = '';
let editingTransformFile = '';
let editingTransformPrefix = '';

function showTransformEditForm(name, file, prefix) {
  editingTransformName = name;
  editingTransformFile = file;
  editingTransformPrefix = prefix;
  const txt = file === 'animations.rpy' ? transformsAnim : transformsPos;
  const lines = txt.split('\n');

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(transform|define)\s+(\w+)/);
    if (m && m[2] === name) { startIdx = i; break; }
  }
  if (startIdx < 0) return;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !lines[i].startsWith(' ') && !lines[i].startsWith('\t') && !trimmed.startsWith('#')) {
      endIdx = i;
      break;
    }
  }

  const block = lines.slice(startIdx, endIdx).join('\n');
  document.getElementById(prefix + 'e-code').value = block;
  document.getElementById(prefix + 'e-label').textContent = t('edit_item') + ' ' + name;
  const form = document.getElementById(prefix + '-edit-form');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideTransformEditForm(formId) {
  if (formId) {
    document.getElementById(formId).style.display = 'none';
  } else if (editingTransformPrefix) {
    document.getElementById(editingTransformPrefix + '-edit-form').style.display = 'none';
  }
  editingTransformName = '';
  editingTransformFile = '';
  editingTransformPrefix = '';
}

async function saveTransformEdit() {
  if (!editingTransformName || !editingTransformFile || !editingTransformPrefix) return;
  const newCode = document.getElementById(editingTransformPrefix + 'e-code').value.trimEnd();
  if (!newCode) return;

  const file = editingTransformFile;
  const txt = await window.declApi.readFile(file) || '';
  const lines = txt.split('\n');

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(transform|define)\s+(\w+)/);
    if (m && m[2] === editingTransformName) { startIdx = i; break; }
  }
  if (startIdx < 0) return;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !lines[i].startsWith(' ') && !lines[i].startsWith('\t') && !trimmed.startsWith('#')) {
      endIdx = i;
      break;
    }
  }

  const newLines = newCode.split('\n');
  lines.splice(startIdx, endIdx - startIdx, ...newLines);
  const newText = lines.join('\n');
  await window.declApi.writeFile(file, newText);

  if (file === 'animations.rpy') {
    transformsAnim = newText;
    loadAnimations();
  } else {
    transformsPos = newText;
    loadPositions();
  }

  hideTransformEditForm();
  notifyMainReload();
  notify(t('saved'), 'ok');
}

async function deleteTransform(name, file) {
  if (!confirm(t('delete_item') + ' ' + name + '?')) return;

  const txt = await window.declApi.readFile(file) || '';
  const lines = txt.split('\n');

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(transform|define)\s+(\w+)/);
    if (m && m[2] === name) { startIdx = i; break; }
  }
  if (startIdx < 0) return;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !lines[i].startsWith(' ') && !lines[i].startsWith('\t') && !trimmed.startsWith('#')) {
      endIdx = i;
      break;
    }
  }

  while (startIdx > 0 && lines[startIdx - 1].trim() === '') startIdx--;

  lines.splice(startIdx, endIdx - startIdx);
  const newText = lines.join('\n');
  await window.declApi.writeFile(file, newText);

  if (file === 'animations.rpy') {
    transformsAnim = newText;
    loadAnimations();
  } else {
    transformsPos = newText;
    loadPositions();
  }

  notifyMainReload();
  notify(t('deleted'), 'ok');
}

async function addTransform(file, inputId) {
  const code = document.getElementById(inputId).value.trim();
  if (!code) { notify(t('fill_all_fields'), 'err'); return; }

  const existing = await window.declApi.readFile(file) || '';
  const newText = existing.trimEnd() + '\n\n' + code + '\n';
  await window.declApi.writeFile(file, newText);

  if (file === 'animations.rpy') {
    transformsAnim = newText;
    loadAnimations();
  } else {
    transformsPos = newText;
    loadPositions();
  }

  document.getElementById(inputId).value = '';
  notifyMainReload();
  notify(t('saved'), 'ok');
}

// ── Notify main window ──
function notifyMainReload() {
  window.declApi.reloadProjectData();
}

// ── UI Helpers ──
let notifTimer;
function notify(msg, type = 'ok') {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.className = 'notification ' + type + ' show';
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
(async function init() {
  const s = await window.declApi.getSettings();
  if (s.theme) document.documentElement.setAttribute('data-theme', s.theme);
  if (s.language) await loadI18n(s.language);
  else await loadI18n('es');
  applyI18n();

  await loadAllData();
  renderCharList();

  window.declApi.onSettingsChanged((s) => {
    if (s.theme) document.documentElement.setAttribute('data-theme', s.theme);
    if (s.language && s.language !== currentLang) {
      loadI18n(s.language).then(() => applyI18n());
    }
  });

  // Editor de código en Transforms: Tab y Backspace (mismo compartamiento que en renderer.js)
  const animCode = document.getElementById('anim-code');
  const posCode = document.getElementById('pos-code');
  const aeCode = document.getElementById('ae-code');
  const peCode = document.getElementById('pe-code');
  if (animCode) animCode.addEventListener('keydown', handleCustomCodeKeydown);
  if (posCode) posCode.addEventListener('keydown', handleCustomCodeKeydown);
  if (aeCode) aeCode.addEventListener('keydown', handleCustomCodeKeydown);
  if (peCode) peCode.addEventListener('keydown', handleCustomCodeKeydown);
})();

function handleCustomCodeKeydown(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 4;
  } else if (e.key === 'Backspace') {
    const start = this.selectionStart;
    const end = this.selectionEnd;
    if (start === end && start >= 4) {
      const preceding = this.value.substring(start - 4, start);
      if (preceding === "    ") {
        e.preventDefault();
        this.value = this.value.substring(0, start - 4) + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start - 4;
      }
    }
  }
}
