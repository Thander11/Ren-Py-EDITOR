const { app, BrowserWindow, ipcMain, dialog, protocol, net, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
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
// LEGACY (SPANISH) IMAGE FOLDERS → ENGLISH FOLDERS
// ═════════════════════════════════════════════════════════════════════
const LEGACY_IMAGE_DIRS = {
  personajes: 'characters',
  fondos: 'backgrounds',
  escenas: 'scenes',
  expresiones: 'expressions'
};
// "personajes/..." or "images/personajes/..." inside a quoted string
const LEGACY_PATH_RE = /(["'])((?:images\/)?)(personajes|fondos|escenas|expresiones)\/([^"'\n]*)\1/g;
const declinedMigrations = new Set();

function countFiles(dir) {
  return listDirRecursive(dir, dir).filter(f => !f.isDir).length;
}

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

// Move every file from src to dst keeping subfolders. Files already present in dst
// are deleted from src when identical, and left in place when different.
function moveDirContents(src, dst, stats) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name), to = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      moveDirContents(from, to, stats);
    } else if (!fs.existsSync(to)) {
      fs.mkdirSync(dst, { recursive: true });
      try { fs.renameSync(from, to); } catch (e) { fs.copyFileSync(from, to); fs.unlinkSync(from); }
      stats.moved++;
    } else if (filesAreEqual(from, to)) {
      fs.unlinkSync(from);
      stats.duplicates++;
    } else {
      stats.conflicts++;
    }
  }
}

function listProjectRpyFiles(gamePath) {
  return listDirRecursive(gamePath, gamePath)
    .filter(f => !f.isDir && f.name.endsWith('.rpy'))
    .map(f => path.join(gamePath, f.path));
}

// Rewrite legacy paths in the .rpy files when the file exists in the English folder
function rewriteLegacyImagePaths(gamePath, apply) {
  let count = 0;
  for (const fp of listProjectRpyFiles(gamePath)) {
    let text;
    try { text = fs.readFileSync(fp, 'utf-8'); } catch (e) { continue; }
    let changed = false;
    const newText = text.replace(LEGACY_PATH_RE, (match, q, prefix, legacy, rest) => {
      const target = path.join(gamePath, 'images', LEGACY_IMAGE_DIRS[legacy], rest);
      if (!fs.existsSync(target)) return match;
      // A different file with the same name was left in the legacy folder: keep pointing to it
      const legacyFile = path.join(gamePath, 'images', legacy, rest);
      if (fs.existsSync(legacyFile) && !filesAreEqual(legacyFile, target)) return match;
      count++;
      changed = true;
      return `${q}${prefix}${LEGACY_IMAGE_DIRS[legacy]}/${rest}${q}`;
    });
    if (apply && changed) fs.writeFileSync(fp, newText, 'utf-8');
  }
  return count;
}

// Count legacy path references in the .rpy files (whether or not the target exists)
function countLegacyReferences(gamePath) {
  let count = 0;
  for (const fp of listProjectRpyFiles(gamePath)) {
    try { count += (fs.readFileSync(fp, 'utf-8').match(LEGACY_PATH_RE) || []).length; } catch (e) { /* skip */ }
  }
  return count;
}

// If the project still uses the Spanish image folders, ask to move their files to the
// English ones and update the paths in the .rpy files.
async function offerLegacyFolderMigration(gamePath) {
  if (!gamePath || declinedMigrations.has(gamePath)) return;
  const imagesDir = path.join(gamePath, 'images');
  const legacyDirs = Object.keys(LEGACY_IMAGE_DIRS)
    .map(name => ({ name, dir: path.join(imagesDir, name) }))
    .filter(d => fs.existsSync(d.dir) && fs.statSync(d.dir).isDirectory());
  const withFiles = legacyDirs.map(d => ({ ...d, files: countFiles(d.dir) })).filter(d => d.files > 0);
  const refs = countLegacyReferences(gamePath);

  if (!withFiles.length && !refs) {
    // Only empty legacy folders left: remove them
    legacyDirs.forEach(d => { try { removeEmptyDirs(d.dir); } catch (e) { /* ignore */ } });
    return;
  }

  const detail = [
    ...withFiles.map(d => mt('migration_folder_line', `images/${d.name}`, `images/${LEGACY_IMAGE_DIRS[d.name]}`, d.files)),
    refs ? mt('migration_refs_line', refs) : ''
  ].filter(Boolean).join('\n');

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

  const stats = { moved: 0, duplicates: 0, conflicts: 0 };
  let rewritten = 0;
  try {
    for (const d of legacyDirs) {
      moveDirContents(d.dir, path.join(imagesDir, LEGACY_IMAGE_DIRS[d.name]), stats);
      removeEmptyDirs(d.dir);
    }
    rewritten = rewriteLegacyImagePaths(gamePath, true);
  } catch (e) {
    dialog.showMessageBox(mainWindow, { type: 'error', title: mt('migration_title'), message: mt('migration_error', e.message) });
    return;
  }
  const remaining = countLegacyReferences(gamePath);
  dialog.showMessageBox(mainWindow, {
    type: stats.conflicts || remaining ? 'warning' : 'info',
    title: mt('migration_title'),
    message: mt('migration_done', stats.moved, rewritten),
    detail: [
      stats.duplicates ? mt('migration_duplicates', stats.duplicates) : '',
      stats.conflicts ? mt('migration_conflicts', stats.conflicts) : '',
      remaining ? mt('migration_remaining', remaining) : ''
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

  // Move legacy Spanish image folders (asks first), then create missing folders and .rpy files
  await offerLegacyFolderMigration(currentGamePath);
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
  await offerLegacyFolderMigration(currentGamePath);
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
