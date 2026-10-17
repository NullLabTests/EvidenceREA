const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');

// Synthetic main process for fixture
function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: require('path').join(__dirname, '../preload/index.js')
    }
  });
}

app.whenReady().then(() => {
  // Hotkey registration (evidence for hotkey feature)
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    // trigger dictation
  });

  // IPC handlers
  ipcMain.handle('dictation:start', async () => {
    return { status: 'recording' };
  });

  ipcMain.handle('dictation:stop', async () => {
    return { transcript: 'example text' };
  });

  ipcMain.handle('inject:text', async (event, text) => {
    // text injection into focused app (native helper would be called here)
    return { injected: true, length: text.length };
  });

  createWindow();
});
