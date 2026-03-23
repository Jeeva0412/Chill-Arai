/**
 * Phase 2: Google Drive "Ghost Protocol" Sync
 * - Stores data in the hidden appDataFolder (invisible to user's Drive UI)
 * - Timestamp-based merge conflict resolution
 * - Data encrypted with AES-GCM before upload (Phase 3 integration)
 */

import { encryptData, decryptData } from './crypto';

const DRIVE_FILE_NAME = 'chill-arai-sync.json';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

export function isGoogleConfigured(): boolean {
  return !!CLIENT_ID;
}

export async function initGoogleAuth(): Promise<void> {
  if (!CLIENT_ID) return;
  await loadGapiScript();
  await loadGisScript();
}

function loadGapiScript(): Promise<void> {
  return new Promise((resolve) => {
    if (gapiInited) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = async () => {
      await new Promise<void>((r) => window.gapi.load('client', r));
      await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
      gapiInited = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve) => {
    if (gisInited) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
      });
      gisInited = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

export function signInWithGoogle(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error('Google not initialized')); return; }
    tokenClient.callback = (resp: any) => {
      if (resp.error) { reject(resp); return; }
      resolve(resp.access_token);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export function signOutGoogle() {
  const token = window.gapi?.client?.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken(null);
  }
  sessionStorage.removeItem('google_access_token');
}

async function findDriveFile(token: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DRIVE_FILE_NAME}'`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

export async function fetchFromDrive(token: string, encKey: CryptoKey | null): Promise<any | null> {
  try {
    const fileId = await findDriveFile(token);
    if (!fileId) return null;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const text = await res.text();
    const jsonStr = encKey ? await decryptData(encKey, text) : text;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Drive fetch error:', e);
    return null;
  }
}

export async function pushToDrive(token: string, payload: any, encKey: CryptoKey | null): Promise<void> {
  const jsonStr = JSON.stringify(payload);
  const body = encKey ? await encryptData(encKey, jsonStr) : jsonStr;
  const fileId = await findDriveFile(token);

  const metadata = JSON.stringify({ name: DRIVE_FILE_NAME, parents: fileId ? undefined : ['appDataFolder'] });
  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('media', new Blob([body], { type: 'text/plain' }));

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

/** Timestamp-based merge: always keep the record with the newer updated_at */
export function mergeRecords<T extends { id: string; updated_at: string; deleted: boolean }>(
  local: T[],
  remote: T[]
): T[] {
  const map = new Map<string, T>();
  for (const r of local) map.set(r.id, r);
  for (const r of remote) {
    const existing = map.get(r.id);
    if (!existing || r.updated_at > existing.updated_at) {
      map.set(r.id, r);
    }
  }
  return Array.from(map.values());
}
