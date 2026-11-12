import { base } from '$app/paths';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const API = 'https://www.googleapis.com/drive/v3/files';
const MARKER = "appProperties has { key='app' and value='edoMehrarbeitNRW' }";
export const DRIVE_FOLDER = 'edoMehrarbeitNRW';
export interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
}
interface TokenResponse {
  access_token?: string;
  expires_in: number;
  scope: string;
  error?: string;
}
interface OAuth {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    include_granted_scopes: boolean;
    callback: (response: TokenResponse) => void;
    error_callback: () => void;
  }): { requestAccessToken(options: { prompt: string }): void };
}
let oauth: OAuth;
let clientId = '';
let token = '';
let expires = 0;
let ready: Promise<void> | undefined;

export function prepareDrive() {
  return (ready ??= (async () => {
    clientId = __GOOGLE_CLIENT_ID__;
    try {
      const response = await fetch(`${base}/config.json`, { cache: 'no-cache' });
      const config = response.ok ? await response.json() : {};
      if (typeof config.googleClientId === 'string' && config.googleClientId.trim()) {
        clientId = config.googleClientId.trim();
      }
    } catch {
      /* Build-Konfiguration als Fallback */
    }
    if (!clientId)
      throw new Error('Google Drive ist noch nicht konfiguriert (Google Client-ID fehlt).');
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error('Google-Anmeldung nicht erreichbar.'));
      }, 15000);
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error('Google-Anmeldung konnte nicht geladen werden.'));
      };
      document.head.append(script);
    });
    oauth = (window as unknown as { google: { accounts: { oauth2: OAuth } } }).google.accounts
      .oauth2;
  })().catch((error) => {
    ready = undefined;
    throw error;
  }));
}

// Direkt vom Klick aufrufen, damit Browser das Anmeldefenster zulassen.
export function connectDrive(): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      include_granted_scopes: false,
      callback: (response) => {
        if (
          response.error ||
          !response.access_token ||
          !response.scope?.split(' ').includes(SCOPE)
        ) {
          reject(new Error('Google Drive wurde nicht freigegeben.'));
          return;
        }
        token = response.access_token;
        expires = Date.now() + Number(response.expires_in) * 1000 - 30000;
        resolve();
      },
      error_callback: () =>
        reject(new Error('Anmeldung abgebrochen oder Anmeldefenster blockiert.'))
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}

export function disconnectDrive() {
  token = '';
  expires = 0;
}

async function request(url: string, init: RequestInit = {}) {
  if (!token || Date.now() >= expires) {
    disconnectDrive();
    throw new Error('Bitte erneut mit Google Drive verbinden. Die Sitzung ist abgelaufen.');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(30000) });
  if (response.status === 401) {
    disconnectDrive();
    throw new Error('Bitte erneut mit Google Drive verbinden.');
  }
  if (!response.ok)
    throw new Error(
      `Google Drive: Anfrage fehlgeschlagen (${response.status}). Bitte Verbindung und Drive-Freigabe prüfen.`
    );
  return response;
}

async function list(q: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `trashed = false and ${q}`,
      fields: 'nextPageToken,files(id,name,createdTime)',
      orderBy: 'createdTime desc',
      pageSize: '100',
      spaces: 'drive'
    });
    if (pageToken) params.set('pageToken', pageToken);
    const result = await (await request(`${API}?${params}`)).json();
    files.push(...result.files);
    pageToken = result.nextPageToken ?? '';
  } while (pageToken);
  return files;
}

async function folders() {
  return list(`mimeType = 'application/vnd.google-apps.folder' and ${MARKER}`);
}

export async function listBackups() {
  const result: DriveFile[] = [];
  for (const folder of await folders()) {
    result.push(
      ...(await list(`'${folder.id}' in parents and mimeType = 'application/json' and ${MARKER}`))
    );
  }
  return result.sort((a, b) => b.createdTime.localeCompare(a.createdTime));
}

export async function saveBackup(json: string) {
  let folder = (await folders()).at(-1);
  if (!folder) {
    folder = await (
      await request(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: DRIVE_FOLDER,
          mimeType: 'application/vnd.google-apps.folder',
          appProperties: { app: DRIVE_FOLDER }
        })
      })
    ).json();
  }
  const name = `mehrarbeit-${new Date().toISOString().replaceAll(':', '-')}.json`;
  const boundary = `edo_${crypto.randomUUID()}`;
  const metadata = {
    name,
    parents: [folder!.id],
    mimeType: 'application/json',
    appProperties: { app: DRIVE_FOLDER }
  };
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${json}\r\n--${boundary}--`;
  await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  });
  return name;
}

export async function loadBackup(file: DriveFile) {
  return new File(
    [await (await request(`${API}/${encodeURIComponent(file.id)}?alt=media`)).blob()],
    file.name,
    { type: 'application/json' }
  );
}
