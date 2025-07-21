const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const CLIENT_ID = '1018441761342-dnnsun9f031ua3n58svfliena8e0lbet.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const TOKEN_PATH = path.join(app.getPath('userData'), 'google_token.json');
let oauth2Client;

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
ipcMain.handle('log-focus-session', async (event, session) => {
  return addFocusSessionToCalendar(session);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
