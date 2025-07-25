const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  connectGoogleCalendar: () => ipcRenderer.invoke('connect-google-calendar'),
  logFocusSession: session => ipcRenderer.invoke('log-focus-session', session),
  isGoogleConnected: () => ipcRenderer.invoke('is-google-connected'),
  disconnectGoogleCalendar: () => ipcRenderer.invoke('disconnect-google-calendar'),
  openExternal: url => ipcRenderer.invoke('open-external', url),
  connectSpotify: () => ipcRenderer.invoke('connect-spotify'),
  isSpotifyConnected: () => ipcRenderer.invoke('is-spotify-connected'),
  disconnectSpotify: () => ipcRenderer.invoke('disconnect-spotify'),
  playSpotify: () => ipcRenderer.invoke('play-spotify'),
  pauseSpotify: () => ipcRenderer.invoke('pause-spotify'),
  launchSpotifyApp: () => ipcRenderer.invoke('launch-spotify-app')
});
