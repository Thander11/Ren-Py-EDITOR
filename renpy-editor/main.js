const { app, BrowserWindow, ipcMain, dialog, protocol, net, Menu, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const url = require('url');
const { spawn } = require('child_process');

let mainWindow = null;
let declWindow = null;
let mainMenuWindow = null;
let currentGamePath = '';
let settings = {
  theme: 'dark',
  language: 'es',
  lastProjectPath: '',
  lastGamePath: '',
  renpyExecutablePath: '',
  renpyInstallDir: '',
  projectsDirectory: '',
  windowMaximized: false,
  spellcheckLanguages: [],
  panelSizes: { panelCode: 560, panelAssets: 220 }
};
let fsWatcher = null;
let watchDebounce = null;

const settingsPath = path.join(__dirname, 'settings.json');

// ── Helper: Deep merge objects ──
function deepMerge(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

// ── Load / Save Settings ──
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      settings = deepMerge(settings, saved);
    }
  } catch (e) { /* use defaults */ }
}

function saveSettings() {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

// ── Register custom protocol before app.ready ──
protocol.registerSchemesAsPrivileged([{
  scheme: 'game',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
}]);

// ── App Ready ──
app.whenReady().then(() => {
  loadSettings();
  applySpellcheckSettings();

  // Register the game:// protocol to serve files from the game directory
  protocol.handle('game', (request) => {
    if (!currentGamePath) return new Response('No project loaded', { status: 404 });
    const reqUrl = new URL(request.url);
    const relativePath = decodeURIComponent(reqUrl.pathname).replace(/^\/+/, '');
    const fullPath = path.join(currentGamePath, relativePath);
    // Security: ensure path is within the game directory
    const resolved = path.resolve(fullPath);
    const base = path.resolve(currentGamePath);
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
      return new Response('Forbidden', { status: 403 });
    }
    try {
      return net.fetch(url.pathToFileURL(resolved).href);
    } catch (e) {
      return new Response('Not found', { status: 404 });
    }
  });

  createMainWindow();
});

app.on('window-all-closed', () => {
  stopFileWatcher();
  if (process.platform !== 'darwin') app.quit();
});

// ── Spellcheck ──
// Dictionaries offered in the settings panel (only those Electron can download are shown)
const SPELLCHECK_LANGUAGES = ['es-ES', 'en-US', 'en-GB', 'de-DE', 'fr-FR', 'it-IT', 'pt-BR', 'ru'];

function applySpellcheckSettings() {
  const ses = session.defaultSession;
  const available = ses.availableSpellCheckerLanguages;
  const langs = (settings.spellcheckLanguages || []).filter(l => available.includes(l));
  ses.setSpellCheckerEnabled(langs.length > 0);
  if (langs.length) ses.setSpellCheckerLanguages(langs);
}

// Right-click menu on editable fields: spelling suggestions + clipboard actions
function attachEditContextMenu(win) {
  win.webContents.on('context-menu', (_, params) => {
    if (!params.isEditable) return;
    const items = [];
    if (params.misspelledWord) {
      const suggestions = params.dictionarySuggestions.slice(0, 6);
      if (suggestions.length) {
        suggestions.forEach(word => items.push({ label: word, click: () => win.webContents.replaceMisspelling(word) }));
      } else {
        items.push({ label: mt('spell_no_suggestions'), enabled: false });
      }
      items.push({ type: 'separator' });
      items.push({
        label: mt('spell_add_to_dictionary'),
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
      });
      items.push({ type: 'separator' });
    }
    const f = params.editFlags;
    items.push(
      { label: mt('ctx_cut'), role: 'cut', enabled: f.canCut },
      { label: mt('ctx_copy'), role: 'copy', enabled: f.canCopy },
      { label: mt('ctx_paste'), role: 'paste', enabled: f.canPaste },
      { type: 'separator' },
      { label: mt('ctx_select_all'), role: 'selectAll', enabled: f.canSelectAll }
    );
    Menu.buildFromTemplate(items).popup({ window: win });
  });
}

