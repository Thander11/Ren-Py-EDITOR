const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Project
  selectProjectFolder: () => ipcRenderer.invoke('select-project-folder'),
  reselectProjectFolder: () => ipcRenderer.invoke('reselect-project-folder'),
  loadLastProject: () => ipcRenderer.invoke('load-last-project'),
  reloadCurrentProject: () => ipcRenderer.invoke('reload-current-project'),
  launchRenpyProject: () => ipcRenderer.invoke('launch-renpy-project'),
  readFile: (relativePath) => ipcRenderer.invoke('read-file', relativePath),
  writeFile: (relativePath, content) => ipcRenderer.invoke('write-file', relativePath, content),
  fileExists: (relativePath) => ipcRenderer.invoke('file-exists', relativePath),
  listRpyFiles: () => ipcRenderer.invoke('list-rpy-files'),
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
});
