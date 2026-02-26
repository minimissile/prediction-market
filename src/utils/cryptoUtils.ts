const STORAGE_KEY = 'pm_wallet_pk';
const SALT = 'PM_SALT_2026';

function xorEncrypt(text: string, key: string): string {
  return Array.from(text)
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join('');
}

export function encryptKey(key: string): string {
  const xored = xorEncrypt(key, SALT);
  return btoa(xored);
}

export function decryptKey(encrypted: string): string {
  const xored = atob(encrypted);
  return xorEncrypt(xored, SALT);
}

export function savePrivateKey(key: string): void {
  const encrypted = encryptKey(key);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export function loadPrivateKey(): string | null {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  try {
    return decryptKey(encrypted);
  } catch {
    return null;
  }
}

export function clearPrivateKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}