// ── Create Main Window ──
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 900, minHeight: 600,
    title: "Ren'Py EDITOR",
    icon: path.join(__dirname, 'src', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  attachEditContextMenu(mainWindow);
  Menu.setApplicationMenu(null);
  if (process.argv.includes('--dev')) mainWindow.webContents.openDevTools();
  
  // Restore maximized state
  if (settings.windowMaximized) mainWindow.maximize();
  
  // Save state when window is maximized or restored
  mainWindow.on('maximize', () => {
    settings.windowMaximized = true;
    saveSettings();
  });
  mainWindow.on('unmaximize', () => {
    settings.windowMaximized = false;
    saveSettings();
  });
  
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Create Declaration Window ──
function createDeclarationWindow() {
  if (declWindow) { declWindow.focus(); return; }
  declWindow = new BrowserWindow({
    width: 1000, height: 750,
    minWidth: 700, minHeight: 500,
    title: "Ren'Py EDITOR — Declaraciones",
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'declaration-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  declWindow.loadFile(path.join(__dirname, 'src', 'declaration.html'));
  attachEditContextMenu(declWindow);
  declWindow.on('closed', () => { declWindow = null; });
}

// ── Create Main Menu Editor Window ──
function createMainMenuWindow() {
  if (mainMenuWindow) { mainMenuWindow.focus(); return; }
  mainMenuWindow = new BrowserWindow({
    width: 1300, height: 820,
    minWidth: 900, minHeight: 600,
    title: "Ren'Py EDITOR — " + mt('main_menu_title'),
    parent: mainWindow,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'main-menu-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainMenuWindow.loadFile(path.join(__dirname, 'src', 'main-menu.html'));
  attachEditContextMenu(mainMenuWindow);
  // Opens maximized, filling the screen
  mainMenuWindow.once('ready-to-show', () => {
    mainMenuWindow.maximize();
    mainMenuWindow.show();
  });
  mainMenuWindow.on('closed', () => { mainMenuWindow = null; });
}

// Folders (relative to game/) that the editor reads from and writes to
const PROJECT_FOLDERS = [
  'audio',
  path.join('images', 'characters'),
  path.join('images', 'backgrounds'),
  path.join('images', 'scenes'),
  path.join('images', 'expressions'),
  path.join('gui', 'main_menu_custom')
];

// ── Auto-create the folders used by the editor if missing ──
function autoCreateFolders(gamePath) {
  for (const rel of PROJECT_FOLDERS) {
    const dir = path.join(gamePath, rel);
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e) { /* ignore: folder can't be created */ }
  }
}

// Transforms the generated code relies on (at xflip, at blur)
const REQUIRED_TRANSFORMS = {
  xflip: 'transform xflip:\n    xzoom -1\n',
  blur: 'transform blur:\n    blur 8\n'
};

// ── Append required transforms missing from existing projects (positions.rpy) ──
function ensureRequiredTransforms(gamePath) {
  try {
    const rpyFiles = listDirRecursive(gamePath, gamePath).filter(f => !f.isDir && f.name.endsWith('.rpy'));
    const allText = rpyFiles.map(f => fs.readFileSync(path.join(gamePath, f.path), 'utf-8')).join('\n');
    const missing = Object.entries(REQUIRED_TRANSFORMS)
      .filter(([name]) => !new RegExp(`^transform\\s+${name}\\s*:`, 'm').test(allText))
      .map(([, code]) => code);
    if (!missing.length) return;
    const fp = path.join(gamePath, 'positions.rpy');
    const existing = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '# Positions\n';
    fs.writeFileSync(fp, existing.replace(/\s*$/, '') + '\n\n' + missing.join('\n'), 'utf-8');
  } catch (e) { /* ignore: can't update positions.rpy */ }
}

// ── Prepare a project so it has every file and folder the editor needs ──
function ensureProjectStructure(gamePath) {
  autoCreateFolders(gamePath);
  autoCreateRpyFiles(gamePath);
  ensureRequiredTransforms(gamePath);
}

// ── Auto-create default .rpy files if missing ──
function autoCreateRpyFiles(gamePath) {
  const defaults = {
    'characters.rpy': '# Characters\n',
    'backgrounds.rpy': '# Backgrounds\n',
    'expressions.rpy': '# Expressions\n',
    'scenes.rpy': '# Scenes\n',
    'audio.rpy': '# Audio\n',
    'animations.rpy': `# Animations

transform move_center_to_right:
    xalign 0.5 yalign 0.5
    linear 0.5 xalign 1.0

transform move_right_to_center:
    xalign 1.0 yalign 0.5
    linear 0.5 xalign 0.5

transform move_center_to_left:
    xalign 0.5 yalign 0.5
    linear 0.5 xalign 0.0

transform move_left_to_center:
    xalign 0.0 yalign 0.5
    linear 0.5 xalign 0.5

transform move_center_to_centerleft:
    xalign 0.5 yalign 0.5
    linear 0.5 xalign 0.3

transform move_centerleft_to_center:
    xalign 0.3 yalign 0.5
    linear 0.5 xalign 0.5

transform move_center_to_centerright:
    xalign 0.5 yalign 0.5
    linear 0.5 xalign 0.7

transform move_centerright_to_center:
    xalign 0.7 yalign 0.5
    linear 0.5 xalign 0.5

transform aparecer_desde_abajo:
    xpos 0.3 ypos 1.5
    linear 1.0 ypos 0.0
`,
    'positions.rpy': `# Positions
define center_left = Position(xalign=0.3, yalign=1.0)
define center_right = Position(xalign=0.7, yalign=1.0)

transform xflip:
    xzoom -1

transform blur:
    blur 8
`,
    // Main menu editor: disabled until the user saves a menu, so the game keeps
    // its original menu. "placeholder" tells the editor nothing was configured yet.
    'main_menu_custom.rpy': `## renpy-editor:main_menu {"version":1,"enabled":false,"placeholder":true}
##
## Main menu generated by Ren'Py EDITOR. Edit it from the "Main menu" window:
## manual changes to this file will be overwritten.

## The custom main menu is disabled: the game uses the one in screens.rpy.
`
  };

  for (const [filename, content] of Object.entries(defaults)) {
    const fp = path.join(gamePath, filename);
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, content, 'utf-8');
    }
  }
}

// ── File Watcher ──
function startFileWatcher(gamePath) {
  stopFileWatcher();
  try {
    fsWatcher = fs.watch(gamePath, { persistent: false }, (eventType, filename) => {
      if (!filename || !filename.endsWith('.rpy')) return;
      // Debounce: avoid multiple rapid reloads
      if (watchDebounce) clearTimeout(watchDebounce);
      watchDebounce = setTimeout(() => {
        if (mainWindow) mainWindow.webContents.send('file-changed', filename);
      }, 500);
    });
  } catch (e) { /* can't watch */ }
}

function stopFileWatcher() {
  if (fsWatcher) { fsWatcher.close(); fsWatcher = null; }
  if (watchDebounce) { clearTimeout(watchDebounce); watchDebounce = null; }
}

// ── Helper: list directory recursively for structure ──
function listDirRecursive(dirPath, basePath) {
  const result = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const rel = path.relative(basePath, path.join(dirPath, entry.name)).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        result.push({ name: entry.name, path: rel, isDir: true });
        result.push(...listDirRecursive(path.join(dirPath, entry.name), basePath));
      } else {
        result.push({ name: entry.name, path: rel, isDir: false });
      }
    }
  } catch (e) { /* dir doesn't exist */ }
  return result;
}

function getProjectRootFromGamePath(gamePath) {
  if (!gamePath) return '';
  const norm = path.normalize(gamePath);
  if (path.basename(norm).toLowerCase() === 'game') {
    return path.dirname(norm);
  }
  return norm;
}

async function ensureRenpyExecutablePath() {
  const savedPath = settings.renpyExecutablePath;
  if (savedPath && fs.existsSync(savedPath) && fs.statSync(savedPath).isFile()) {
    return savedPath;
  }
  const detected = findInstalledRenpy();
  if (detected) {
    settings.renpyExecutablePath = detected;
    saveSettings();
    return detected;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar ejecutable de Ren\'Py (renpy.exe)',
    properties: ['openFile'],
    filters: [
      { name: 'Ejecutables', extensions: ['exe', 'bat', 'cmd'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePaths.length) return null;

  const selected = result.filePaths[0];
  settings.renpyExecutablePath = selected;
  saveSettings();
  return selected;
}

// ── i18n for dialogs shown by the main process ──
function mt(key, ...args) {
  let dict = {};
  try {
    dict = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'i18n', (settings.language || 'es') + '.json'), 'utf-8'));
  } catch (e) { /* use key */ }
  let str = dict[key] || key;
  args.forEach((a, i) => { str = str.replace(`{${i}}`, a); });
  return str;
}

// ═════════════════════════════════════════════════════════════════════
// IMAGE FOLDERS NOT IN ENGLISH → ENGLISH FOLDERS
// Works for folders in any language: each declaration file says which
// English folder its images belong to, so any declared image that isn't
// inside that folder is moved there and every path to it is updated.
// ═════════════════════════════════════════════════════════════════════
const IMAGE_CATEGORY_FILES = [
  { file: 'characters.rpy', dir: 'characters' },
  { file: 'backgrounds.rpy', dir: 'backgrounds' },
  { file: 'scenes.rpy', dir: 'scenes' },
  { file: 'expressions.rpy', dir: 'expressions' }
];
const ENGLISH_IMAGE_DIRS = IMAGE_CATEGORY_FILES.map(c => c.dir);
const IMAGE_DECL_RE = /^[ \t]*image\s+[^=\n]+?=\s*"([^"\n]+)"/gm;
const IMAGE_FILE_RE = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i;
const declinedMigrations = new Set();

function filesAreEqual(a, b) {
  try {
    const sa = fs.statSync(a), sb = fs.statSync(b);
    if (sa.size !== sb.size) return false;
    return fs.readFileSync(a).equals(fs.readFileSync(b));
  } catch (e) { return false; }
}

// Remove empty folders (bottom-up), including dir itself if it ends up empty
function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
  for (const entry of fs.readdirSync(dir)) removeEmptyDirs(path.join(dir, entry));
  if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
}

