const { contextBridge, ipcRenderer } = require('electron');

// Preload exposes safe APIs
contextBridge.exposeInMainWorld('wispr', {
  startDictation: () => ipcRenderer.invoke('dictation:start'),
  stopDictation: () => ipcRenderer.invoke('dictation:stop'),
  injectText: (text) => ipcRenderer.invoke('inject:text', text)
});
