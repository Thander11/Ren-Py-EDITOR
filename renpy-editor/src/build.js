// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Build: packages the game for each system with
// Ren'Py's own "distribute" command (run by main.js)
// ═══════════════════════════════════════════════════════════

const BUILD_OPTIONS = [
  { id: 'win', checked: true },
  { id: 'linux', checked: false },
  { id: 'mac', checked: false },
  { id: 'pc', checked: false },
  { id: 'market', checked: false }
];

let buildState = 'setup';  // setup | building | done | error
let buildDestination = '';
let buildResult = null;
let buildLog = [];

async function openBuildDialog() {
  if (!gamePath) { notify(t('open_project_first'), 'err'); return; }
  const defaults = await window.api.getBuildDefaults();
  if (!defaults.building) {
    await loadPatchInfo();
    buildState = 'setup';
    buildResult = null;
    buildLog = [];
    buildDestination = buildDestination || defaults.destination;
    renderBuildDialog();
  }
  document.getElementById('build-overlay').classList.add('open');
}

function closeBuildDialog() {
  // While building the dialog can be hidden; the build goes on and reports when it ends
  document.getElementById('build-overlay').classList.remove('open');
}

function selectedBuildPackages() {
  return [...document.querySelectorAll('.build-pkg input:checked')].map(i => i.value);
}

function renderBuildDialog() {
  const body = document.getElementById('build-body');
  const footer = document.getElementById('build-footer');
  if (buildState === 'setup') {
    body.innerHTML = `
      <p class="settings-hint">${t('build_intro')}</p>
      <fieldset class="build-pkgs">
        <legend class="form-label">${t('build_systems')}</legend>
        ${BUILD_OPTIONS.map(o => `
          <label class="build-pkg">
            <input type="checkbox" value="${o.id}" ${o.checked ? 'checked' : ''} onchange="onBuildPackageChange()">
            <span class="build-pkg-text"><span class="build-pkg-name">${t('build_pkg_' + o.id)}</span>
            <span class="build-pkg-hint">${t('build_pkg_' + o.id + '_hint')}</span></span>
          </label>`).join('')}
      </fieldset>
      ${buildPatchHtml()}
      <div class="form-group">
        <div class="form-label">${t('build_destination')}</div>
        <div class="build-dest">
          <code class="settings-path" id="build-dest-path">${escHtml(buildDestination)}</code>
          <button class="btn btn-secondary btn-sm" onclick="pickBuildFolder()">${icon('folder-open', 14)}${t('change_folder')}</button>
        </div>
      </div>
      <p class="game-note">${t('build_note')}</p>`;
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="closeBuildDialog()">${t('cancel')}</button>
      <button class="btn btn-primary" id="build-start-btn" onclick="startBuild()">${icon('package', 15)}${t('build_start')}</button>`;
    onBuildPackageChange();
    renderBuildPatchNotes();
    return;
  }
  if (buildState === 'building') {
    body.innerHTML = `
      <div class="build-status" role="status" aria-live="polite">
        <div class="build-step" id="build-step">${t('build_starting')}</div>
        <div class="renpy-bar"><div id="build-bar-fill" class="indeterminate"></div></div>
        <div class="build-count" id="build-count"></div>
      </div>
      <details class="build-log"><summary>${t('build_log')}</summary><pre id="build-log"></pre></details>`;
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="closeBuildDialog()">${t('build_hide')}</button>
      <button class="btn btn-danger" onclick="cancelBuild()">${t('build_stop')}</button>`;
    return;
  }
  const r = buildResult || {};
  const ok = buildState === 'done';
  body.innerHTML = `
    <div class="build-result ${ok ? 'ok' : 'err'}">
      ${icon(ok ? 'check' : 'close', 20)}
      <span>${t(ok ? 'build_done' : (r.cancelled ? 'build_cancelled' : 'build_failed'))}</span>
    </div>
    ${r.files && r.files.length ? `<ul class="build-files">${r.files.map(f => `<li><code>${escHtml(f)}</code></li>`).join('')}</ul>` : ''}
    ${!ok && r.message ? `<p class="settings-hint error">${escHtml(r.message)}</p>` : ''}
    <details class="build-log" ${ok ? '' : 'open'}><summary>${t('build_log')}</summary><pre>${escHtml(buildLog.slice(-60).join('\n'))}</pre></details>`;
  footer.innerHTML = `
    <button class="btn btn-secondary" onclick="buildState = 'setup'; renderBuildDialog()">${t('build_again')}</button>
    ${r.destination ? `<button class="btn btn-secondary" onclick="window.api.openFolder(buildResult.destination)">${icon('folder-open', 15)}${t('build_open_folder')}</button>` : ''}
    <button class="btn btn-primary" onclick="closeBuildDialog()">${t('build_close')}</button>`;
}

function onBuildPackageChange() {
  const btn = document.getElementById('build-start-btn');
  if (btn) btn.disabled = !selectedBuildPackages().length;
}

async function pickBuildFolder() {
  const folder = await window.api.selectBuildFolder(buildDestination);
  if (!folder) return;
  buildDestination = folder;
  document.getElementById('build-dest-path').textContent = folder;
}

async function startBuild() {
  const packages = selectedBuildPackages();
  if (!packages.length) return;
  BUILD_OPTIONS.forEach(o => { o.checked = packages.includes(o.id); });
  buildState = 'building';
  buildLog = [];
  renderBuildDialog();
  const r = await window.api.buildGame({ packages, destination: buildDestination, patchMode: patchEnabled() ? buildPatchMode : undefined });
  buildResult = r;
  if (r.log && !buildLog.length) buildLog = r.log;
  buildState = r.ok ? 'done' : 'error';
  if (r.error === 'no-renpy') r.message = t('build_no_renpy');
  renderBuildDialog();
  // If the dialog was hidden while building, say how it ended
  if (!document.getElementById('build-overlay').classList.contains('open')) {
    notify(t(r.ok ? 'build_done' : 'build_failed'), r.ok ? 'ok' : 'err');
  }
}

async function cancelBuild() {
  await window.api.cancelBuild();
}

window.api.onBuildProgress((msg) => {
  if (buildState !== 'building') return;
  const step = document.getElementById('build-step');
  const fill = document.getElementById('build-bar-fill');
  const count = document.getElementById('build-count');
  if (msg.type === 'progress') {
    if (step) step.textContent = msg.text;
    if (fill) { fill.classList.remove('indeterminate'); fill.style.width = Math.round(msg.done / msg.total * 100) + '%'; }
    if (count) count.textContent = t('build_count', msg.done, msg.total);
  } else {
    buildLog.push(msg.text);
    if (step) step.textContent = msg.text;
    if (fill) { fill.classList.add('indeterminate'); fill.style.width = ''; }
    if (count) count.textContent = '';
    const log = document.getElementById('build-log');
    if (log) log.textContent = buildLog.slice(-200).join('\n');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('build-overlay').classList.contains('open')
    && !document.querySelector('.app-dialog-overlay')) closeBuildDialog();
});
