import { app, BrowserWindow, ipcMain, screen, shell, session } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'
import Store from 'electron-store'
import { networkInterfaces } from 'os'
import { v4 as uuidv4 } from 'uuid'

// Initialize secure store
const store = new Store({
    encryptionKey: 'kiosk-secure-key',
    schema: {
        deviceInfo: {
            type: 'object',
            properties: {
                serialNumber: { type: 'string' },
                macAddress: { type: 'string' },
                uuid: { type: 'string' }
            }
        },
        apiConfig: {
            type: 'object',
            properties: {
                baseUrl: { type: 'string' },
                token: { type: 'string' }
            }
        }
    }
})

let mainWindow: BrowserWindow | null = null
let db: Database.Database | null = null

// Database initialization
function initDatabase() {
    const dbPath = join(app.getPath('userData'), 'kiosk.db')
    db = new Database(dbPath)

    // Create tables
    db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      logo_url TEXT,
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      sync_timestamp INTEGER
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      channel_id INTEGER,
      name TEXT NOT NULL,
      image TEXT,
      products_count INTEGER DEFAULT 0,
      sync_timestamp INTEGER,
      FOREIGN KEY (channel_id) REFERENCES channels (id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price REAL,
      image TEXT,
      sync_timestamp INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE,
      slot_number INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      payment_method TEXT,
      total_amount REAL,
      synced BOOLEAN DEFAULT 0,
      created_at INTEGER,
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)
}

// Get device information
function getDeviceInfo() {
    let deviceInfo = store.get('deviceInfo') as any

    if (!deviceInfo) {
        // Generate device info
        const interfaces = networkInterfaces()
        let macAddress = ''

        // Find first non-internal MAC address
        for (const name of Object.keys(interfaces)) {
            const iface = interfaces[name]
            if (iface) {
                for (const alias of iface) {
                    if (alias.family === 'IPv4' && !alias.internal && alias.mac !== '00:00:00:00:00:00') {
                        macAddress = alias.mac
                        break
                    }
                }
            }
            if (macAddress) break
        }

        deviceInfo = {
            serialNumber: process.env.KIOSK_SERIAL || 'DEV-' + Date.now(),
            macAddress: macAddress || 'unknown',
            uuid: uuidv4()
        }

        store.set('deviceInfo', deviceInfo)
    }

    return deviceInfo
}

function createWindow(): void {
    // Get primary display dimensions
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    // Create the browser window
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        show: false,
        autoHideMenuBar: true,
        fullscreen: false,
        kiosk: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // Allow WebSocket in dev
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // Load the remote URL for development or the local html file for production
    if (true && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../index.html'))
    }
}

// IPC handlers
ipcMain.handle('get-device-info', () => {
    return getDeviceInfo()
})

ipcMain.handle('get-app-config', (_, key: string) => {
    if (!db) return null
    const result = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key)
    return result ? JSON.parse(result.value) : null
})

ipcMain.handle('set-app-config', (_, key: string, value: any) => {
    if (!db) return false
    db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value))
    return true
})

ipcMain.handle('db-query', (_, sql: string, params: any[] = []) => {
    if (!db) return null
    try {
        const stmt = db.prepare(sql)
        return stmt.all(...params)
    } catch (error) {
        console.error('Database query error:', error)
        return null
    }
})

ipcMain.handle('db-run', (_, sql: string, params: any[] = []) => {
    if (!db) return null
    try {
        const stmt = db.prepare(sql)
        return stmt.run(...params)
    } catch (error) {
        console.error('Database run error:', error)
        return null
    }
})

ipcMain.handle('add-to-sync-queue', (_, type: string, data: any) => {
    if (!db) return false
    try {
        db.prepare('INSERT INTO sync_queue (type, data, created_at) VALUES (?, ?, ?)').run(
            type,
            JSON.stringify(data),
            Date.now()
        )
        return true
    } catch (error) {
        console.error('Add to sync queue error:', error)
        return false
    }
})

ipcMain.handle('get-sync-queue', () => {
    if (!db) return []
    return db.prepare('SELECT * FROM sync_queue ORDER BY created_at ASC').all()
})

ipcMain.handle('remove-from-sync-queue', (_, id: number) => {
    if (!db) return false
    db.prepare('DELETE FROM sync_queue WHERE id = ?').run(id)
    return true
})

ipcMain.handle('store-get', (_, key: string) => {
    return store.get(key)
})

ipcMain.handle('store-set', (_, key: string, value: any) => {
    store.set(key, value)
    return true
})

ipcMain.handle('get-screen-info', () => {
    const display = screen.getPrimaryDisplay()
    return {
        width: display.workAreaSize.width,
        height: display.workAreaSize.height,
        scaleFactor: display.scaleFactor
    }
})

// App event handlers
app.whenReady().then(() => {
    app.setAppUserModelId('com.company.kiosk-terminal')

    // ✅ Move this block inside here
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self'; frame-ancestors 'none';"],
                'X-Frame-Options': ['DENY']
            }
        })
    })

    // Initialize DB and create window
    initDatabase()
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
    contents.on('new-window', (navigationEvent) => {
        navigationEvent.preventDefault()
    })
})

// Prevent navigation
app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (navigationEvent, url) => {
        const parsedUrl = new URL(url)

        if (parsedUrl.origin !== 'http://localhost:5173' && false) {
            navigationEvent.preventDefault()
        }
    })
})