const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const SPOTIFY_CLIENT_ID = '23351c09e9314ed39a04c0cee74b30db';
const SPOTIFY_CLIENT_SECRET = '8b7c9ad0c1c84a87b43bb46be26540bd';
const SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SPOTIFY_SCOPES = 'streaming user-read-playback-state user-modify-playback-state user-read-currently-playing';

const CLIENT_ID = '1018441761342-dnnsun9f031ua3n58svfliena8e0lbet.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const SPOTIFY_TOKEN_PATH = path.join(app.getPath('userData'), 'spotify_token.json');

const TOKEN_PATH = path.join(app.getPath('userData'), 'google_token.json');
let oauth2Client;

// Spotify OAuth helpers
function getSpotifyToken() {
  try {
    return JSON.parse(fs.readFileSync(SPOTIFY_TOKEN_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function saveSpotifyToken(data) {
  fs.writeFileSync(SPOTIFY_TOKEN_PATH, JSON.stringify(data));
}

async function refreshSpotifyToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: SPOTIFY_CLIENT_SECRET
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: params
  });
  if (!res.ok) return null;
  const data = await res.json();
  const tokenData = {
    ...data,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + data.expires_in * 1000
  };
  saveSpotifyToken(tokenData);
  return tokenData;
}

async function getSpotifyAccessToken() {
  const tokenData = getSpotifyToken();
  if (!tokenData) return null;
  if (tokenData.expires_at && tokenData.expires_at < Date.now()) {
    const refreshed = await refreshSpotifyToken(tokenData.refresh_token);
    return refreshed ? refreshed.access_token : null;
  }
  return tokenData.access_token;
}

async function connectSpotify() {
  if (getSpotifyToken()) return true;
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES
  });
  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  const authWin = new BrowserWindow({ width: 500, height: 600, show: true });
  authWin.loadURL(authUrl);
  return new Promise(resolve => {
    const { session } = authWin.webContents;
    const filter = { urls: [`${SPOTIFY_REDIRECT_URI}*`] };
    session.webRequest.onBeforeRequest(filter, async details => {
      const url = new URL(details.url);
      const code = url.searchParams.get('code');
      if (code) {
        try {
          const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            client_id: SPOTIFY_CLIENT_ID,
            client_secret: SPOTIFY_CLIENT_SECRET
          });
          const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            body
          });
          const data = await res.json();
          if (res.ok) {
            data.expires_at = Date.now() + data.expires_in * 1000;
            saveSpotifyToken(data);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          console.error('Spotify auth error', err);
          resolve(false);
        } finally {
          authWin.destroy();
        }
      }
    });
    authWin.on('closed', () => resolve(false));
  });
}

function isSpotifyConnected() {
  return !!getSpotifyToken();
}

function disconnectSpotify() {
  try {
    if (fs.existsSync(SPOTIFY_TOKEN_PATH)) {
      fs.unlinkSync(SPOTIFY_TOKEN_PATH);
    }
    return true;
  } catch {
    return false;
  }
}

async function playSpotify() {
  const access = await getSpotifyAccessToken();
  if (!access) return false;
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context_uri: 'spotify:playlist:37i9dQZF1DXadOVCgGhS7j'
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Spotify play error', err);
    return false;
  }
}

async function pauseSpotify() {
  const access = await getSpotifyAccessToken();
  if (!access) return false;
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${access}` }
    });
    return res.ok;
  } catch (err) {
    console.error('Spotify pause error', err);
    return false;
  }
}

async function launchSpotifyApp() {
  try {
    // Open the playlist URI directly. If Spotify is not installed,
    // Windows will automatically redirect to the Microsoft Store page.
    await shell.openExternal('spotify:playlist:37i9dQZF1DXadOVCgGhS7j');
    return true;
  } catch (err) {
    console.error('Launch Spotify app error', err);
    try {
      if (process.platform === 'win32') {
        await shell.openExternal('ms-windows-store://pdp/?productid=9NCBCSZSJRSB');
      }
    } catch {}
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
}

function getOAuthClient() {
  if (oauth2Client) return oauth2Client;
  oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  try {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    oauth2Client.setCredentials(JSON.parse(token));
  } catch (err) {
    // no saved token
  }
  return oauth2Client;
}

async function authenticateWithGoogle() {
  const oAuth2Client = getOAuthClient();
  if (oAuth2Client.credentials && oAuth2Client.credentials.access_token) {
    return true;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  const authWin = new BrowserWindow({ width: 500, height: 600, show: true });
  authWin.loadURL(authUrl);

  return new Promise(resolve => {
    const { session } = authWin.webContents;
    const filter = { urls: ['http://localhost/*'] };
    session.webRequest.onBeforeRequest(filter, async details => {
      const url = new URL(details.url);
      const code = url.searchParams.get('code');
      if (code) {
        try {
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
          resolve(true);
        } catch (err) {
          console.error('Google auth error', err);
          resolve(false);
        } finally {
          authWin.destroy();
        }
      }
    });
    authWin.on('closed', () => resolve(false));
  });
}

async function addFocusSessionToCalendar(session) {
  const auth = getOAuthClient();
  if (!auth.credentials || !auth.credentials.access_token) return false;

  const calendar = google.calendar({ version: 'v3', auth });
  const start = new Date(session.start);
  const end = new Date(start.getTime() + session.duration * 60000);
  const description = session.description || '';
  try {
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Focus ${session.type} +${session.xp}XP - ${session.project || 'général'}`,
        description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() }
      }
    });
    return true;
  } catch (err) {
    console.error('Calendar insert error', err);
    return false;
  }
}

app.whenReady().then(createWindow);

ipcMain.handle('connect-google-calendar', authenticateWithGoogle);
ipcMain.handle('is-google-connected', () => {
  try {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    return !!JSON.parse(token).access_token;
  } catch {
    return false;
  }
});
ipcMain.handle('disconnect-google-calendar', () => {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
    if (oauth2Client) {
      oauth2Client.setCredentials({});
    }
    return true;
  } catch {
    return false;
  }
});
ipcMain.handle('connect-spotify', connectSpotify);
ipcMain.handle('is-spotify-connected', () => isSpotifyConnected());
ipcMain.handle('disconnect-spotify', () => disconnectSpotify());
ipcMain.handle('play-spotify', playSpotify);
ipcMain.handle('pause-spotify', pauseSpotify);
ipcMain.handle('launch-spotify-app', launchSpotifyApp);
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch {
    return false;
  }
});
ipcMain.handle('log-focus-session', async (event, session) => {
  return addFocusSessionToCalendar(session);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
