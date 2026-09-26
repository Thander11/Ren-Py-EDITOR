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

  // Declaration window
  openDeclarationWindow: () => ipcRenderer.invoke('open-declaration-window'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),

  // i18n
  readI18n: (lang) => ipcRenderer.invoke('read-i18n', lang),

  // Events from main process
  onReloadData: (cb) => ipcRenderer.on('reload-data', cb),
  onSettingsChanged: (cb) => ipcRenderer.on('settings-changed', (_, s) => cb(s)),
  onFileChanged: (cb) => ipcRenderer.on('file-changed', (_, filename) => cb(filename)),
  onProjectCreationProgress: (cb) => ipcRenderer.on('project-creation-progress', (_, step) => cb(step)),
  onRenpyInstallProgress: (cb) => ipcRenderer.on('renpy-install-progress', (_, data) => cb(data)),
});
