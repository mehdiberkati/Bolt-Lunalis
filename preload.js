const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  connectGoogleCalendar: () => ipcRenderer.invoke('connect-google-calendar'),
  logFocusSession: session => ipcRenderer.invoke('log-focus-session', session)
});
