const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('guiApi', {
  readFile: (relativePath) => ipcRenderer.invoke('read-file', relativePath),
  writeFile: (relativePath, content) => ipcRenderer.invoke('write-file', relativePath, content),
  fileExists: (relativePath) => ipcRenderer.invoke('file-exists', relativePath),
  readBinaryFile: (relativePath) => ipcRenderer.invoke('read-binary-file', relativePath),
  writeBinaryFile: (relativePath, bytes) => ipcRenderer.invoke('write-binary-file', relativePath, bytes),
  copyFileToProject: (src, dest) => ipcRenderer.invoke('copy-image-to-project', src, dest),
  selectMediaFile: (kind) => ipcRenderer.invoke('select-media-file', kind),
  listProjectFonts: () => ipcRenderer.invoke('list-project-fonts'),
  launchRenpyProject: () => ipcRenderer.invoke('launch-renpy-project'),
  getGamePath: () => ipcRenderer.invoke('get-game-path'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  readI18n: (lang) => ipcRenderer.invoke('read-i18n', lang),
  onSettingsChanged: (cb) => ipcRenderer.on('settings-changed', (_, s) => cb(s)),
});