function listProjectRpyFiles(gamePath) {
  return listDirRecursive(gamePath, gamePath)
    .filter(f => !f.isDir && f.name.endsWith('.rpy'))
    .map(f => path.join(gamePath, f.path));
}

const sameDirName = (a, b) => a.toLowerCase() === b.toLowerCase();

// Plan which image files (paths relative to images/) must move to which English folder.
// Returns { moves: Map(oldRel -> newRel), groups: [{ from, to, count }] }
function planImageFolderMigration(gamePath) {
  const imagesDir = path.join(gamePath, 'images');
  const moves = new Map();
  const ambiguous = new Set();
  const folderTargets = new Map(); // non-English top folder -> Set of English folders

  for (const cat of IMAGE_CATEGORY_FILES) {
    let text = '';
    try { text = fs.readFileSync(path.join(gamePath, cat.file), 'utf-8'); } catch (e) { continue; }
    let m;
    IMAGE_DECL_RE.lastIndex = 0;
    while ((m = IMAGE_DECL_RE.exec(text)) !== null) {
      const rel = m[1].replace(/\\/g, '/').replace(/^images\//, '');
      if (!IMAGE_FILE_RE.test(rel)) continue;
      const parts = rel.split('/');
      if (parts.length > 1 && sameDirName(parts[0], cat.dir)) continue; // already in its English folder
      if (!fs.existsSync(path.join(imagesDir, rel))) continue;
      const rest = parts.length > 1 ? parts.slice(1).join('/') : parts[0];
      const newRel = `${cat.dir}/${rest}`;
      // The same file declared in two categories: can't decide, leave it
      if (moves.has(rel) && moves.get(rel) !== newRel) { ambiguous.add(rel); continue; }
      moves.set(rel, newRel);
      if (parts.length > 1 && !ENGLISH_IMAGE_DIRS.some(d => sameDirName(d, parts[0]))) {
        if (!folderTargets.has(parts[0])) folderTargets.set(parts[0], new Set());
        folderTargets.get(parts[0]).add(cat.dir);
      }
    }
  }
  ambiguous.forEach(rel => moves.delete(rel));

  // A non-English folder used by a single category moves entirely (also its undeclared files)
  for (const [folder, targets] of folderTargets) {
    if (targets.size !== 1) continue;
    const dir = [...targets][0];
    for (const f of listDirRecursive(path.join(imagesDir, folder), path.join(imagesDir, folder))) {
      if (f.isDir) continue;
      const rel = `${folder}/${f.path}`;
      if (!moves.has(rel) && !ambiguous.has(rel)) moves.set(rel, `${dir}/${f.path}`);
    }
  }

  const groups = new Map();
  for (const [oldRel, newRel] of moves) {
    const from = oldRel.includes('/') ? oldRel.split('/')[0] : '';
    const to = newRel.split('/')[0];
    const key = from + '→' + to;
    if (!groups.has(key)) groups.set(key, { from, to, count: 0 });
    groups.get(key).count++;
  }
  return { moves, groups: [...groups.values()] };
}

// Move the planned files. Returns the paths actually changed and some stats.
function executeImageFolderMigration(gamePath, moves) {
  const imagesDir = path.join(gamePath, 'images');
  const done = new Map();
  const stats = { moved: 0, duplicates: 0, conflicts: 0 };
  const touchedFolders = new Set();
  for (const [oldRel, newRel] of moves) {
    const from = path.join(imagesDir, oldRel), to = path.join(imagesDir, newRel);
    if (!fs.existsSync(from)) continue;
    if (!fs.existsSync(to)) {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      try { fs.renameSync(from, to); } catch (e) { fs.copyFileSync(from, to); fs.unlinkSync(from); }
      stats.moved++;
    } else if (filesAreEqual(from, to)) {
      fs.unlinkSync(from); // already copied in the English folder
      stats.duplicates++;
    } else {
      stats.conflicts++; // a different file with that name exists: leave both untouched
      continue;
    }
    done.set(oldRel, newRel);
    if (oldRel.includes('/')) touchedFolders.add(oldRel.split('/')[0]);
  }
  // Clean up the folders that were emptied (never the English ones)
  for (const folder of touchedFolders) {
    if (ENGLISH_IMAGE_DIRS.some(d => sameDirName(d, folder))) continue;
    try { removeEmptyDirs(path.join(imagesDir, folder)); } catch (e) { /* ignore */ }
  }
  return { done, stats };
}

// Update every quoted path ("x/y.png" or "images/x/y.png") to a moved file in all .rpy files
function rewriteMovedImagePaths(gamePath, done) {
  if (!done.size) return 0;
  let count = 0;
  const re = /(["'])(images\/)?([^"'\n]+?)\1/g;
  for (const fp of listProjectRpyFiles(gamePath)) {
    let text;
    try { text = fs.readFileSync(fp, 'utf-8'); } catch (e) { continue; }
    let changed = false;
    const newText = text.replace(re, (match, q, prefix, p) => {
      const newRel = done.get(p.replace(/\\/g, '/'));
      if (!newRel) return match;
      count++;
      changed = true;
      return `${q}${prefix || ''}${newRel}${q}`;
    });
    if (changed) fs.writeFileSync(fp, newText, 'utf-8');
  }
  return count;
}

// Show a themed dialog (src/dialog.js) in a window and wait for the pressed button.
// Same options and { response } result as Electron's message box.
let appDialogSeq = 0;
function showAppDialog(win, opts) {
  if (!win || win.isDestroyed()) return Promise.resolve({ response: opts.cancelId ?? -1 });
  return new Promise(resolve => {
    const id = ++appDialogSeq;
    const finish = (response) => {
      ipcMain.removeListener('app-dialog-response', onReply);
      win.webContents.removeListener('destroyed', onGone);
      resolve({ response });
    };
    const onReply = (e, replyId, response) => { if (replyId === id) finish(response); };
    const onGone = () => finish(opts.cancelId ?? -1);
    ipcMain.on('app-dialog-response', onReply);
    win.webContents.once('destroyed', onGone);
    win.webContents.send('show-app-dialog', id, opts);
  });
}

// If declared images aren't in their English folder (whatever language their folder is in),
// ask to move them there and update the paths in the .rpy files.
async function offerImageFolderMigration(gamePath) {
  if (!gamePath || declinedMigrations.has(gamePath)) return;
  const { moves, groups } = planImageFolderMigration(gamePath);
  if (!moves.size) return;

  const detail = groups
    .map(g => mt('migration_folder_line', g.from ? `images/${g.from}` : mt('migration_images_root'), `images/${g.to}`, g.count))
    .join('\n');
  const { response } = await showAppDialog(mainWindow, {
    type: 'question',
    buttons: [mt('migration_accept'), mt('migration_later')],
    defaultId: 0,
    cancelId: 1,
    title: mt('migration_title'),
    message: mt('migration_message'),
    detail: detail + '\n\n' + mt('migration_detail_note')
  });
  if (response !== 0) { declinedMigrations.add(gamePath); return; }

  let result, rewritten = 0;
  try {
    result = executeImageFolderMigration(gamePath, moves);
    rewritten = rewriteMovedImagePaths(gamePath, result.done);
  } catch (e) {
    showAppDialog(mainWindow, { type: 'error', title: mt('migration_title'), message: mt('migration_error', e.message) });
    return;
  }
  const { stats } = result;
  showAppDialog(mainWindow, {
    type: stats.conflicts ? 'warning' : 'info',
    title: mt('migration_title'),
    message: mt('migration_done', stats.moved, rewritten),
    detail: [
      stats.duplicates ? mt('migration_duplicates', stats.duplicates) : '',
      stats.conflicts ? mt('migration_conflicts', stats.conflicts) : ''
    ].filter(Boolean).join('\n')
  });
}

// ═════════════════════════════════════════════════════════════════════
// IPC HANDLERS
// ═════════════════════════════════════════════════════════════════════

// ── Select project folder ──
ipcMain.handle('select-project-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar carpeta del proyecto Ren\'Py',
    properties: ['openDirectory'],
    defaultPath: settings.lastProjectPath || undefined
  });
  if (result.canceled || !result.filePaths.length) return null;
  let selectedPath = result.filePaths[0];

  // Try to find game/ subfolder
  const gameSub = path.join(selectedPath, 'game');
  if (fs.existsSync(gameSub) && fs.statSync(gameSub).isDirectory()) {
    selectedPath = gameSub;
  }

  currentGamePath = selectedPath;
  settings.lastProjectPath = path.dirname(selectedPath);
  settings.lastGamePath = selectedPath;
  saveSettings();

  // Move images that aren't in their English folder (asks first), then create missing folders and .rpy files
  await offerImageFolderMigration(currentGamePath);
  ensureProjectStructure(currentGamePath);

  // Start watching for file changes
  startFileWatcher(currentGamePath);

  return currentGamePath;
});

