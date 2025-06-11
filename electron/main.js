const { app, BrowserWindow, globalShortcut } = require('electron')
const path = require('path')
const {tr} = require("vuetify/locale");
const isDev = true;

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDev, // Windowed mode in development
    kiosk: !isDev,      // Kiosk mode only in production
    autoHideMenuBar: true,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: !isDev, // Disable web security in dev for local files
      allowRunningInsecureContent: isDev
    }
  })

  // Load the app
  const startUrl = isDev
      ? 'http://localhost:8080'
      : `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(startUrl)

  // Show window when ready to prevent blank screen
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Focus on the window
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Handle failed loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorDescription)
  })

  // Disable menu bar
  mainWindow.setMenuBarVisibility(false)

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== 'http://localhost:8080' && !isDev) {
      event.preventDefault()
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  // Disable keyboard shortcuts in kiosk mode (only in production)
  if (!isDev) {
    globalShortcut.register('Alt+F4', () => {})
    globalShortcut.register('Ctrl+Shift+I', () => {})
    globalShortcut.register('F11', () => {})
    globalShortcut.register('F12', () => {})
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
