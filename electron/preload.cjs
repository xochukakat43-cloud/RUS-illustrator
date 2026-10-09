const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  saveFileDialog: (params) => ipcRenderer.invoke('file:save-dialog', params),
  exportFileDialog: (params) => ipcRenderer.invoke('file:export-dialog', params),
  onMenuAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on('menu:action', listener);
    return () => ipcRenderer.removeListener('menu:action', listener);
  },
});
