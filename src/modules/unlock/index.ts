import { getStorage, setStorage } from '../storage';
import { SettingsSchema, type Settings } from '../../shared/types/settings';

const STORAGE_KEY: 'settings_v1' = 'settings_v1';

export async function loadSettings(): Promise<Settings> {
  const raw = await getStorage<unknown>(STORAGE_KEY);
  if (!raw) {
    const initial: Settings = {
      unlockMinutes: 15,
      unlockedUntil: null,
      lockEnabled: false,
      aiEnabled: false,
      aiModel: 'gpt-4o-mini',
    };
    await setStorage(STORAGE_KEY, initial);
    return initial;
  }
  const parsed = SettingsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const fallback: Settings = {
    unlockMinutes: 15,
    unlockedUntil: null,
    lockEnabled: false,
    aiEnabled: false,
    aiModel: 'gpt-4o-mini',
  };
  await setStorage(STORAGE_KEY, fallback);
  return fallback;
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const next: Settings = { ...current, ...patch };
  await setStorage(STORAGE_KEY, next);
  return next;
}

export async function isUnlocked(now = Date.now()): Promise<boolean> {
  const settings = await loadSettings();
  if (!settings.lockEnabled) return true;
  if (!settings.unlockedUntil) return false;
  return settings.unlockedUntil > now;
}

export async function unlockForMinutes(minutes?: number): Promise<Settings> {
  const settings = await loadSettings();
  const duration = minutes ?? settings.unlockMinutes ?? 15;
  const unlockedUntil = Date.now() + duration * 60_000;
  return saveSettings({ unlockedUntil });
}

export async function lockNow(): Promise<Settings> {
  return saveSettings({ unlockedUntil: null });
}

export async function getRemainingTime(now = Date.now()): Promise<number> {
  const settings = await loadSettings();
  if (!settings.lockEnabled) {
    return Number.POSITIVE_INFINITY;
  }
  if (!settings.unlockedUntil || settings.unlockedUntil <= now) {
    return 0;
  }
  return Math.floor((settings.unlockedUntil - now) / 1000);
}


