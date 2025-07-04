import { contextBridge, ipcRenderer } from 'electron'

// Define the API interface
export interface ElectronAPI {
    // Device information
    getDeviceInfo: () => Promise<{
        serialNumber: string
        macAddress: string
        uuid: string
    }>

    // App configuration
    getAppConfig: (key: string) => Promise<any>
    setAppConfig: (key: string, value: any) => Promise<boolean>

    // Database operations
    dbQuery: (sql: string, params?: any[]) => Promise<any[]>
    dbRun: (sql: string, params?: any[]) => Promise<any>

    // Sync queue operations
    addToSyncQueue: (type: string, data: any) => Promise<boolean>
    getSyncQueue: () => Promise<any[]>
    removeFromSyncQueue: (id: number) => Promise<boolean>

    // Secure store operations
    storeGet: (key: string) => Promise<any>
    storeSet: (key: string, value: any) => Promise<boolean>

    // Screen information
    getScreenInfo: () => Promise<{
        width: number
        height: number
        scaleFactor: number
    }>

    // System events
    onAppClose: (callback: () => void) => void
    onNetworkChange: (callback: (isOnline: boolean) => void) => void
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
    getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
    getAppConfig: (key: string) => ipcRenderer.invoke('get-app-config', key),
    setAppConfig: (key: string, value: any) => ipcRenderer.invoke('set-app-config', key, value),
    dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db-query', sql, params),
    dbRun: (sql: string, params?: any[]) => ipcRenderer.invoke('db-run', sql, params),
    addToSyncQueue: (type: string, data: any) => ipcRenderer.invoke('add-to-sync-queue', type, data),
    getSyncQueue: () => ipcRenderer.invoke('get-sync-queue'),
    removeFromSyncQueue: (id: number) => ipcRenderer.invoke('remove-from-sync-queue', id),
    storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
    storeSet: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
    getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),

    onAppClose: (callback: () => void) => {
        ipcRenderer.on('app-close', callback)
    },

    onNetworkChange: (callback: (isOnline: boolean) => void) => {
        ipcRenderer.on('network-change', (_, isOnline) => callback(isOnline))
    }
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Types for renderer process
declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}