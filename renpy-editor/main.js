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

// ── Auto-create default .rpy files if missing ──
function autoCreateRpyFiles(gamePath) {
  const defaults = {
    'personajes.rpy': '# Personajes\n',
    'fondos.rpy': '# Fondos\n',
    'expresiones.rpy': '# Expresiones\n',
    'Animaciones.rpy': `# Animaciones

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
    'positions.rpy': `# Posiciones
define center_left = Position(xalign=0.3, yalign=1.0)
define center_right = Position(xalign=0.7, yalign=1.0)

transform xflip:
    xzoom -1
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

  // Auto-create missing .rpy files
  autoCreateRpyFiles(currentGamePath);

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

  autoCreateRpyFiles(currentGamePath);
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

// ── List audio files ──
ipcMain.handle('list-audio-files', () => {
  if (!currentGamePath) return [];
  const audioFiles = [];
  // images/audio/
  const imgAudio = path.join(currentGamePath, 'images', 'audio');
  try { audioFiles.push(...fs.readdirSync(imgAudio).filter(f => !fs.statSync(path.join(imgAudio, f)).isDirectory())); } catch (e) {}
  // audio/
  const audioDir = path.join(currentGamePath, 'audio');
  try { audioFiles.push(...fs.readdirSync(audioDir).filter(f => !fs.statSync(path.join(audioDir, f)).isDirectory())); } catch (e) {}
  return audioFiles;
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
ipcMain.handle('load-last-project', () => {
  if (!settings.lastGamePath) return null;
  if (!fs.existsSync(settings.lastGamePath)) {
    settings.lastGamePath = '';
    saveSettings();
    return null;
  }
  currentGamePath = settings.lastGamePath;
  autoCreateRpyFiles(currentGamePath);
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

  autoCreateRpyFiles(currentGamePath);
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

// ── List subdirectories in images/personajes/ ──
ipcMain.handle('list-character-dirs', () => {
  if (!currentGamePath) return [];
  const baseDir = path.join(currentGamePath, 'images', 'personajes');
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
