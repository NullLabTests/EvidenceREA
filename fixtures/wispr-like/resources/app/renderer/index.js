// Synthetic renderer process for fixture
const { ipcRenderer } = require('electron');

// Renderer triggers dictation via IPC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ipcRenderer.invoke('dictation:stop');
  }
});
