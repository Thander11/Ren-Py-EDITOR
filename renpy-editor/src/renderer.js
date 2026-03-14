// ═══════════════════════════════════════════════════════════════════
// Ren'Py EDITOR — Renderer (Main Window)
// ═══════════════════════════════════════════════════════════════════

// ── State ──
let gamePath = '';
let activeRpyFile = 'script.rpy';
let rpyFiles = [];
let blocks = [];
let editingIndex = -1;
let translations = {};
let currentLang = 'es';

const data = {
  characters: [],
  backgrounds: [],
  animations: [],
  positions: [],
  expressions: [],   // { charId, key, path }[]
  labels: [],
  audioFiles: []
};

// ═══════════════════════════════════════════════════════════════════
// I18N
// ═══════════════════════════════════════════════════════════════════
async function loadI18n(lang) {
  try {
    const raw = await window.api.readI18n(lang);
    translations = JSON.parse(raw);
    currentLang = lang;
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
        if (!/[a-zA-Z0-9]/.test(prefix)) {
          currentIcon = prefix;
        }
      }
      
      // Detectar y eliminar icono en el texto traducido
      const valSpaceIdx = val.indexOf(' ');
      let newText = val;
      if (valSpaceIdx > 0 && valSpaceIdx <= 2) {
        const prefix = val.substring(0, valSpaceIdx);
        if (!/[a-zA-Z0-9]/.test(prefix)) {
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

async function changeTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  await window.api.saveSettings({ theme });
}

async function changeLanguage(lang) {
  await loadI18n(lang);
  applyI18n();
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
  data.positions = []; data.expressions = []; data.labels = [];
  data.audioFiles = [];

  const personajesText = await window.api.readFile('personajes.rpy');
  const fondosText     = await window.api.readFile('fondos.rpy');
  const animText       = await window.api.readFile('Animaciones.rpy');
  const posText        = await window.api.readFile('positions.rpy');
  const exprText       = await window.api.readFile('expresiones.rpy');
  const scriptText     = await window.api.readFile(activeRpyFile);

  if (personajesText) parsePersonajes(personajesText);
  if (fondosText)     parseFondos(fondosText);
  if (animText)       parseAnimaciones(animText);
  if (posText)        parsePositions(posText);
  if (exprText)       parseExpresiones(exprText);
  if (scriptText)     parseScriptLabels(scriptText);
  refreshLabelSelector();

  // Audio files
  data.audioFiles = await window.api.listAudioFiles();

  // RPY files
  rpyFiles = await window.api.listRpyFiles();
}

// ═══════════════════════════════════════════════════════════════════
// PARSERS
// ═══════════════════════════════════════════════════════════════════
function parsePersonajes(text) {
  const chars = {};
  const charOrder = [];

  const defineRe = /define\s+(\w+)\s*=\s*Character\s*\(\s*"([^"]+)"/g;
  let m;
  while ((m = defineRe.exec(text)) !== null) {
    const id = m[1], name = m[2];
    if (!chars[id]) { chars[id] = { id, displayName: name, images: [] }; charOrder.push(id); }
  }

  const imageRe = /^image\s+(\w+)\s*=\s*"([^"]+)"/gm;
  while ((m = imageRe.exec(text)) !== null) {
    const key = m[1], path = m[2];
    const charId = charOrder.find(id => key.startsWith(id + '_') || key.startsWith(id.toLowerCase() + '_'));
    if (charId) chars[charId].images.push({ key, path });
  }
  data.characters = charOrder.map(id => chars[id]);
}

