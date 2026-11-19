import * as SecureStore from 'expo-secure-store';

/**
 * Supabase auth storage backed by the device keychain (expo-secure-store).
 * SecureStore values are limited to ~2 KB and a session token can be larger,
 * so values are split into chunks.
 */
const CHUNK_SIZE = 1800;
const countKey = (key: string) => `${key}__chunks`;
const chunkKey = (key: string, i: number) => `${key}__${i}`;

async function removeItem(key: string): Promise<void> {
  const count = Number((await SecureStore.getItemAsync(countKey(key))) ?? '0');
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
  );
  await SecureStore.deleteItemAsync(countKey(key));
}

async function getItem(key: string): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(countKey(key));
  if (raw === null) return null;
  const count = Number(raw);
  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
  );
  if (parts.some((p) => p === null)) return null;
  return parts.join('');
}

async function setItem(key: string, value: string): Promise<void> {
  await removeItem(key);
  const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK_SIZE}}`, 'g')) ?? [''];
  await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(chunkKey(key, i), c)));
  await SecureStore.setItemAsync(countKey(key), String(chunks.length));
}

export const secureStorage = { getItem, setItem, removeItem };
