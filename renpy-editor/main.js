const { app, BrowserWindow, ipcMain, dialog, protocol, net, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const url = require('url');
const { spawn } = require('child_process');

let mainWindow = null;
let declWindow = null;
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
  declWindow.on('closed', () => { declWindow = null; });
}

// Folders (relative to game/) that the editor reads from and writes to
const PROJECT_FOLDERS = [
  'audio',
  path.join('images', 'characters'),
  path.join('images', 'backgrounds'),
  path.join('images', 'scenes'),
  path.join('images', 'expressions')
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

// If declared images aren't in their English folder (whatever language their folder is in),
// ask to move them there and update the paths in the .rpy files.
async function offerImageFolderMigration(gamePath) {
  if (!gamePath || declinedMigrations.has(gamePath)) return;
  const { moves, groups } = planImageFolderMigration(gamePath);
  if (!moves.size) return;

  const detail = groups
    .map(g => mt('migration_folder_line', g.from ? `images/${g.from}` : mt('migration_images_root'), `images/${g.to}`, g.count))
    .join('\n');
  const { response } = await dialog.showMessageBox(mainWindow, {
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
    dialog.showMessageBox(mainWindow, { type: 'error', title: mt('migration_title'), message: mt('migration_error', e.message) });
    return;
  }
  const { stats } = result;
  dialog.showMessageBox(mainWindow, {
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

// ── Get/Set Settings ──
ipcMain.handle('get-settings', () => settings);
ipcMain.handle('save-settings', (_, newSettings) => {
  settings = deepMerge(settings, newSettings);
  saveSettings();
  // Notify all windows of settings change
  if (mainWindow) mainWindow.webContents.send('settings-changed', settings);
  if (declWindow) declWindow.webContents.send('settings-changed', settings);
  return true;
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
