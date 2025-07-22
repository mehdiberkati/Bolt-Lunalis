const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  connectGoogleCalendar: () => ipcRenderer.invoke('connect-google-calendar'),
  logFocusSession: session => ipcRenderer.invoke('log-focus-session', session),
  isGoogleConnected: () => ipcRenderer.invoke('is-google-connected'),
  openExternal: url => shell.openExternal(url)
});
