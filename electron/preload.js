const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    syncCategories: () => ipcRenderer.invoke('sync-categories'),
    getLocalCategories: () => ipcRenderer.invoke('get-local-categories'),
    syncProducts: (categoryId) => ipcRenderer.invoke('sync-products', categoryId),
    getLocalProducts: (categoryId) => ipcRenderer.invoke('get-local-products', categoryId),
});