// ── Re-select current project folder (no dialog) ──
ipcMain.handle('reselect-project-folder', async () => {
  let selectedPath = currentGamePath || settings.lastGamePath || '';
  if (!selectedPath || !fs.existsSync(selectedPath)) return null;

  // Keep same normalization logic as manual select: if path has game/ child, use it.
  const gameSub = path.join(selectedPath, 'game');
  if (fs.existsSync(gameSub) && fs.statSync(gameSub).isDirectory()) {
    selectedPath = gameSub;
  }

  currentGamePath = selectedPath;
  settings.lastProjectPath = path.dirname(selectedPath);
  settings.lastGamePath = selectedPath;
  saveSettings();

  ensureProjectStructure(currentGamePath);
  startFileWatcher(currentGamePath);

  // Mimic native dialog focus reset that seems to unblock input state.
  if (mainWindow) {
    mainWindow.blur();
    setTimeout(() => { if (mainWindow) mainWindow.focus(); }, 40);
  }

  return currentGamePath;
});

// ── Read text file ──
ipcMain.handle('read-file', (_, relativePath) => {
  if (!currentGamePath) return null;
  const fp = path.join(currentGamePath, relativePath);
  const resolved = path.resolve(fp);
  if (!resolved.startsWith(path.resolve(currentGamePath))) return null;
  try { return fs.readFileSync(resolved, 'utf-8'); } catch (e) { return null; }
});

// ── Write text file ──
ipcMain.handle('write-file', (_, relativePath, content) => {
  if (!currentGamePath) return false;
  const fp = path.join(currentGamePath, relativePath);
  const resolved = path.resolve(fp);
  if (!resolved.startsWith(path.resolve(currentGamePath))) return false;
  try {
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolved, content, 'utf-8');
    return true;
  } catch (e) { return false; }
});

// ── Check if file exists ──
ipcMain.handle('file-exists', (_, relativePath) => {
  if (!currentGamePath) return false;
  const fp = path.join(currentGamePath, relativePath);
  return fs.existsSync(fp);
});

// ── List .rpy files in the game directory (not recursive) ──
ipcMain.handle('list-rpy-files', () => {
  if (!currentGamePath) return [];
  try {
    return fs.readdirSync(currentGamePath)
      .filter(f => f.endsWith('.rpy') && !f.includes(path.sep))
      .sort();
  } catch (e) { return []; }
});

// ── Create a new empty .rpy file in the game directory ──
ipcMain.handle('create-rpy-file', (_, name) => {
  if (!currentGamePath) return { ok: false, error: 'no-project' };
  const base = (name || '').trim().replace(/\.rpy$/i, '');
  if (!base || !/^[A-Za-z0-9_\- ]+$/.test(base)) return { ok: false, error: 'invalid-name' };
  const file = base + '.rpy';
  const fp = path.join(currentGamePath, file);
  if (fs.existsSync(fp)) return { ok: false, error: 'exists', file };
  try {
    fs.writeFileSync(fp, `# ${file}\n`, 'utf-8');
    return { ok: true, file };
  } catch (e) { return { ok: false, error: 'write-failed', message: e.message }; }
});

// ── List audio files in game/audio/ (recursive, paths relative to game/) ──
ipcMain.handle('list-audio-files', () => {
  if (!currentGamePath) return [];
  const audioDir = path.join(currentGamePath, 'audio');
  return listDirRecursive(audioDir, currentGamePath)
    .filter(f => !f.isDir && /\.(ogg|opus|mp3|wav|flac|m4a)$/i.test(f.name))
    .map(f => f.path)
    .sort((a, b) => a.localeCompare(b));
});

// ── List image files in a subdirectory (relative to images/) or absolute path ──
ipcMain.handle('list-images-in-dir', (_, dirPathOrRel) => {
  let dirPath;
  if (path.isAbsolute(dirPathOrRel)) {
    dirPath = dirPathOrRel;
  } else {
    if (!currentGamePath) return [];
    dirPath = path.join(currentGamePath, 'images', dirPathOrRel);
    const resolved = path.resolve(dirPath);
    if (!resolved.startsWith(path.resolve(currentGamePath))) return [];
  }
  try {
    return fs.readdirSync(dirPath)
      .filter(f => /\.(png|jpe?g|gif|webp|bmp)$/i.test(f));
  } catch (e) { return []; }
});

// ── Open declaration window ──
ipcMain.handle('open-declaration-window', () => {
  createDeclarationWindow();
});

// ═════════════════════════════════════════════════════════════════════
// MAIN MENU EDITOR
// ═════════════════════════════════════════════════════════════════════

// Resolve a path relative to game/ making sure it stays inside the project
function resolveInGame(relativePath) {
  if (!currentGamePath || !relativePath) return null;
  const base = path.resolve(currentGamePath);
  const resolved = path.resolve(base, relativePath);
  if (!resolved.startsWith(base + path.sep)) return null;
  return resolved;
}

const MEDIA_EXTENSIONS = {
  image: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'avif'],
  buttonImage: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'avif'],
  gif: ['gif'],
  video: ['webm', 'ogv', 'mp4', 'mkv', 'avi', 'mpg', 'mpeg'],
  font: ['ttf', 'otf', 'ttc']
};

ipcMain.handle('open-main-menu-window', () => {
  createMainMenuWindow();
});