function parseFondos(text) {
  const re = /^image\s+(\w+)\s*=\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    data.backgrounds.push({ key: m[1], path: m[2] });
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
  if (!gamePath) return null;
  // Build absolute file path, then convert to a proper file:// URL
  const absPath = gamePath.replace(/\\/g, '/') + '/images/' + relativePath;
  // Encode each segment but preserve drive letter colon
  const parts = absPath.split('/');
  const encoded = parts.map((s, i) => {
    if (i === 0 && /^[a-zA-Z]:$/.test(s)) return s; // drive letter
    return encodeURIComponent(s);
  }).join('/');
  return 'file:///' + encoded;
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
  if (!rpyFiles.length) {
    c.innerHTML = `<div style="color:var(--text3);font-size:11px;text-align:center;margin-top:20px;">${t('no_rpy_files')}</div>`;
    return;
  }
  c.innerHTML = rpyFiles.map(f => {
    const isActive = f === activeRpyFile;
    return `<div style="padding:7px 10px;background:${isActive?'var(--accent)':'var(--surface)'};color:${isActive?'#fff':'var(--text)'};margin-bottom:4px;border-radius:4px;cursor:pointer;font-family:monospace;font-size:12px;border-left:3px solid ${isActive?'var(--accent)':'var(--border)'};" onclick="selectRpyFile('${f}')" title="${f}">📄 ${f}</div>`;
  }).join('');
}

