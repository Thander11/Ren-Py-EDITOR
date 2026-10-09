// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Patch: content kept out of the game (for example,
// its Steam version) and packed apart for players to add. The files
// are handled by main.js; this is the Patch tab of the game settings,
// the patch images picker and what the build dialog shows.
// ═══════════════════════════════════════════════════════════

let patchInfo = null;   // { config, owners, images, warnings } from main.js
let patchDraft = null;  // the Patch tab's values until they are saved

async function loadPatchInfo() {
  patchInfo = gamePath ? await window.api.patchGet() : null;
  return patchInfo;
}

const patchEnabled = () => !!(patchInfo && patchInfo.config.enabled);

// ── Patch tab of the game settings ──

function initPatchDraft() {
  const c = patchInfo.config;
  patchDraft = {
    enabled: c.enabled,
    name: c.name || t('patch_name_placeholder'),
    readme: c.readme || t('patch_readme_default'),
    readmeFile: c.enabled ? c.readmeFile : t('patch_readme_file')
  };
}

function patchZipName() {
  const build = document.getElementById('game-build')?.value.trim() || gameInfo?.buildName || 'game';
  const version = document.getElementById('game-version')?.value.trim() || gameInfo?.version || '';
  return `${build}${version ? '-' + version : ''}-patch.zip`;
}

function patchWarningsHtml(warnings) {
  return warnings.map(w => `<li class="patch-warn">${icon('alert', 15)}<span>${escHtml(w.type === 'image'
    ? t('patch_warn_image', w.name, `${w.file}:${w.line}`)
    : t('patch_warn_label', w.name, `${w.file}:${w.line}`))}</span></li>`).join('');
}

function renderPatchSettings() {
  const panel = document.getElementById('game-panel-patch');
  if (!panel || !patchDraft) return;
  const d = patchDraft;
  const info = patchInfo;
  const parts = info.owners.flatMap(o => o.parts.map(p => ({ ...p, owner: o.owner })));
  panel.innerHTML = `
    <button class="patch-switch" type="button" role="switch" aria-checked="${d.enabled}" onclick="togglePatchEnabled()">
      <span class="patch-switch-track"><span class="patch-switch-knob"></span></span>
      <span class="patch-switch-text">
        <span class="patch-switch-title">${t('patch_enable')}</span>
        <span class="settings-hint">${t('patch_enable_hint')}</span>
      </span>
    </button>
    ${!d.enabled ? `<p class="patch-off">${t('patch_off_note')}</p>` : `
    <div class="patch-grid">
      <div class="patch-form">
        <div class="form-group">
          <label class="form-label" for="patch-name">${t('patch_name')}</label>
          <input class="form-input" id="patch-name" value="${escHtml(d.name)}" oninput="patchDraft.name = this.value">
        </div>
        <div class="form-group">
          <div class="form-label">${t('patch_file')}</div>
          <code class="settings-path patch-file">${icon('package', 14)}<span id="patch-zip-name">${escHtml(patchZipName())}</span></code>
          <p class="settings-hint">${t('patch_file_hint')}</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="patch-readme">${t('patch_readme')}</label>
          <textarea class="form-input" id="patch-readme" rows="3" oninput="patchDraft.readme = this.value">${escHtml(d.readme)}</textarea>
          <p class="settings-hint">${t('patch_readme_hint', d.readmeFile)}</p>
        </div>
        <div class="patch-how">
          <div class="form-label">${t('patch_how')}</div>
          <ol>
            <li>${t('patch_how_1')}</li>
            <li>${t('patch_how_2')}</li>
            <li>${t('patch_how_3')}</li>
          </ol>
        </div>
      </div>
      <section class="patch-content" aria-labelledby="patch-content-title">
        <h3 id="patch-content-title">${icon('patch', 16)}${t('patch_content')}</h3>
        <div class="patch-sub">${t('patch_blocks_count', parts.length)}</div>
        ${parts.length ? `<ul class="patch-parts">${parts.map(p => `
          <li><code>${escHtml(p.owner)}</code><span>${escHtml(p.title || p.label)}</span>
          <button class="btn btn-secondary btn-sm" onclick="openPatchOwner('${p.owner}')">${t('patch_open')}</button></li>`).join('')}</ul>`
          : `<p class="settings-hint">${t('patch_blocks_none')}</p>`}
        <div class="patch-sub">${t('patch_images_count', info.images.length)}</div>
        ${info.images.length ? `<ul class="patch-image-names">${info.images.map(i => `<li><code>${escHtml(i.name)}</code></li>`).join('')}</ul>`
          : `<p class="settings-hint">${t('patch_images_none')}</p>`}
        <button class="btn btn-secondary btn-sm" onclick="openPatchImages()">${icon('image', 14)}${t('patch_choose_images')}</button>
        ${info.warnings.length ? `<ul class="patch-warnings">${patchWarningsHtml(info.warnings)}</ul>` : ''}
      </section>
    </div>`}`;
}

function togglePatchEnabled() {
  patchDraft.enabled = !patchDraft.enabled;
  renderPatchSettings();
}

// The file name follows the game's build name and version while they are edited
function refreshPatchZipName() {
  const el = document.getElementById('patch-zip-name');
  if (el) el.textContent = patchZipName();
}

async function savePatchSettings() {
  if (!patchDraft) return true;
  const c = patchInfo.config;
  const d = patchDraft;
  const changed = d.enabled !== c.enabled || (d.enabled && (d.name !== c.name || d.readme !== c.readme || d.readmeFile !== c.readmeFile));
  if (!changed) return true;
  const r = await window.api.patchSave({ ...d, name: d.name.trim() || t('patch_name_placeholder') });
  if (!r.ok) { notify(t('patch_save_error'), 'err'); return false; }
  await loadPatchInfo();
  applyPatchToEditor();
  return true;
}