// ── Pick a media file of the given kind (image, gif, video, font) ──
ipcMain.handle('select-media-file', async (_, kind) => {
  const extensions = MEDIA_EXTENSIONS[kind];
  if (!extensions) return null;
  const result = await dialog.showOpenDialog(mainMenuWindow || mainWindow, {
    title: mt('mm_select_' + kind),
    properties: ['openFile'],
    filters: [{ name: mt('mm_kind_' + kind), extensions }]
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// ── Fonts installed on the computer ──
function systemFontDirs() {
  const home = app.getPath('home');
  if (process.platform === 'win32') {
    return [
      path.join(process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows', 'Fonts'),
      process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Windows', 'Fonts')
    ].filter(Boolean);
  }
  if (process.platform === 'darwin') {
    return ['/System/Library/Fonts', '/Library/Fonts', path.join(home, 'Library', 'Fonts')];
  }
  return ['/usr/share/fonts', '/usr/local/share/fonts', path.join(home, '.fonts'), path.join(home, '.local', 'share', 'fonts')];
}

async function readBytes(fh, position, length) {
  const buf = Buffer.alloc(length);
  const { bytesRead } = await fh.read(buf, 0, length, position);
  return buf.subarray(0, bytesRead);
}

// Licenses that allow distributing the font with a game, recognized from the
// license description and URL of the font (name ids 13 and 14)
const FREE_FONT_LICENSES = [
  { name: 'SIL Open Font License', re: /open\s*font\s*licen[cs]e|\bOFL\b|scripts\.sil\.org\/OFL|openfontlicense\.org/i },
  { name: 'Apache License', re: /apache\s+licen[cs]e|apache\.org\/licenses/i },
  { name: 'MIT License', re: /\bMIT\s+licen[cs]e|opensource\.org\/licenses\/MIT/i },
  { name: 'Ubuntu Font Licence', re: /ubuntu\s+font\s+licen[cs]e/i },
  { name: 'GNU GPL', re: /GNU\s+General\s+Public\s+Licen[cs]e|gnu\.org\/licenses\/gpl/i },
  { name: 'Bitstream Vera License', re: /bitstream\s+vera|DejaVu\s+changes\s+are\s+in\s+public\s+domain/i },
  { name: 'Public domain', re: /public\s+domain|\bCC0\b|creativecommons\.org\/publicdomain/i },
  { name: 'Creative Commons BY', re: /creativecommons\.org\/licenses\/by(-sa)?\/|creative\s+commons\s+attribution/i }
];
// Terms of proprietary licenses: they win even if a free license is mentioned
// (e.g. Microsoft fonts say "Any other use is prohibited" and then quote the MIT
// license of a small component)
const NON_FREE_FONT_TERMS = new RegExp([
  'non-?commercial', 'personal\\s+use', 'creativecommons\\.org/licenses/by(-sa)?-n[cd]',
  'prohibited', 'not\\s+(be\\s+)?(re)?distribut', 'may\\s+only', '\\bEULA\\b', 'end[\\s-]+user\\s+licen[cs]e',
  'contact\\s+the\\s+vendor', 'property\\s+of', 'supplied\\s+font', 'licen[cs]e\\s+restrictions'
].join('|'), 'i');

function freeFontLicense(description, url, fsType) {
  // fsType 0x0002: the font can't even be embedded
  if ((fsType & 0x000F) === 0x0002) return null;
  const text = `${description || ''} ${url || ''}`;
  if (!text.trim() || NON_FREE_FONT_TERMS.test(text)) return null;
  return FREE_FONT_LICENSES.find(l => l.re.test(text))?.name || null;
}

// Family, style, PostScript name and license of a font from its 'name' and 'OS/2' tables
async function readFontNames(fh, fontOffset) {
  const header = await readBytes(fh, fontOffset, 12);
  if (header.length < 12) return null;
  const numTables = header.readUInt16BE(4);
  const dir = await readBytes(fh, fontOffset + 12, numTables * 16);
  let nameOffset = -1, nameLength = 0, os2Offset = -1;
  for (let i = 0; i + 16 <= dir.length; i += 16) {
    const tag = dir.toString('latin1', i, i + 4);
    if (tag === 'name') {
      nameOffset = dir.readUInt32BE(i + 8);
      nameLength = dir.readUInt32BE(i + 12);
    } else if (tag === 'OS/2') os2Offset = dir.readUInt32BE(i + 8);
  }
  if (nameOffset < 0 || !nameLength) return null;
  let fsType = 0;
  if (os2Offset >= 0) {
    const os2 = await readBytes(fh, os2Offset, 10);
    if (os2.length === 10) fsType = os2.readUInt16BE(8);
  }
  const table = await readBytes(fh, nameOffset, Math.min(nameLength, 512 * 1024));
  const count = table.readUInt16BE(2), stringOffset = table.readUInt16BE(4);

  // Best record of each name id: Windows English, then any Windows/Unicode, then Mac Roman
  const best = {};
  for (let i = 0; i < count; i++) {
    const r = 6 + i * 12;
    if (r + 12 > table.length) break;
    const platform = table.readUInt16BE(r), encoding = table.readUInt16BE(r + 2);
    const lang = table.readUInt16BE(r + 4), nameId = table.readUInt16BE(r + 6);
    if (![1, 2, 4, 6, 13, 14, 16, 17].includes(nameId)) continue;
    let score;
    if (platform === 3 && lang === 0x409) score = 3;
    else if (platform === 3 || platform === 0) score = 2;
    else if (platform === 1 && encoding === 0) score = 1;
    else continue;
    if ((best[nameId]?.score || 0) >= score) continue;
    const start = stringOffset + table.readUInt16BE(r + 10);
    const raw = table.subarray(start, start + table.readUInt16BE(r + 8));
    let text;
    if (score === 1) text = raw.toString('latin1');
    else {
      const swapped = Buffer.from(raw);
      if (swapped.length % 2) continue;
      swapped.swap16();
      text = swapped.toString('utf16le');
    }
    best[nameId] = { score, text: text.replace(/\0/g, '').trim() };
  }
  const family = best[16]?.text || best[1]?.text;
  if (!family) return null;
  return {
    family,
    style: best[17]?.text || best[2]?.text || 'Regular',
    fullName: best[4]?.text || family,
    postscript: best[6]?.text || '',
    license: freeFontLicense(best[13]?.text, best[14]?.text, fsType)
  };
}

async function readFontFile(file) {
  let fh;
  try {
    fh = await fs.promises.open(file, 'r');
    const head = await readBytes(fh, 0, 12);
    if (head.length < 12) return [];
    let offsets = [0];
    if (head.toString('latin1', 0, 4) === 'ttcf') {
      const numFonts = Math.min(head.readUInt32BE(8), 64);
      const table = await readBytes(fh, 12, numFonts * 4);
      offsets = [];
      for (let i = 0; i + 4 <= table.length; i += 4) offsets.push(table.readUInt32BE(i));
    }
    const fonts = [];
    for (let index = 0; index < offsets.length; index++) {
      const names = await readFontNames(fh, offsets[index]).catch(() => null);
      if (names) fonts.push({ ...names, file, index: offsets.length > 1 ? index : -1 });
    }
    return fonts;
  } catch (e) {
    return [];
  } finally {
    if (fh) await fh.close();
  }
}

function listFontFiles(dir, depth = 0, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const entry of entries) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory() && depth < 4) listFontFiles(fp, depth + 1, out);
    else if (/\.(ttf|otf|ttc|otc)$/i.test(entry.name)) out.push(fp);
  }
  return out;
}

let systemFontsCache = null;
ipcMain.handle('list-system-fonts', async (_, refresh = false) => {
  if (refresh) systemFontsCache = null;
  if (!systemFontsCache) {
    systemFontsCache = (async () => {
      const files = [...new Set(systemFontDirs().flatMap(d => listFontFiles(d)))];
      const fonts = [];
      const seen = new Set();
      for (let i = 0; i < files.length; i += 32) {
        const batch = await Promise.all(files.slice(i, i + 32).map(readFontFile));
        for (const font of batch.flat()) {
          // Skip hidden system fonts (names starting with a dot) and duplicates
          if (font.family.startsWith('.')) continue;
          const key = (font.family + '|' + font.style).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          fonts.push(font);
        }
      }
      return fonts.sort((a, b) => a.family.localeCompare(b.family) || a.style.localeCompare(b.style));
    })();
  }
  return systemFontsCache;
});

// ── Fonts inside a font file chosen by the user (to check its license) ──
ipcMain.handle('read-font-file-info', (_, file) => readFontFile(file));

ipcMain.handle('open-free-fonts-site', () => shell.openExternal('https://fonts.google.com/'));

// ── Read a binary file (relative to game/) ──
ipcMain.handle('read-binary-file', (_, relativePath) => {
  const resolved = resolveInGame(relativePath);
  if (!resolved) return null;
  try { return new Uint8Array(fs.readFileSync(resolved)); } catch (e) { return null; }
});

// ── Write a binary file (relative to game/) ──
ipcMain.handle('write-binary-file', (_, relativePath, bytes) => {
  const resolved = resolveInGame(relativePath);
  if (!resolved) return false;
  try {
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, Buffer.from(bytes));
    return true;
  } catch (e) { return false; }
});

// ── Delete the files of a folder (relative to game/) whose name starts with prefix, except keep ──
ipcMain.handle('remove-project-files', (_, relativeDir, prefix, keep = []) => {
  const resolved = resolveInGame(relativeDir);
  if (!resolved || !prefix) return 0;
  let count = 0;
  try {
    for (const name of fs.readdirSync(resolved)) {
      if (!name.startsWith(prefix) || keep.includes(name)) continue;
      const fp = path.join(resolved, name);
      if (fs.statSync(fp).isFile()) { fs.unlinkSync(fp); count++; }
    }
  } catch (e) { /* folder doesn't exist */ }
  return count;
});

// ── Get/Set Settings ──
ipcMain.handle('get-settings', () => settings);
ipcMain.handle('save-settings', (_, newSettings) => {
  settings = deepMerge(settings, newSettings);
  saveSettings();
  if (newSettings.spellcheckLanguages) applySpellcheckSettings();
  // Notify all windows of settings change
  if (mainWindow) mainWindow.webContents.send('settings-changed', settings);
  if (declWindow) declWindow.webContents.send('settings-changed', settings);
  if (mainMenuWindow) mainMenuWindow.webContents.send('settings-changed', settings);
  return true;
});

// ── Spellcheck languages that can be enabled in the settings panel ──
ipcMain.handle('get-spellcheck-languages', () => {
  const available = session.defaultSession.availableSpellCheckerLanguages;
  return SPELLCHECK_LANGUAGES.filter(l => available.includes(l));
});

// ── Get game path ──
ipcMain.handle('get-game-path', () => currentGamePath);

// ── Load last project (auto-load on startup) ──
ipcMain.handle('load-last-project', async () => {
  if (!settings.lastGamePath) return null;
  if (!fs.existsSync(settings.lastGamePath)) {
    settings.lastGamePath = '';
    saveSettings();
    return null;
  }
  currentGamePath = settings.lastGamePath;
  await offerImageFolderMigration(currentGamePath);
  ensureProjectStructure(currentGamePath);
  startFileWatcher(currentGamePath);
  return currentGamePath;
});

// ── Reload current project (same flow as opening a project, without dialog) ──
ipcMain.handle('reload-current-project', () => {
  const basePath = currentGamePath || settings.lastGamePath;
  if (!basePath) return null;
  if (!fs.existsSync(basePath)) return null;

  currentGamePath = basePath;
  settings.lastProjectPath = path.dirname(basePath);
  settings.lastGamePath = basePath;
  saveSettings();

  ensureProjectStructure(currentGamePath);
  startFileWatcher(currentGamePath);
  if (mainWindow) mainWindow.focus();

  return currentGamePath;
});

// ── Notify main window to reload project data ──
ipcMain.handle('reload-project-data', () => {
  if (mainWindow) mainWindow.webContents.send('reload-data');
  return true;
});

// ── Launch Ren'Py project from editor ──
ipcMain.handle('launch-renpy-project', async () => {
  if (!currentGamePath) {
    return { ok: false, error: 'no-project' };
  }

  const renpyExecutable = await ensureRenpyExecutablePath();
  if (!renpyExecutable) {
    return { ok: false, error: 'cancelled' };
  }

  if (!fs.existsSync(renpyExecutable)) {
    settings.renpyExecutablePath = '';
    saveSettings();
    return { ok: false, error: 'invalid-executable' };
  }

  const projectRoot = getProjectRootFromGamePath(currentGamePath);
  if (!projectRoot || !fs.existsSync(projectRoot)) {
    return { ok: false, error: 'invalid-project' };
  }

  try {
    const child = spawn(renpyExecutable, [projectRoot], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'launch-failed', message: e.message };
  }
});

// ── Select images for import (declaration window) ──
ipcMain.handle('select-image-files', async () => {
  const result = await dialog.showOpenDialog(declWindow || mainWindow, {
    title: 'Seleccionar imágenes',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }]
  });
  if (result.canceled) return [];
  return result.filePaths;
});

