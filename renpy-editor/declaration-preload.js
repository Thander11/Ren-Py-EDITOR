const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('declApi', {
  readFile: (relativePath) => ipcRenderer.invoke('read-file', relativePath),
  writeFile: (relativePath, content) => ipcRenderer.invoke('write-file', relativePath, content),
  fileExists: (relativePath) => ipcRenderer.invoke('file-exists', relativePath),
  getGamePath: () => ipcRenderer.invoke('get-game-path'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  readI18n: (lang) => ipcRenderer.invoke('read-i18n', lang),
  reloadProjectData: () => ipcRenderer.invoke('reload-project-data'),
  selectImageFiles: () => ipcRenderer.invoke('select-image-files'),
  selectImageFolder: () => ipcRenderer.invoke('select-image-folder'),
  copyImageToProject: (src, dest) => ipcRenderer.invoke('copy-image-to-project', src, dest),
  listCharacterDirs: () => ipcRenderer.invoke('list-character-dirs'),
  listImagesInDir: (relDir) => ipcRenderer.invoke('list-images-in-dir', relDir),
  deleteImage: (relativePath) => ipcRenderer.invoke('delete-image', relativePath),
  onSettingsChanged: (cb) => ipcRenderer.on('settings-changed', (_, s) => cb(s)),
});
