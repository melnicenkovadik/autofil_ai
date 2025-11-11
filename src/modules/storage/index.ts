export type StorageKey =
  | 'profiles_v1'
  | 'settings_v1'
  | 'domain_rules_v1';

type StorageShape = {
  profiles_v1?: unknown;
  settings_v1?: unknown;
  domain_rules_v1?: unknown;
};

export async function getStorage<T = unknown>(key: StorageKey): Promise<T | undefined> {
  const res = await chrome.storage.local.get(key as keyof StorageShape);
  return res[key as keyof StorageShape] as T | undefined;
}

export async function setStorage<T = unknown>(key: StorageKey, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value } as StorageShape);
}

export function onStorageChanged(
  callback: (changes: Record<string, chrome.storage.StorageChange>, areaName: 'local' | 'sync' | 'managed') => void,
): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, areaName: 'local' | 'sync' | 'managed') => {
    callback(changes, areaName);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}