// ── Select folder for batch import ──
ipcMain.handle('select-image-folder', async () => {
  const result = await dialog.showOpenDialog(declWindow || mainWindow, {
    title: 'Seleccionar carpeta de imágenes',
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// ── Copy image file to game/ (destRelPath is relative to game dir) ──
ipcMain.handle('copy-image-to-project', (_, srcPath, destRelPath) => {
  if (!currentGamePath) return false;
  const dest = path.join(currentGamePath, destRelPath);
  const resolved = path.resolve(dest);
  if (!resolved.startsWith(path.resolve(currentGamePath))) return false;
  try {
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(srcPath, resolved);
    return true;
  } catch (e) { return false; }
});

// ── Delete image file ──
ipcMain.handle('delete-image', (_, relativePath) => {
  if (!currentGamePath) return false;
  const resolved = path.resolve(path.join(currentGamePath, 'images', relativePath));
  if (!resolved.startsWith(path.resolve(currentGamePath))) return false;
  try {
    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
    return true;
  } catch (e) { return false; }
});

// ── Read i18n file ──
ipcMain.handle('read-i18n', (_, lang) => {
  const fp = path.join(__dirname, 'src', 'i18n', lang + '.json');
  try { return fs.readFileSync(fp, 'utf-8'); } catch (e) { return '{}'; }
});

// ── List subdirectories in images/characters/ ──
ipcMain.handle('list-character-dirs', () => {
  if (!currentGamePath) return [];
  const baseDir = path.join(currentGamePath, 'images', 'characters');
  try {
    return fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const subDirs = fs.readdirSync(path.join(baseDir, d.name), { withFileTypes: true })
          .filter(sd => sd.isDirectory())
          .map(sd => sd.name);
        return { name: d.name, subDirs };
      });
  } catch (e) { return []; }
});

// ═════════════════════════════════════════════════════════════════════
// NEW REN'PY PROJECT
// ═════════════════════════════════════════════════════════════════════

// Ask where the projects folder is (or where to create it) and save it in settings
async function chooseProjectsDirectory() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar la carpeta de proyectos de Ren\'Py',
    properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    defaultPath: settings.projectsDirectory || undefined
  });
  if (result.canceled || !result.filePaths.length) return null;
  const dir = result.filePaths[0];
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) { return null; }
  settings.projectsDirectory = dir;
  saveSettings();
  return dir;
}

