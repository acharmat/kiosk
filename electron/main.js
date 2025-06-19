const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const db = require('./db');
const provision = require('./provision');

const isDev = true;

let mainWindow;

// IPC Handlers
ipcMain.handle('sync-categories', async () => {
  let token = db.getToken();

  // If no token, provision first
  if (!token) {
    try {
      console.log('No token found, provisioning kiosk...');
      const kiosk = await provision.ensureKioskProvisioned();
      token = kiosk.token;
      console.log('Kiosk provisioned successfully with token:', token);
    } catch (error) {
      console.error('Failed to provision kiosk:', error.response?.data || error.message);
      // Return local categories if provision fails
      const localCategories = db.getLocalCategories();
      console.log(`Returning ${localCategories.length} local categories due to provision failure`);
      return localCategories;
    }
  }

  // Now try to fetch categories with the token
  try {
    console.log('Fetching categories with token:', token);

    const res = await axios.get('https://blup.com/api/kiosk/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000, // 15 second timeout
    });

    console.log('Categories API response:', res.data);

    if (res.data && Array.isArray(res.data)) {
      db.saveCategories(res.data);
      console.log(`Successfully fetched and saved ${res.data.length} categories`);
      return res.data;
    } else {
      console.warn('Invalid response format from categories API:', res.data);
      const localCategories = db.getLocalCategories();
      return localCategories;
    }

  } catch (err) {
    console.error('Error fetching categories:', err.response?.data || err.message);

    // If it's an auth error, clear the token and try to reprovision
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.log('Auth error detected, clearing token and reprovisioning...');
      db.prepare('DELETE FROM kiosk').run();

      // Recursive call to reprovision and try again
      return ipcMain.emit('sync-categories');
    }

    // Return local categories for other errors
    const localCategories = db.getLocalCategories();
    console.log(`Returning ${localCategories.length} local categories due to API error`);
    return localCategories;
  }
});
ipcMain.handle('get-local-categories', async () => {
  const localCategories = db.getLocalCategories();
  console.log(`Returning ${localCategories.length} local categories`);
  return localCategories;
});
ipcMain.handle('sync-products', async (event, categoryId) => {
  let token = db.getToken();

  if (!token) {
    try {
      console.log('No token found, provisioning kiosk...');
      const kiosk = await provision.ensureKioskProvisioned();
      token = kiosk.token;
      console.log('Kiosk provisioned successfully with token:', token);
    } catch (error) {
      console.error('Failed to provision kiosk:', error.response?.data || error.message);
      const localProducts = db.getLocalProducts(categoryId);
      return localProducts;
    }
  }

  try {
    console.log(`Fetching products for category ${categoryId} with token:`, token);

    const res = await axios.get(`https://blup.com/api/kiosk/categories/${categoryId}/products`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000,
    });

    if (res.data && Array.isArray(res.data)) {
      db.saveProducts(res.data, categoryId);
      return res.data;
    } else {
      console.warn('Unexpected response format:', res.data);
      return db.getLocalProducts(categoryId);
    }

  } catch (err) {
    console.error('Error fetching products:', err.response?.data || err.message);

    if (err.response?.status === 401 || err.response?.status === 403) {
      db.prepare('DELETE FROM kiosk').run();
      return ipcMain.emit('sync-products', event, categoryId);
    }

    return db.getLocalProducts(categoryId);
  }
});

ipcMain.handle('get-local-products', async (event, categoryId) => {
  const localProducts = db.getLocalProducts(categoryId);
  console.log(`Returning ${localProducts.length} local products for category ${categoryId}`);
  return localProducts;
});


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    fullscreen: !isDev,
    kiosk: !isDev,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: false,
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev
    }
  });

  const startUrl = `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorDescription);
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:8080' && !isDev) {
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  if (!isDev) {
    globalShortcut.register('Alt+F4', () => {});
    globalShortcut.register('Ctrl+Shift+I', () => {});
    globalShortcut.register('F11', () => {});
    globalShortcut.register('F12', () => {});
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