async function openPatchOwner(label) {
  closeGameSettings();
  if (typeof claudeTools !== 'undefined') await claudeTools.open_in_editor({ label }).catch(e => notify(e.message, 'err'));
}

// ── Patch images picker ──

let patchImagesFilter = '';

// Every image the editor knows, with the name Ren'Py uses for it
function patchImageList() {
  const list = [];
  data.backgrounds.forEach(b => list.push({ name: b.key, path: b.path, patch: !!b.patch, kind: 'backgrounds' }));
  data.scenes.forEach(b => list.push({ name: b.key, path: b.path, patch: !!b.patch, kind: 'scenes' }));
  data.characters.forEach(c => c.images.forEach(im => list.push({ name: im.key, path: im.path, patch: !!im.patch, kind: 'characters', owner: c.displayName })));
  data.expressions.forEach(x => list.push({ name: `side ${x.charId} ${x.key}`, path: x.path, patch: !!x.patch, kind: 'expressions' }));
  return list;
}

function renderPatchImages() {
  const q = patchImagesFilter.trim().toLowerCase();
  const list = patchImageList().filter(i => !q || i.name.toLowerCase().includes(q) || (i.owner || '').toLowerCase().includes(q));
  const groups = ['backgrounds', 'scenes', 'characters', 'expressions'];
  document.getElementById('patch-images-list').innerHTML = groups.map(kind => {
    const items = list.filter(i => i.kind === kind);
    if (!items.length) return '';
    return `<section class="patch-img-group"><h3>${t('patch_kind_' + kind)} <span>${items.filter(i => i.patch).length}/${items.length}</span></h3>
      <ul>${items.map(i => `
        <li class="${i.patch ? 'in-patch' : ''}">
          <img src="${getImageURL(i.path)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <span class="patch-img-name"><code>${escHtml(i.name)}</code>${i.owner ? `<span>${escHtml(i.owner)}</span>` : ''}</span>
          <label class="settings-check"><input type="checkbox" ${i.patch ? 'checked' : ''} onchange="movePatchImage(this, ${escHtml(JSON.stringify(i.name))})">${t('patch_only')}</label>
        </li>`).join('')}</ul></section>`;
  }).join('') || `<p class="settings-hint">${t('patch_images_empty')}</p>`;
}

async function openPatchImages() {
  patchImagesFilter = '';
  document.getElementById('patch-images-search').value = '';
  renderPatchImages();
  document.getElementById('patch-images-overlay').classList.add('open');
  document.getElementById('patch-images-search').focus();
}

async function closePatchImages() {
  document.getElementById('patch-images-overlay').classList.remove('open');
  await loadPatchInfo();
  renderPatchSettings();
}

async function movePatchImage(input, name) {
  input.disabled = true;
  const r = await window.api.patchMoveImage(name, input.checked);
  if (!r.ok) {
    input.checked = !input.checked;
    notify(r.error === 'exists' ? t('patch_move_exists', r.file) : t('patch_move_error', r.error), 'err');
  }
  await loadProjectData();
  renderAssetBrowser();
  renderPatchImages();
}

// ── Build dialog ──

let buildPatchMode = 'split';
const PATCH_BUILD_MODES = ['split', 'full', 'base'];

function buildPatchHtml() {
  if (!patchEnabled()) return '';
  const w = patchInfo.warnings;
  return `
    <fieldset class="build-patch">
      <legend class="form-label">${icon('patch', 14)}${t('build_patch_mode')}</legend>
      ${PATCH_BUILD_MODES.map(m => `
        <label class="build-pkg">
          <input type="radio" name="build-patch-mode" value="${m}" ${m === buildPatchMode ? 'checked' : ''} onchange="buildPatchMode = this.value; renderBuildPatchNotes()">
          <span class="build-pkg-text"><span class="build-pkg-name">${t('build_patch_' + m)}</span>
          <span class="build-pkg-hint">${t('build_patch_' + m + '_hint')}</span></span>
        </label>`).join('')}
    </fieldset>
    <div class="patch-checks">
      <div class="form-label">${t('build_patch_checks')}</div>
      ${w.length ? `<ul class="patch-warnings">${patchWarningsHtml(w)}</ul>`
        : `<p class="patch-ok">${icon('check', 15)}${t('build_patch_checks_ok')}</p>`}
    </div>
    <div id="build-patch-notes"></div>`;
}

function renderBuildPatchNotes() {
  const el = document.getElementById('build-patch-notes');
  if (el) el.innerHTML = buildPatchMode === 'full' ? '' : `<p class="patch-steam">${icon('info', 15)}<span>${t('build_patch_steam')}</span></p>`;
}

// ── Patch block of the scenes editor ──
function addPatchBlock() {
  if (!patchEnabled()) { notify(t('patch_disabled_block'), 'err'); return; }
  editingIndex = -1;
  openModal('condition', { type: 'condition', patch: true, condition: PATCH_CONDITION, title: '', blocks: [], elifBlocks: [], hasElse: true, elseBlocks: [] }, true);
}

// ── The rest of the editor follows the patch being on or off ──
function applyPatchToEditor() {
  document.querySelectorAll('.palette-group.cat-patch').forEach(g => { g.hidden = !patchEnabled(); });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('patch-images-overlay').classList.contains('open')
    && !document.querySelector('.app-dialog-overlay')) { e.stopImmediatePropagation(); closePatchImages(); }
}, true);