// ── Always asks for the projects folder (settings panel) ──
ipcMain.handle('select-projects-directory', () => chooseProjectsDirectory());

// ── Returns the projects folder, asking for it only if it isn't set or doesn't exist ──
ipcMain.handle('ensure-projects-directory', async () => {
  const dir = settings.projectsDirectory;
  if (dir && fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
  return chooseProjectsDirectory();
});

// Run a process and resolve with its exit code and error output
function runProcess(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    let child;
    let stderr = '';
    try {
      child = spawn(cmd, args, { windowsHide: true, ...opts });
    } catch (e) {
      resolve({ code: -1, error: e.message });
      return;
    }
    const timer = setTimeout(() => child.kill(), opts.timeout || 5 * 60 * 1000);
    if (child.stdout) child.stdout.on('data', () => {});
    if (child.stderr) child.stderr.on('data', d => { stderr += d; });
    child.on('error', e => { clearTimeout(timer); resolve({ code: -1, error: e.message }); });
    child.on('close', code => { clearTimeout(timer); resolve({ code, error: stderr.trim() }); });
  });
}

function sendProjectProgress(step) {
  if (mainWindow) mainWindow.webContents.send('project-creation-progress', step);
}

// ── Create a new project the same way the Ren'Py launcher does, then add the editor files ──
// opts: { name, width, height, accent, boring, light }
ipcMain.handle('create-renpy-project', async (_, opts) => {
  const name = (opts?.name || '').trim();
  // Same characters the launcher accepts for project names
  if (!name || !/^[A-Za-z0-9 _]+$/.test(name)) return { ok: false, error: 'invalid-name' };

  const projectsDir = settings.projectsDirectory;
  if (!projectsDir || !fs.existsSync(projectsDir)) return { ok: false, error: 'no-projects-dir' };

  const projectDir = path.join(projectsDir, name);
  if (fs.existsSync(projectDir)) return { ok: false, error: 'project-exists', path: projectDir };

  const width = parseInt(opts.width, 10), height = parseInt(opts.height, 10);
  if (!(width > 0 && height > 0)) return { ok: false, error: 'invalid-size' };
  const colorRe = /^#[0-9a-fA-F]{6}$/;
  const accent = colorRe.test(opts.accent) ? opts.accent : '#0099cc';
  const boring = colorRe.test(opts.boring) ? opts.boring : '#000000';

  const renpyExecutable = await ensureRenpyExecutablePath();
  if (!renpyExecutable) return { ok: false, error: 'cancelled' };
  const sdkDir = path.dirname(renpyExecutable);
  const launcherDir = path.join(sdkDir, 'launcher');
  const templateDir = path.join(sdkDir, 'gui');
  if (!fs.existsSync(launcherDir) || !fs.existsSync(path.join(templateDir, 'game'))) {
    return { ok: false, error: 'invalid-sdk', path: sdkDir };
  }

  // 1. Generate the project with the launcher's generate_gui command
  sendProjectProgress('generating');
  const genArgs = [
    launcherDir, 'generate_gui', projectDir,
    '--start',
    '--width', String(width),
    '--height', String(height),
    '--accent', accent,
    '--boring', boring,
    '--template', templateDir
  ];
  if (opts.light) genArgs.push('--light');
  const gen = await runProcess(renpyExecutable, genArgs, { cwd: sdkDir });
  const gamePath = path.join(projectDir, 'game');
  if (gen.code !== 0 || !fs.existsSync(path.join(gamePath, 'options.rpy'))) {
    return { ok: false, error: 'generate-failed', message: gen.error || `exit code ${gen.code}` };
  }

  // 2. Generate the gui images, as the launcher does after creating a project
  sendProjectProgress('images');
  await runProcess(renpyExecutable, [projectDir, 'gui_images'], {
    cwd: sdkDir, env: { ...process.env, RENPY_VARIANT: 'small phone' }
  });
  await runProcess(renpyExecutable, [projectDir, 'gui_images'], { cwd: sdkDir });

  // 3. Add the files and folders used by this editor and open the project
  sendProjectProgress('editor-files');
  ensureProjectStructure(gamePath);

  currentGamePath = gamePath;
  settings.lastProjectPath = projectDir;
  settings.lastGamePath = gamePath;
  saveSettings();
  startFileWatcher(currentGamePath);

  return { ok: true, gamePath, projectDir };
});

// ═════════════════════════════════════════════════════════════════════
// REN'PY SDK: DETECTION AND AUTOMATIC INSTALLATION
// ═════════════════════════════════════════════════════════════════════
const RENPY_WEBSITE = 'https://www.renpy.org/latest.html';
const RENPY_DL_BASE = 'https://www.renpy.org/dl';
const RENPY_FALLBACK_VERSION = '8.5.3';
const RENPY_EXE_NAME = process.platform === 'win32' ? 'renpy.exe' : 'renpy.sh';
let renpyInstallAbort = null;

// Node's fetch (streams + AbortSignal); Electron's net.fetch as fallback
function httpFetch(url, opts) {
  return typeof fetch === 'function' ? fetch(url, opts) : net.fetch(url, opts);
}