async function selectRpyFile(filename) {
  if (filename === activeRpyFile) return;
  if (blocks.length > 0 && !confirm(t('change_file_confirm', blocks.length, filename))) return;
  activeRpyFile = filename;
  blocks = [];
  data.labels = [];
  const text = await getScriptText();
  if (text) parseScriptLabels(text);
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

function deleteBlock(idx) {
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

function moveBlock(idx, dir) {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= blocks.length) return;
  [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
  renderBlocks(); updateCodePreview();
}

function clearAllBlocks() {
  if (!blocks.length) return;
  if (confirm(t('clear_confirm'))) { blocks = []; renderBlocks(); updateCodePreview(); }
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
  label:      { icon: '📌', labelKey: 'block_label',         color: '#e94560' },
  menu:       { icon: '❓', labelKey: 'block_menu',            color: '#e67e22' },
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
    case 'show':       return `${b.image}${b.position?' at '+b.position:''}${b.behind?' behind '+b.behind:''}${b.transition?' with '+b.transition:''}${b.flipH?' [volteado]':''}`;
    case 'show_multi': return `${(b.sprites||[]).map(s=>s.image).join(', ')}${b.transition?' with '+b.transition:''}`;
    case 'hide':       return `hide ${b.image}${b.transition?' with '+b.transition:''}`;
    case 'hide_multi': return `ocultar: ${(b.sprites||[]).map(s=>s.image).join(', ')}${b.transition?' with '+b.transition:''}`;
    case 'scene':     return `scene ${b.background}${b.transition?' with '+b.transition:''}`;
    case 'label':     return `label ${b.name}:`;
    case 'menu':      return `${b.choices?.length||0} opciones: ${(b.choices||[]).map(c=>'"'+truncate(c.text,20)+'"').join(', ')}`;
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
  if (!blocks.length) { list.innerHTML = ''; return; }
  list.innerHTML = blocks.map((b, i) => {
    const meta = BLOCK_META[b.type] || { icon: '?', labelKey: b.type };
    const label = t(meta.labelKey);
    return `<div class="block type-${b.type}" id="block-${i}" draggable="true"
      ondragstart="onBlockDragStart(event,${i})" ondragend="onBlockDragEnd(event)"
      ondragover="onBlockDragOver(event,${i})" ondragleave="onBlockDragLeave(event)"
      ondrop="onBlockDrop(event,${i})">
      <div class="block-icon">${meta.icon}</div>
      <div class="block-content">
        <div class="block-title">${label}</div>
        <div class="block-desc">${escHtml(blockDesc(b))}</div>
      </div>
      <div class="block-actions">
        <button class="block-btn" onclick="moveBlock(${i},-1)" title="${t('btn_up')}">▲ ${t('btn_up')}</button>
        <button class="block-btn" onclick="moveBlock(${i},1)" title="${t('btn_down')}">▼ ${t('btn_down')}</button>
        <button class="block-btn" onclick="duplicateBlock(${i})" title="${t('btn_duplicate')}">📋 ${t('btn_duplicate')}</button>
        <button class="block-btn" onclick="duplicateBlockToEnd(${i})" title="${t('btn_duplicate_end')}">⬇️ ${t('btn_duplicate_end')}</button>
        <button class="block-btn" onclick="editBlock(${i})" title="${t('btn_edit')}">✏️ ${t('btn_edit')}</button>
        <button class="block-btn danger" onclick="deleteBlock(${i})" title="${t('btn_delete')}">🗑 ${t('btn_delete')}</button>
      </div>
    </div>`;
  }).join('');
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
      const exprCharId = getExpressionCharId(charId);
      const expStr = b.expression ? ` ${exprCharId} ${b.expression}` : '';
      const txt = b.thought ? `{i}<<${escRpy(b.text)}>>{/i}` : escRpy(b.text);
      return `${indent}${charId}${expStr} "${txt}"`;
    }

    case 'show': {
      let s = `${indent}show ${b.image}`;
      if (b.position && b.flipH) s += ` at ${b.position}, xflip`;
      else if (b.position) s += ` at ${b.position}`;
      else if (b.flipH) s += ` at xflip`;
      if (b.behind) s += ` behind ${b.behind}`;
      if (b.transition) s += ` with ${b.transition}`;
      return s;
    }

    case 'show_multi': {
      if (!b.sprites || !b.sprites.length) return '';
      const lines = b.sprites.map(sp => {
        let s = `${indent}show ${sp.image}`;
        if (sp.position && sp.flipH) s += ` at ${sp.position}, xflip`;
        else if (sp.position) s += ` at ${sp.position}`;
        else if (sp.flipH) s += ` at xflip`;
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
      let s = `${indent}scene ${b.background}`;
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

// FIX: % → %% in dialogue text
function escRpy(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/%/g, '%%');
}

// Get the character ID used for side expressions (image = "X" in define)
function getExpressionCharId(charId) {
  // For now, all characters use image = "Paul" in their define
  // This could be made dynamic by reading the Character definition
  const chr = data.characters.find(c => c.id === charId);
  // In the current project, all characters use image = "Paul"
  return 'Paul';
}

// ═══════════════════════════════════════════════════════════════════
// CODE PREVIEW
// ═══════════════════════════════════════════════════════════════════
function updateCodePreview() {
  const code = generateCode(blocks);
  document.getElementById('code-preview').textContent = code || t('no_blocks');
}

async function copyCode() {
  const code = generateCode(blocks);
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
  if (!blocks.length) { notify(t('no_blocks_to_save'), 'err'); return; }

  const labelName = (document.getElementById('target-label')?.value || '').trim();
  if (labelName) {
    if (!confirm(t('overwrite_label', labelName))) return;
  }

  const newCode = generateCode(blocks);
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
    const sceneM = trimmed.match(/^scene\s+(.+?)(?:\s+with\s+(\w+))?$/);
    if (sceneM) { result.push({ type: 'scene', background: sceneM[1], transition: sceneM[2] || '' }); i++; continue; }

    // Show
    const showM = trimmed.match(/^show\s+(.+?)(?:\s+at\s+(.+?))?(?:\s+behind\s+(\w+))?(?:\s+with\s+(\w+))?$/);
    if (showM) {
      const imgName = showM[1];
      const atPart = showM[2] || '';
      const behind = showM[3] || '';
      const transition = showM[4] || '';
      let position = '', flipH = false;
      if (atPart) {
        for (const p of atPart.split(',').map(s => s.trim())) {
          if (p === 'xflip') flipH = true; else position = p;
        }
      }
      let j = i + 1;
      const showGroup = [{ image: imgName, position, behind, flipH }];
      let multiTrans = transition;
      while (j < lines.length) {
        const nextTrimmed = lines[j].trim();
        if (!nextTrimmed) { j++; continue; }
        const nextShow = nextTrimmed.match(/^show\s+(.+?)(?:\s+at\s+(.+?))?(?:\s+behind\s+(\w+))?$/);
        if (nextShow) {
          let np = '', nf = false;
          if (nextShow[2]) { for (const p of nextShow[2].split(',').map(s => s.trim())) { if (p === 'xflip') nf = true; else np = p; } }
          showGroup.push({ image: nextShow[1], position: np, behind: nextShow[3] || '', flipH: nf });
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
      result.push({ type: 'dialogue', character: dlgM[1], expression: dlgM[3] || '', text: cleanText, thought });
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
  const labelName = document.getElementById('target-label').value;
  if (!labelName) return;
  if (blocks.length > 0) {
    if (!confirm(t('load_label_confirm', blocks.length, labelName))) return;
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
  if (!scriptText) { notify(t('could_not_read', activeRpyFile), 'err'); return; }
  const content = extractLabelContent(scriptText, labelName);
  if (content === null) { notify(t('label_not_found', labelName), 'err'); return; }
  const parsed = parseLabelContentToBlocks(content);
  blocks = parsed;
  renderBlocks(); updateCodePreview();
  notify(t('loaded_blocks', parsed.length, labelName), 'ok');
}

function exportToFile() {
  const code = generateCode(blocks);
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
        else if (b.type === 'show_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.set(sp.image, sp.image); });
        else if (b.type === 'hide' && b.image) shown.delete(b.image);
        else if (b.type === 'hide_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.delete(sp.image); });
        else if (b.type === 'scene') shown.clear();
      }
    }
  }

  return [...shown.values()];
}

// ═══════════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════════
let pendingBlock = {};

function openModal(type, existing) {
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
    setTimeout(() => populateBgPicker(pendingBlock.background), 50);
  }
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
}

let choiceBlockContext = null;

function restoreMenuPosition(choiceIdx, savedMenuScrollTop, savedChoiceBlocksScrollTop) {
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
    if (choiceBlocksList) choiceBlocksList.scrollTop = savedChoiceBlocksScrollTop || 0;
  }, 140);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  if (choiceBlockContext) {
    const { savedMenuBlock, savedEditingIndex, savedMenuScrollTop, savedChoiceBlocksScrollTop, choiceIdx } = choiceBlockContext;
    choiceBlockContext = null;
    editingIndex = savedEditingIndex;
    pendingBlock = {};
    openModal('menu', savedMenuBlock);
    restoreMenuPosition(choiceIdx, savedMenuScrollTop, savedChoiceBlocksScrollTop);
    return;
  }
  pendingBlock = {};
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
    <div class="form-group">
      <label class="form-label">${t('character')}</label>
      <select class="form-select" id="${prefix}-char-${i}" onchange="onSMCharChange('${prefix}',${i})">${buildCharOptions(sp._charId || '')}</select>
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
    <label class="radio-option"><input type="checkbox" id="${prefix}-flip-${i}" ${sp.flipH ? 'checked' : ''}> ${t('flip_image')}</label>
  </div>`;
}

function onSMCharChange(prefix, i) {
  if (prefix === 'hm') populateHMPicker(i, '');
  else populateSMPicker(prefix, i, '');
}

function populateSMPicker(prefix, i, selectedImage) {
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
  if (!chr || !chr.images.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('no_images')}</div>`;
    return;
  }
  picker.innerHTML = chr.images.map(img =>
    `<div class="img-option ${img.key === selectedImage ? 'selected' : ''}" onclick="selectSMSprite('${prefix}',${i},'${img.key}')" title="${img.key}" id="${prefix}-spi-${img.key}-${i}">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${img.key.replace(charId + '_', '')}</div>
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
    <div class="form-group">
      <label class="form-label">${t('character')}</label>
      <select class="form-select" id="hm-char-${i}" onchange="onSMCharChange('hm',${i})">${buildCharOptions(sp._charId || '')}</select>
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
    div.innerHTML = buildSpriteRowHtml({ image: '', position: '', flipH: false, behind: '' }, i, prefix);
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
        <textarea class="form-textarea" id="f-text" rows="4" placeholder="${t('write_narration')}">${b.text || ''}</textarea>
      </div>`;

    case 'dialogue': return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('character')}</label>
          <select class="form-select" id="f-char" onchange="onDialogueCharChange()">${buildCharOptions(b.character)}</select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('expression_side')}</label>
          <select class="form-select" id="f-expr">${buildExprOptions(b.character, b.expression)}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('expression_preview')}</label>
        <div id="expr-picker" class="img-picker"></div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('dialogue_text')}</label>
        <textarea class="form-textarea" id="f-text" rows="4" placeholder="${t('write_dialogue')}">${b.text || ''}</textarea>
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
      <div class="form-group">
        <label class="form-label">${t('character')}</label>
        <select class="form-select" id="f-char" onchange="onShowCharChange()">${buildCharOptions(b.character)}</select>
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
      // FIX: transition at top
      return `
      <div class="form-group">
        <label class="form-label">${t('transition_with')}</label>
        ${buildTransitionSelect('f-trans', b.transition)}
      </div>
      <div class="form-group">
        <label class="form-label">${t('select_background')}</label>
        <div id="bg-picker" class="img-picker" style="grid-template-columns:repeat(3,1fr);"></div>
        <input type="hidden" id="f-bg" value="${b.background || 'bg black'}">
      </div>`;
    }

    case 'label': return `
      <div class="form-group">
        <label class="form-label">${t('label_name')}</label>
        <input class="form-input" id="f-name" list="dl-labels" value="${b.name || ''}" placeholder="Ej: capitulo_2_inicio">
        <datalist id="dl-labels">${data.labels.map(l => `<option value="${l}">`).join('')}</datalist>
      </div>
      <div style="font-size:11px;color:var(--text2);margin-top:6px;">${t('label_hint')}</div>`;

    case 'menu': return buildMenuBody(b);

    case 'pause': return `
      <div class="form-group">
        <label class="form-label">${t('pause_duration')}</label>
        <input class="form-input" id="f-dur" type="number" min="0.1" step="0.1" value="${b.duration || ''}" placeholder="Ej: 2.0">
      </div>`;

    case 'music': return `
      <div class="form-group">
        <label class="form-label">${t('music_action')}</label>
        <div class="radio-group">
          ${['play', 'stop', 'queue'].map(a => `<label class="radio-option"><input type="radio" name="f-action" value="${a}" ${(b.action || 'play') === a ? 'checked' : ''}> ${a}</label>`).join('')}
        </div>
      </div>
      <div class="form-group" id="fg-file">
        <label class="form-label">${t('audio_file')}</label>
        <input class="form-input" id="f-file" list="dl-audio" value="${b.file || ''}" placeholder="Ej: audio/Morning.mp3">
        <datalist id="dl-audio">${data.audioFiles.map(f => `<option value="audio/${f}">`).join('')}</datalist>
      </div>
      <div class="form-group" id="fg-loop">
        <label class="radio-option"><input type="checkbox" id="f-loop" ${b.loop !== false ? 'checked' : ''}> ${t('loop_playback')}</label>
      </div>`;

    case 'jump': return `
      <div class="form-group">
        <label class="form-label">${t('jump_label')}</label>
        <input class="form-input" id="f-label" list="dl-labels" value="${b.label || ''}" placeholder="Ej: capitulo_2">
        <datalist id="dl-labels">${data.labels.map(l => `<option value="${l}">`).join('')}</datalist>
      </div>`;

    case 'call': return `
      <div class="form-group">
        <label class="form-label">Label de destino</label>
        <input class="form-input" id="f-label" list="dl-labels" value="${b.label || ''}" placeholder="Ej: funcion_importante">
        <datalist id="dl-labels">${data.labels.map(l => `<option value="${l}">`).join('')}</datalist>
      </div>`;

    case 'comment': return `
      <div class="form-group">
        <label class="form-label">${t('comment_text')}</label>
        <input class="form-input" id="f-text" value="${b.text || ''}" placeholder="Ej: TO-DO: añadir expresión aquí">
      </div>`;

    case 'custom': return `
      <div class="form-group">
        <label class="form-label">${t('custom_code')}</label>
        <textarea class="form-textarea" id="f-code" rows="8" style="font-family:monospace;" placeholder="Escribe cualquier código RenPy...">${b.code || ''}</textarea>
      </div>
      <div style="font-size:10px;color:var(--text3);">${t('custom_code_hint')}</div>`;

    default: return `<p>${t('unknown_type')}</p>`;
  }
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
        <div class="form-group">
          <label class="form-label">${t('character')}</label>
          <select class="form-select" id="f-menu-char" onchange="onMenuCharChange()">${buildCharOptions('')}</select>
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

