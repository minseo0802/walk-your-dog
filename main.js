const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1050,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "댕댕이 산책 일기 🐾",
    autoHideMenuBar: true, // Hide menu bar for a clean, custom app look
    resizable: true,
    backgroundColor: '#FAF8F5' // Matches our cute pastel cream background
  });

  mainWindow.loadFile('index.html');

  // Uncomment during development if needed
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