function isValidRenpyExecutable(p) {
  try { return !!p && fs.existsSync(p) && fs.statSync(p).isFile(); } catch (e) { return false; }
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

// Look for "renpy-<version>-sdk" folders in the usual places; returns the newest executable
function findInstalledRenpy() {
  const home = app.getPath('home');
  const roots = [
    settings.renpyInstallDir,
    home,
    path.join(home, 'Documents'),
    path.join(home, 'Downloads'),
    path.join(home, 'Desktop'),
    path.join(home, 'RenPy'),
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
    process.env.LOCALAPPDATA
  ];
  if (process.platform === 'win32') {
    for (const letter of 'CDEFGHIJ') roots.push(letter + ':\\');
  }
  const found = [];
  for (const root of [...new Set(roots.filter(Boolean))]) {
    let entries = [];
    try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch (e) { continue; }
    for (const entry of entries) {
      const m = /^renpy-(\d+(?:\.\d+)*)-sdk$/i.exec(entry.name);
      if (!m || !entry.isDirectory()) continue;
      const exe = path.join(root, entry.name, RENPY_EXE_NAME);
      if (isValidRenpyExecutable(exe)) found.push({ version: m[1], exe });
    }
  }
  found.sort((a, b) => compareVersions(b.version, a.version));
  return found[0]?.exe || null;
}

// ── Is Ren'Py available? Uses the saved path or searches the usual folders ──
ipcMain.handle('check-renpy', () => {
  if (isValidRenpyExecutable(settings.renpyExecutablePath)) {
    return { installed: true, path: settings.renpyExecutablePath };
  }
  const exe = findInstalledRenpy();
  if (exe) {
    settings.renpyExecutablePath = exe;
    saveSettings();
    return { installed: true, path: exe, detected: true };
  }
  return { installed: false };
});

ipcMain.handle('open-renpy-website', () => shell.openExternal(RENPY_WEBSITE));

// ── Let the user pick renpy.exe manually ──
ipcMain.handle('select-renpy-executable', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: mt('renpy_select_exe_title'),
    properties: ['openFile'],
    filters: process.platform === 'win32'
      ? [{ name: 'renpy.exe', extensions: ['exe'] }, { name: '*', extensions: ['*'] }]
      : [{ name: '*', extensions: ['*'] }]
  });
  if (result.canceled || !result.filePaths.length) return null;
  settings.renpyExecutablePath = result.filePaths[0];
  saveSettings();
  return settings.renpyExecutablePath;
});

function sendRenpyProgress(data) {
  if (mainWindow) mainWindow.webContents.send('renpy-install-progress', data);
}

// Latest version from the Ren'Py website (falls back to a known version)
async function resolveLatestRenpyVersion(signal) {
  try {
    const res = await httpFetch(RENPY_WEBSITE, { signal });
    const html = await res.text();
    const m = /\/dl\/(\d+(?:\.\d+)+)\/renpy-\1-sdk\.zip/.exec(html);
    if (m) return m[1];
  } catch (e) {
    if (signal.aborted) throw e;
  }
  return RENPY_FALLBACK_VERSION;
}

// Expected hash of the zip from checksums.txt (sha256 preferred), or null
async function fetchRenpyChecksum(version, fileName, signal) {
  try {
    const res = await httpFetch(`${RENPY_DL_BASE}/${version}/checksums.txt`, { signal });
    if (!res.ok) return null;
    const text = await res.text();
    const hashes = {};
    let section = '';
    for (const line of text.split('\n')) {
      const sec = /^#\s*(\w+)/.exec(line);
      if (sec) { section = sec[1].toLowerCase(); continue; }
      const m = /^([0-9a-f]+)\s+(\S+)$/i.exec(line.trim());
      if (m && m[2] === fileName) hashes[section] = m[1].toLowerCase();
    }
    for (const algo of ['sha256', 'sha1', 'md5']) if (hashes[algo]) return { algo, hash: hashes[algo] };
  } catch (e) {
    if (signal.aborted) throw e;
  }
  return null;
}

// Download url to dest reporting progress; returns the hex digest with algo (if given)
async function downloadFile(url, dest, algo, signal) {
  const res = await httpFetch(url, { signal });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const total = parseInt(res.headers.get('content-length') || '0', 10);
  const hash = algo ? crypto.createHash(algo) : null;
  const out = fs.createWriteStream(dest);
  let received = 0, lastSent = 0;
  try {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (hash) hash.update(value);
      if (!out.write(value)) await new Promise(r => out.once('drain', r));
      const now = Date.now();
      if (now - lastSent > 150) { lastSent = now; sendRenpyProgress({ phase: 'download', received, total }); }
    }
  } finally {
    await new Promise(r => out.end(r));
  }
  sendRenpyProgress({ phase: 'download', received, total: total || received });
  return hash ? hash.digest('hex') : null;
}

async function extractZip(zipPath, destDir) {
  if (process.platform === 'win32') {
    // bsdtar shipped with Windows 10+ extracts zip files; PowerShell as fallback
    const tarExe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
    if (fs.existsSync(tarExe)) {
      const r = await runProcess(tarExe, ['-xf', zipPath, '-C', destDir], { timeout: 30 * 60 * 1000 });
      if (r.code === 0) return;
    }
    const ps = await runProcess('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`
    ], { timeout: 30 * 60 * 1000 });
    if (ps.code !== 0) throw new Error(ps.error || 'Expand-Archive failed');
  } else {
    const r = await runProcess('unzip', ['-q', '-o', zipPath, '-d', destDir], { timeout: 30 * 60 * 1000 });
    if (r.code !== 0) throw new Error(r.error || 'unzip failed');
  }
}

// ── Download the latest Ren'Py SDK and install it in a folder chosen by the user ──
ipcMain.handle('install-renpy', async () => {
  const pick = await dialog.showOpenDialog(mainWindow, {
    title: mt('renpy_install_folder_title'),
    buttonLabel: mt('renpy_install_folder_button'),
    properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    defaultPath: settings.renpyInstallDir || app.getPath('home')
  });
  if (pick.canceled || !pick.filePaths.length) return { ok: false, error: 'cancelled' };
  const installDir = pick.filePaths[0];

  const controller = new AbortController();
  renpyInstallAbort = controller;
  const { signal } = controller;
  let zipPath = '';
  try {
    fs.mkdirSync(installDir, { recursive: true });
    sendRenpyProgress({ phase: 'resolve' });
    const version = await resolveLatestRenpyVersion(signal);
    const sdkName = `renpy-${version}-sdk`;
    const exe = path.join(installDir, sdkName, RENPY_EXE_NAME);

    if (!isValidRenpyExecutable(exe)) {
      const fileName = `${sdkName}.zip`;
      const checksum = await fetchRenpyChecksum(version, fileName, signal);
      zipPath = path.join(app.getPath('temp'), `renpy-editor-${Date.now()}-${fileName}`);
      sendRenpyProgress({ phase: 'download', received: 0, total: 0, version });
      const digest = await downloadFile(`${RENPY_DL_BASE}/${version}/${fileName}`, zipPath, checksum?.algo, signal);
      if (checksum && digest !== checksum.hash) throw new Error(mt('renpy_checksum_error'));

      sendRenpyProgress({ phase: 'extract' });
      await extractZip(zipPath, installDir);
      if (process.platform !== 'win32') { try { fs.chmodSync(exe, 0o755); } catch (e) { /* ignore */ } }
      if (!isValidRenpyExecutable(exe)) throw new Error(mt('renpy_exe_not_found', exe));
    }

    settings.renpyExecutablePath = exe;
    settings.renpyInstallDir = installDir;
    saveSettings();
    sendRenpyProgress({ phase: 'done' });
    return { ok: true, path: exe, version };
  } catch (e) {
    if (signal.aborted) return { ok: false, error: 'aborted' };
    return { ok: false, error: 'failed', message: e.message };
  } finally {
    renpyInstallAbort = null;
    if (zipPath) { try { fs.unlinkSync(zipPath); } catch (e) { /* ignore */ } }
  }
});

ipcMain.handle('cancel-renpy-install', () => {
  if (renpyInstallAbort) renpyInstallAbort.abort();
  return true;
});
