// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Declaration Window Renderer
// ═══════════════════════════════════════════════════════════

let gamePath = '';
let translations = {};
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
let expressions = [];  // { charId, key, path }
let transformsAnim = ''; // raw text of Animaciones.rpy
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
  const tabNames = ['characters', 'sprites', 'expressions', 'backgrounds', 'animations', 'positions'];
  const idx = tabNames.indexOf(name);
  if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');

  if (name === 'sprites') { populateCharSelector('sp-char'); loadCharSprites(); }
  if (name === 'expressions') { populateCharSelector('ex-char'); loadCharExpressions(); }
  if (name === 'backgrounds') loadBackgrounds();
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

  const ptxt = await window.declApi.readFile('personajes.rpy');
  const ftxt = await window.declApi.readFile('fondos.rpy');
  const etxt = await window.declApi.readFile('expresiones.rpy');
  transformsAnim = await window.declApi.readFile('Animaciones.rpy') || '';
  transformsPos = await window.declApi.readFile('positions.rpy') || '';

  characters = []; backgrounds = []; expressions = [];
  if (ptxt) parsePersonajes(ptxt);
  if (ftxt) parseFondos(ftxt);
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
  while ((m = imageRe.exec(text)) !== null) {
    const key = m[1], path = m[2];
    const charId = order.find(id => key.startsWith(id + '_') || key.startsWith(id.toLowerCase() + '_'));
    if (charId) chars[charId].images.push({ key, path });
  }
  characters = order.map(id => chars[id]);
}

function parseFondos(text) {
  const re = /^image\s+(.+?)\s*=\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(text)) !== null) backgrounds.push({ key: m[1], path: m[2] });
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
    const ptxt = await window.declApi.readFile('personajes.rpy') || '';
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

    await window.declApi.writeFile('personajes.rpy', lines.join('\n'));
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
    const ptxt = await window.declApi.readFile('personajes.rpy') || '';
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
    
    await window.declApi.writeFile('personajes.rpy', newText);
    
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

  const ptxt = await window.declApi.readFile('personajes.rpy') || '';
  const lines = ptxt.split('\n');
  const filtered = lines.filter(line => {
    if (new RegExp(`^define\\s+${c.id}\\s*=`).test(line)) return false;
    if (new RegExp(`^image\\s+${c.id}_`).test(line)) return false;
    return true;
  });
  await window.declApi.writeFile('personajes.rpy', filtered.join('\n'));

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
// ═══════════════════════════════════════════════════════════
function loadCharSprites() {
  const charId = document.getElementById('sp-char')?.value;
  const chr = characters.find(c => c.id === charId);
  const preview = document.getElementById('sprite-preview');
  const list = document.getElementById('sprite-list');
  if (!chr) { preview.innerHTML = ''; list.innerHTML = ''; return; }

  preview.innerHTML = chr.images.map((img, i) =>
    `<div class="preview-item">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${img.key}</div>
      <div class="item-actions" style="margin-top:4px;">
        <button onclick="showSpriteEditForm('${charId}', ${i})" title="${t('edit_item')}">✏️</button>
        <button onclick="deleteSprite('${charId}', ${i})" title="${t('delete_item')}">🗑️</button>
      </div>
    </div>`).join('');
  list.innerHTML = '';
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
  document.getElementById('se-key').value = img.key;
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
  const newKey = document.getElementById('se-key').value.trim();
  if (!newKey) return;

  // Handle image replacement
  let newPath = img.path;
  if (newSpriteImagePath) {
    const dir = img.path.substring(0, img.path.lastIndexOf('/'));
    const fileName = newSpriteImagePath.split(/[/\\]/).pop();
    newPath = dir ? `${dir}/${fileName}` : fileName;
    await window.declApi.copyImageToProject(newSpriteImagePath, `images/${newPath}`);
  }

  const ptxt = await window.declApi.readFile('personajes.rpy') || '';
  const lines = ptxt.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^image\s+(\S+)\s*=/);
    if (m && m[1] === img.key) {
      lines[i] = `image ${newKey} = "${newPath}"`;
      break;
    }
  }
  await window.declApi.writeFile('personajes.rpy', lines.join('\n'));
  img.key = newKey;
  img.path = newPath;
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

  const ptxt = await window.declApi.readFile('personajes.rpy') || '';
  const lines = ptxt.split('\n');
  const filtered = lines.filter(line => {
    const m = line.match(/^image\s+(\S+)\s*=/);
    return !(m && m[1] === img.key);
  });
  await window.declApi.writeFile('personajes.rpy', filtered.join('\n'));

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

async function addSpriteIndividual() {
  const charId = document.getElementById('sp-char')?.value;
  const variant = document.getElementById('sp-variant')?.value.trim();
  if (!charId) { notify(t('select_character'), 'err'); return; }
  if (!variant) { notify(t('write_variant'), 'err'); return; }

  const files = await window.declApi.selectImageFiles();
  if (!files || !files.length) return;

  const chr = characters.find(c => c.id === charId);
  if (!chr) return;

  // Count existing sprites of this variant for incremental naming
  const existingCount = chr.images.filter(img => img.key.startsWith(`${charId}_${variant}_`)).length;
  let counter = existingCount + 1;

  const newImages = [];
  for (const filePath of files) {
    const destDir = `personajes/${chr.displayName}/${variant}`;
    const fileName = filePath.split(/[/\\]/).pop();
    const destRelative = `${destDir}/${fileName}`;
    await window.declApi.copyImageToProject(filePath, `images/${destRelative}`);

    const key = `${charId}_${variant}_${counter}`;
    newImages.push({ key, path: destRelative });
    counter++;
  }

  // Append to personajes.rpy
  await appendSpritesToFile(charId, newImages);
  chr.images.push(...newImages);
  loadCharSprites();
  notifyMainReload();
  notify(t('sprites_added', newImages.length), 'ok');
}

