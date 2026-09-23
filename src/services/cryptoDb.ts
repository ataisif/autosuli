import { DatabaseState } from '../types';
import { initialDatabase } from './mockData';

const STORAGE_KEY = 'autosuli_database_v1';
const ENCRYPTION_FLAG_KEY = 'autosuli_is_encrypted';
const ENCRYPTED_DATA_KEY = 'autosuli_encrypted_payload';

// WebCrypto helper functions for AES-GCM encryption
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptDatabase(data: DatabaseState, password: string): Promise<string> {
  const enc = new TextEncoder();
  const plainBytes = enc.encode(JSON.stringify(data));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plainBytes
  );

  const combined = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(encryptedBuffer)),
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(combined);
}

export async function decryptDatabase(payloadStr: string, password: string): Promise<DatabaseState> {
  const payload = JSON.parse(payloadStr);
  const salt = new Uint8Array(payload.salt);
  const iv = new Uint8Array(payload.iv);
  const ciphertext = new Uint8Array(payload.ciphertext);

  const key = await deriveKey(password, salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as DatabaseState;
}

export function loadStoredDatabase(): { state: DatabaseState; isLocked: boolean } {
  try {
    const isEncrypted = localStorage.getItem(ENCRYPTION_FLAG_KEY) === 'true';
    if (isEncrypted) {
      const payload = localStorage.getItem(ENCRYPTED_DATA_KEY);
      if (payload) {
        return { state: initialDatabase, isLocked: true };
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DatabaseState;
      return { state: parsed, isLocked: false };
    }
  } catch (e) {
    console.error('Error loading local database:', e);
  }

  // Fallback to initial database
  return { state: initialDatabase, isLocked: false };
}

export function saveDatabaseToStorage(state: DatabaseState): void {
  try {
    const stateToSave = {
      ...state,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    localStorage.setItem(ENCRYPTION_FLAG_KEY, state.isEncrypted ? 'true' : 'false');
  } catch (e) {
    console.error('Auto-save error:', e);
  }
}

export async function saveEncryptedDatabaseToStorage(state: DatabaseState, password: string): Promise<void> {
  const stateToSave: DatabaseState = {
    ...state,
    isEncrypted: true,
    lastSaved: new Date().toISOString(),
  };
  const encryptedPayload = await encryptDatabase(stateToSave, password);
  localStorage.setItem(ENCRYPTED_DATA_KEY, encryptedPayload);
  localStorage.setItem(ENCRYPTION_FLAG_KEY, 'true');
  // Clear unencrypted storage for security
  localStorage.removeItem(STORAGE_KEY);
}

export function disableStorageEncryption(state: DatabaseState): void {
  localStorage.removeItem(ENCRYPTED_DATA_KEY);
  localStorage.setItem(ENCRYPTION_FLAG_KEY, 'false');
  saveDatabaseToStorage({ ...state, isEncrypted: false });
}

export async function loadLocalDatabase(password?: string): Promise<DatabaseState> {
  try {
    const isEncrypted = localStorage.getItem(ENCRYPTION_FLAG_KEY) === 'true';
    if (isEncrypted) {
      const payload = localStorage.getItem(ENCRYPTED_DATA_KEY);
      if (payload && password) {
        try {
          return await decryptDatabase(payload, password);
        } catch (e) {
          console.warn('Decryption failed, using fallback:', e);
        }
      }
      return initialDatabase;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DatabaseState;
      return {
        ...initialDatabase,
        ...parsed,
        schoolCompany: parsed.schoolCompany || initialDatabase.schoolCompany,
        courseOffers: parsed.courseOffers?.length ? parsed.courseOffers : initialDatabase.courseOffers,
        courseRegistrations: parsed.courseRegistrations || initialDatabase.courseRegistrations || [],
        users: parsed.users?.length ? parsed.users : initialDatabase.users,
        auditLogs: parsed.auditLogs || initialDatabase.auditLogs || [],
        currentTheme: parsed.currentTheme || initialDatabase.currentTheme || 'amber-classic',
      };
    }
  } catch (e) {
    console.error('Error loading database:', e);
  }
  return initialDatabase;
}

export async function saveLocalDatabase(state: DatabaseState, password?: string): Promise<void> {
  if (password) {
    await saveEncryptedDatabaseToStorage(state, password);
  } else {
    saveDatabaseToStorage(state);
  }
}

export function exportDatabaseToJson(state: DatabaseState): void {
  exportBackupFile(state);
}

export async function importDatabaseFromJson(file: File): Promise<DatabaseState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as DatabaseState;
        if (!parsed.vehicles || !parsed.students || !parsed.instructors) {
          throw new Error('Érvénytelen biztonsági mentés struktúra.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

export function exportBackupFile(state: DatabaseState, encryptedData?: string): void {
  const content = encryptedData || JSON.stringify(state, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `autosuli_adatbazis_mentes_${new Date().toISOString().slice(0, 10)}${encryptedData ? '.aesdb' : '.json'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
