const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Project
  selectProjectFolder: () => ipcRenderer.invoke('select-project-folder'),
  reselectProjectFolder: () => ipcRenderer.invoke('reselect-project-folder'),
  loadLastProject: () => ipcRenderer.invoke('load-last-project'),
  reloadCurrentProject: () => ipcRenderer.invoke('reload-current-project'),
  launchRenpyProject: () => ipcRenderer.invoke('launch-renpy-project'),
  checkRenpy: () => ipcRenderer.invoke('check-renpy'),
  openRenpyWebsite: () => ipcRenderer.invoke('open-renpy-website'),
  selectRenpyExecutable: () => ipcRenderer.invoke('select-renpy-executable'),
  installRenpy: () => ipcRenderer.invoke('install-renpy'),
  cancelRenpyInstall: () => ipcRenderer.invoke('cancel-renpy-install'),
  selectProjectsDirectory: () => ipcRenderer.invoke('select-projects-directory'),
  ensureProjectsDirectory: () => ipcRenderer.invoke('ensure-projects-directory'),
  createRenpyProject: (opts) => ipcRenderer.invoke('create-renpy-project', opts),
  readFile: (relativePath) => ipcRenderer.invoke('read-file', relativePath),
  writeFile: (relativePath, content) => ipcRenderer.invoke('write-file', relativePath, content),
  fileExists: (relativePath) => ipcRenderer.invoke('file-exists', relativePath),
  listRpyFiles: () => ipcRenderer.invoke('list-rpy-files'),
  createRpyFile: (name) => ipcRenderer.invoke('create-rpy-file', name),
  listAudioFiles: () => ipcRenderer.invoke('list-audio-files'),
  listImagesInDir: (relDir) => ipcRenderer.invoke('list-images-in-dir', relDir),
  getGamePath: () => ipcRenderer.invoke('get-game-path'),

  // Game settings: name, version and icons
  getGameInfo: () => ipcRenderer.invoke('get-game-info'),
  saveGameInfo: (info) => ipcRenderer.invoke('save-game-info', info),
  selectGameIcon: () => ipcRenderer.invoke('select-game-icon'),
  setGameIcon: (srcPath) => ipcRenderer.invoke('set-game-icon', srcPath),

  // Patch: content kept out of the game and packed apart
  patchGet: () => ipcRenderer.invoke('patch-get'),
  patchSave: (cfg) => ipcRenderer.invoke('patch-save', cfg),
  patchMoveImage: (name, toPatch) => ipcRenderer.invoke('patch-move-image', name, toPatch),
  patchWriteOwner: (owner, code) => ipcRenderer.invoke('patch-write-owner', owner, code),

  // Build the game with Ren'Py
  getBuildDefaults: () => ipcRenderer.invoke('get-build-defaults'),
  selectBuildFolder: (current) => ipcRenderer.invoke('select-build-folder', current),
  openFolder: (folder) => ipcRenderer.invoke('open-folder', folder),
  buildGame: (opts) => ipcRenderer.invoke('build-game', opts),
  cancelBuild: () => ipcRenderer.invoke('cancel-build'),
  onBuildProgress: (cb) => ipcRenderer.on('build-progress', (_, msg) => cb(msg)),

  // Declaration window
  openDeclarationWindow: () => ipcRenderer.invoke('open-declaration-window'),

  // Closing the app: the page checks the embedded editors for unsaved changes first
  onConfirmClose: (cb) => ipcRenderer.on('confirm-close', () => cb()),
  closeConfirmed: () => ipcRenderer.invoke('close-confirmed'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  getSpellcheckLanguages: () => ipcRenderer.invoke('get-spellcheck-languages'),

  // Connection with the user's own Claude (MCP server)
  claudeGetStatus: () => ipcRenderer.invoke('claude-get-status'),
  claudeSetEnabled: (enabled) => ipcRenderer.invoke('claude-set-enabled', enabled),
  claudeNewToken: () => ipcRenderer.invoke('claude-new-token'),
  claudeSetPort: (port) => ipcRenderer.invoke('claude-set-port', port),
  onClaudeStatus: (cb) => ipcRenderer.on('claude-status', (_, s) => cb(s)),
  claudeListChanges: () => ipcRenderer.invoke('claude-list-changes'),
  claudeDesktopStatus: () => ipcRenderer.invoke('claude-desktop-status'),
  claudeDesktopAdd: () => ipcRenderer.invoke('claude-desktop-add'),
  claudeUndoChange: (id, force) => ipcRenderer.invoke('claude-undo-change', id, force),
  onClaudeChange: (cb) => ipcRenderer.on('claude-change', (_, entry) => cb(entry)),
  // Claude asks the editor something: cb(tool, args) resolves with the answer
  onMcpCall: (cb) => ipcRenderer.on('mcp-call', async (_, id, tool, args) => {
    try { ipcRenderer.send('mcp-result', id, true, await cb(tool, args)); }
    catch (e) { ipcRenderer.send('mcp-result', id, false, String(e && e.message || e)); }
  }),

  // i18n
  readI18n: (lang) => ipcRenderer.invoke('read-i18n', lang),

  // Events from main process
  onReloadData: (cb) => ipcRenderer.on('reload-data', cb),
  onSettingsChanged: (cb) => ipcRenderer.on('settings-changed', (_, s) => cb(s)),
  onFileChanged: (cb) => ipcRenderer.on('file-changed', (_, filename) => cb(filename)),
  onProjectCreationProgress: (cb) => ipcRenderer.on('project-creation-progress', (_, step) => cb(step)),
  onRenpyInstallProgress: (cb) => ipcRenderer.on('renpy-install-progress', (_, data) => cb(data)),
  // Themed dialogs requested by the main process: cb(opts) resolves with the pressed button index
  onShowAppDialog: (cb) => ipcRenderer.on('show-app-dialog', async (_, id, opts) => {
    ipcRenderer.send('app-dialog-response', id, await cb(opts));
  }),
});