async function addSpriteBatch() {
  const charId = document.getElementById('sp-char')?.value;
  const variant = document.getElementById('sp-variant')?.value.trim();
  if (!charId) { notify(t('select_character'), 'err'); return; }
  if (!variant) { notify(t('write_variant'), 'err'); return; }

  const folderPath = await window.declApi.selectImageFolder();
  if (!folderPath) return;

  const chr = characters.find(c => c.id === charId);
  if (!chr) return;

  const files = await window.declApi.listImagesInDir(folderPath);
  if (!files || !files.length) { notify(t('no_images_in_folder'), 'err'); return; }

  const existingCount = chr.images.filter(img => img.key.startsWith(`${charId}_${variant}_`)).length;
  let counter = existingCount + 1;

  const newImages = [];
  for (const fileName of files) {
    const srcPath = folderPath + '/' + fileName;
    const destDir = `personajes/${chr.displayName}/${variant}`;
    const destRelative = `${destDir}/${fileName}`;
    await window.declApi.copyImageToProject(srcPath, `images/${destRelative}`);

    const key = `${charId}_${variant}_${counter}`;
    newImages.push({ key, path: destRelative });
    counter++;
  }

  await appendSpritesToFile(charId, newImages);
  chr.images.push(...newImages);
  loadCharSprites();
  notifyMainReload();
  notify(t('sprites_added', newImages.length), 'ok');
}

async function appendSpritesToFile(charId, newImages) {
  const ptxt = await window.declApi.readFile('personajes.rpy') || '';
  const imageLines = newImages.map(img => `image ${img.key} = "${img.path}"`).join('\n');

  // Try to find the last image line for this character
  const lines = ptxt.split('\n');
  let lastIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^image\\s+${charId}_`))) lastIdx = i;
  }

  let newText;
  if (lastIdx >= 0) {
    lines.splice(lastIdx + 1, 0, imageLines);
    newText = lines.join('\n');
  } else {
    // Find the define line for this character and add after it
    let defineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(new RegExp(`^define\\s+${charId}\\s*=`))) defineIdx = i;
    }
    if (defineIdx >= 0) {
      lines.splice(defineIdx + 1, 0, imageLines);
      newText = lines.join('\n');
    } else {
      newText = ptxt.trimEnd() + '\n\n' + imageLines + '\n';
    }
  }
  await window.declApi.writeFile('personajes.rpy', newText);
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
    newPath = `expresiones/${fileName}`;
    await window.declApi.copyImageToProject(newExprImagePath, `images/${newPath}`);
  }

  const etxt = await window.declApi.readFile('expresiones.rpy') || '';
  const lines = etxt.split('\n');
  const oldPattern = `image side ${expr.charId} ${expr.key}`;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith(oldPattern)) {
      lines[i] = `image side ${expr.charId} ${newKey} = "${newPath}"`;
      break;
    }
  }
  await window.declApi.writeFile('expresiones.rpy', lines.join('\n'));
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

  const etxt = await window.declApi.readFile('expresiones.rpy') || '';
  const lines = etxt.split('\n');
  const pattern = `image side ${expr.charId} ${expr.key}`;
  const filtered = lines.filter(line => !line.trimStart().startsWith(pattern));
  await window.declApi.writeFile('expresiones.rpy', filtered.join('\n'));

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
    const destRelative = `expresiones/${fileName}`;
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
    const destRelative = `expresiones/${fileName}`;
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
  const etxt = await window.declApi.readFile('expresiones.rpy') || '';
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
  await window.declApi.writeFile('expresiones.rpy', newText);
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
  const destRelative = `fondos/${fileName}`;
  await window.declApi.copyImageToProject(newBgImagePath, `images/${destRelative}`);

  const ftxt = await window.declApi.readFile('fondos.rpy') || '';
  const newLine = `image ${key} = "${destRelative}"`;
  const newText = ftxt.trimEnd() + '\n' + newLine + '\n';
  await window.declApi.writeFile('fondos.rpy', newText);

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
    newPath = `fondos/${fileName}`;
    await window.declApi.copyImageToProject(editBgImagePath, `images/${newPath}`);
  }

  const ftxt = await window.declApi.readFile('fondos.rpy') || '';
  const lines = ftxt.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^image\s+(.+?)\s*=/);
    if (m && m[1] === bg.key) {
      lines[i] = `image ${newKey} = "${newPath}"`;
      break;
    }
  }
  await window.declApi.writeFile('fondos.rpy', lines.join('\n'));
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

  const ftxt = await window.declApi.readFile('fondos.rpy') || '';
  const lines = ftxt.split('\n');
  const filtered = lines.filter(line => {
    const m = line.match(/^image\s+(.+?)\s*=/);
    return !(m && m[1] === bg.key);
  });
  await window.declApi.writeFile('fondos.rpy', filtered.join('\n'));

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
        <button onclick="showTransformEditForm('${tf.name}', 'Animaciones.rpy', 'anim')" title="${t('edit_item')}">✏️</button>
        <button onclick="deleteTransform('${tf.name}', 'Animaciones.rpy')" title="${t('delete_item')}">🗑️</button>
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
  const txt = file === 'Animaciones.rpy' ? transformsAnim : transformsPos;
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

  if (file === 'Animaciones.rpy') {
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

  if (file === 'Animaciones.rpy') {
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

  if (file === 'Animaciones.rpy') {
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