function populateMenuSpritePicker(charId, selectedImage) {
  const picker = document.getElementById('menu-sprite-picker');
  if (!picker) return;
  const chr = data.characters.find(c => c.id === charId);
  if (!chr || !chr.images.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('no_char_images')}</div>`;
    return;
  }
  picker.innerHTML = chr.images.map(img =>
    `<div class="img-option ${img.key === selectedImage ? 'selected' : ''}" onclick="selectMenuSprite('${img.key}')" title="${img.key}" id="msp-${img.key}">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${img.key.replace(charId + '_', '')}</div>
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
      <input class="form-input" id="ct-${i}" value="${escHtml(ch.text || '')}" placeholder="Ej: Ir con Lucco">
    </div>
    <input type="hidden" id="cb-${i}" value="${blocksJson}">
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">
      ${['narration','dialogue','show','show_multi','hide','hide_multi','scene','pause','music','jump','call','comment','custom'].map(t2 => {
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
  const bArr = getChoiceBlocks(i);
  if (!bArr.length) {
    list.innerHTML = `<div style="color:var(--text3);font-size:11px;text-align:center;padding:10px;">${t('no_blocks_in_choice')}</div>`;
    return;
  }
  list.innerHTML = bArr.map((b, j) => {
    const meta = BLOCK_META[b.type] || { icon: '?', labelKey: b.type };
    return `<div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:var(--surface);border-radius:4px;margin-bottom:3px;border-left:3px solid ${meta.color || 'var(--border)'};" draggable="true"
      ondragstart="onChoiceDragStart(event,${i},${j})" ondragend="onChoiceDragEnd(event)"
      ondragover="onChoiceDragOver(event,${i},${j})" ondrop="onChoiceDrop(event,${i},${j})">
      <span style="font-size:12px;">${meta.icon}</span>
      <span style="flex:1;font-size:11px;color:var(--text);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${escHtml(blockDesc(b))}</span>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="editChoiceBlock(${i},${j})" title="${t('btn_edit')}">✏️</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="duplicateChoiceBlock(${i},${j})" title="${t('btn_duplicate')}">📋</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="duplicateChoiceBlockToEnd(${i},${j})" title="${t('btn_duplicate_end')}">⬇️</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="moveChoiceBlock(${i},${j},-1)" title="${t('btn_up')}">▲</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="moveChoiceBlock(${i},${j},1)" title="${t('btn_down')}">▼</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--red);padding:2px;" onclick="removeChoiceBlock(${i},${j})" title="${t('btn_delete')}">🗑</button>
    </div>`;
  }).join('');
}

// ── Choice block drag & drop ──
let choiceDragSrc = null;
function onChoiceDragStart(e, choiceIdx, blockIdx) {
  choiceDragSrc = { choiceIdx, blockIdx };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', blockIdx);
  requestAnimationFrame(() => e.target.style.opacity = '0.4');
}
function onChoiceDragEnd(e) {
  e.target.style.opacity = '1';
  choiceDragSrc = null;
}
function onChoiceDragOver(e, choiceIdx, blockIdx) {
  e.preventDefault();
  if (choiceDragSrc && choiceDragSrc.choiceIdx === choiceIdx) {
    e.dataTransfer.dropEffect = 'move';
  }
}
function onChoiceDrop(e, choiceIdx, targetIdx) {
  e.preventDefault();
  if (!choiceDragSrc || choiceDragSrc.choiceIdx !== choiceIdx || choiceDragSrc.blockIdx === targetIdx) return;
  const bArr = getChoiceBlocks(choiceIdx);
  const [moved] = bArr.splice(choiceDragSrc.blockIdx, 1);
  bArr.splice(targetIdx, 0, moved);
  setChoiceBlocks(choiceIdx, bArr);
  choiceDragSrc = null;
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
  choiceBlockContext = { choiceIdx, blockIdx: -1, savedMenuBlock, savedEditingIndex: editingIndex, savedMenuScrollTop, savedChoiceBlocksScrollTop };
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
  choiceBlockContext = { choiceIdx, blockIdx, savedMenuBlock, savedEditingIndex: editingIndex, savedMenuScrollTop, savedChoiceBlocksScrollTop };
  document.getElementById('modal-overlay').classList.remove('open');
  editingIndex = -1;
  openModal(block.type, { ...block });
}

function moveChoiceBlock(choiceIdx, blockIdx, dir) {
  const bArr = getChoiceBlocks(choiceIdx);
  const newIdx = blockIdx + dir;
  if (newIdx < 0 || newIdx >= bArr.length) return;
  [bArr[blockIdx], bArr[newIdx]] = [bArr[newIdx], bArr[blockIdx]];
  setChoiceBlocks(choiceIdx, bArr);
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
}

function removeChoiceBlock(choiceIdx, blockIdx) {
  const bArr = getChoiceBlocks(choiceIdx);
  bArr.splice(blockIdx, 1);
  setChoiceBlocks(choiceIdx, bArr);
}

function addChoice() {
  const list = document.getElementById('choices-list');
  const i = list.children.length;
  const div = document.createElement('div');
  div.innerHTML = buildChoiceHtml({ text: '', action: 'blocks', jump: '', code: '', blocks: [] }, i);
  list.appendChild(div.firstElementChild);
}

function removeChoice(i) {
  const el = document.getElementById('choice-' + i);
  if (el && document.getElementById('choices-list').children.length > 1) el.remove();
  else notify(t('min_one_option'), 'err');
}

// ═══════════════════════════════════════════════════════════════════
// SAVE BLOCK
// ═══════════════════════════════════════════════════════════════════
function saveBlock() {
  const b = readModalValues();
  if (!b) return;

  if (choiceBlockContext) {
    const { choiceIdx, blockIdx, savedMenuBlock, savedMenuScrollTop, savedChoiceBlocksScrollTop } = choiceBlockContext;
    if (blockIdx >= 0) {
      savedMenuBlock.choices[choiceIdx].blocks[blockIdx] = b;
    } else {
      savedMenuBlock.choices[choiceIdx].blocks.push(b);
    }
    const ctx = choiceBlockContext;
    choiceBlockContext = null;
    editingIndex = ctx.savedEditingIndex;
    document.getElementById('modal-overlay').classList.remove('open');
    pendingBlock = {};
    openModal('menu', savedMenuBlock);
    restoreMenuPosition(choiceIdx, savedMenuScrollTop, savedChoiceBlocksScrollTop);
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
      b.background = g('f-bg') || 'bg black';
      b.transition = g('f-trans') || '';
      break;
    case 'label':
      b.name = (g('f-name') || '').trim().replace(/\s+/g, '_');
      if (!b.name) { notify(t('label_empty'), 'err'); return null; }
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

// FIX: character-specific expressions
function buildExprOptions(charId, selected) {
  // Filter expressions for the selected character
  const charExprs = data.expressions.filter(e => e.charId === 'Paul' || e.charId === charId);
  if (!charExprs.length) {
    return `<option value="">${t('no_transition')}</option>`;
  }
  const opts = charExprs.map(e =>
    `<option value="${e.key}" ${e.key === selected ? 'selected' : ''}>${e.key}</option>`).join('');
  return `<option value="">${t('no_transition')}</option>${opts}`;
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

// FIX: update expression picker when character changes in dialogue
function onDialogueCharChange() {
  const charId = document.getElementById('f-char')?.value || '';
  const exprSel = document.getElementById('f-expr');
  if (exprSel) exprSel.innerHTML = buildExprOptions(charId, '');
  populateExpressionPicker(charId, '');
}

// ── Visual background picker ──
function populateBgPicker(selectedKey) {
  const picker = document.getElementById('bg-picker');
  if (!picker) return;
  const allBgs = [{ key: 'bg black', path: null }, ...data.backgrounds];
  picker.innerHTML = allBgs.map(bg => {
    const safeId = 'bgp-' + bg.key.replace(/\s/g, '_');
    return `<div class="img-option ${bg.key === selectedKey ? 'selected' : ''}" onclick="selectBgOption('${bg.key.replace(/'/g, "\\'")}')" title="${bg.key}" id="${safeId}" style="aspect-ratio:16/9;overflow:hidden;">
      ${bg.path ? `<img src="${getImageURL(bg.path)}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'" />` : '<div style="width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;font-size:10px;color:#888;">bg black</div>'}
      <div class="lbl">${bg.key}</div>
    </div>`;
  }).join('');
}

function selectBgOption(key) {
  document.querySelectorAll('#bg-picker .img-option').forEach(el => el.classList.remove('selected'));
  const safeId = 'bgp-' + key.replace(/\s/g, '_');
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
function populateHMPicker(i, selectedImage) {
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
  if (!chr) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('select_character')}</div>`;
    return;
  }
  const visibleImages = chr.images.filter(img => shownKeys.has(img.key));
  if (!visibleImages.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('no_char_images')}</div>`;
    return;
  }
  picker.innerHTML = visibleImages.map(img =>
    `<div class="img-option ${img.key === selectedImage ? 'selected' : ''}" onclick="selectSMSprite('hm',${i},'${img.key}')" title="${img.key}" id="hm-spi-${img.key}-${i}">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${img.key.replace(charId + '_', '')}</div>
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

// FIX: expression picker filters by character
function populateExpressionPicker(charId, selectedKey) {
  const picker = document.getElementById('expr-picker');
  if (!picker) return;
  // Show expressions for Paul (current) + for the specific character
  const charExprs = data.expressions.filter(e => e.charId === 'Paul' || e.charId === charId);
  if (!charExprs.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('no_expressions_found')}</div>`;
    return;
  }
  picker.innerHTML = charExprs.map(e =>
    `<div class="img-option ${e.key === selectedKey ? 'selected' : ''}" onclick="selectExpression('${e.key}')" title="${e.key}" id="ep-${e.key}">
      <img src="${getImageURL(e.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${e.key}</div>
    </div>`).join('');
}

function selectExpression(key) {
  document.querySelectorAll('#expr-picker .img-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('ep-' + key)?.classList.add('selected');
  const sel = document.getElementById('f-expr');
  if (sel) sel.value = key;
}

function onShowCharChange() {
  const charId = document.getElementById('f-char')?.value;
  const currentImage = document.getElementById('f-image')?.value;
  populateSpritePicker(charId, currentImage);
}

function populateSpritePicker(charId, selectedImage) {
  const picker = document.getElementById('sprite-picker');
  if (!picker) return;
  const chr = data.characters.find(c => c.id === charId);
  if (!chr || !chr.images.length) {
    picker.innerHTML = `<div style="color:var(--text3);font-size:11px;grid-column:1/-1">${t('no_char_images')}</div>`;
    return;
  }
  picker.innerHTML = chr.images.map(img =>
    `<div class="img-option ${img.key === selectedImage ? 'selected' : ''}" onclick="selectSpriteImage('${img.key}')" title="${img.key}" id="sp-${img.key}">
      <img src="${getImageURL(img.path)}" onerror="this.style.display='none'" />
      <div class="lbl">${img.key.replace(charId + '_', '')}</div>
    </div>`).join('');
}

function selectSpriteImage(key) {
  document.querySelectorAll('#sprite-picker .img-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('sp-' + key)?.classList.add('selected');
  document.getElementById('f-image').value = key;
}

function populateCharSelect(type, b) {
  if (type === 'show') {
    const charId = b.character || (data.characters[0]?.id);
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
  if (s.theme) {
    document.documentElement.setAttribute('data-theme', s.theme);
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
  
  applyI18n();
  renderBlocks();
  updateCodePreview();

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

  // Listen for reload events from declaration window
  window.api.onReloadData(async () => {
    if (gamePath) {
      await loadProjectData();
      renderAssetBrowser();
      notify('Datos recargados', 'ok');
    }
  });

  // Listen for settings changes from other windows
  window.api.onSettingsChanged((s) => {
    if (s.theme) document.documentElement.setAttribute('data-theme', s.theme);
    if (s.language && s.language !== currentLang) {
      loadI18n(s.language).then(() => { applyI18n(); renderBlocks(); });
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
