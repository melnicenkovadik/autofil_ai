import { v4 as uuidv4 } from 'uuid';
import { getStorage, setStorage } from '../storage';
import { SettingsSchema, type Settings } from '../../shared/types/settings';

const STORAGE_KEY: 'settings_v1' = 'settings_v1';

export async function loadSettings(): Promise<Settings> {
  const raw = await getStorage<unknown>(STORAGE_KEY);
  if (!raw) {
    // Используем схему, чтобы получить корректные дефолты
    const initial: Settings = SettingsSchema.parse({});
    // Сгенерируем clientId при первой инициализации
    const withClientId: Settings = {
      ...initial,
      clientId: initial.clientId || uuidv4(),
    };
    await setStorage(STORAGE_KEY, withClientId);
    return withClientId;
  }
  const parsed = SettingsSchema.safeParse(raw);
  if (parsed.success) {
    const current = parsed.data;
    // Миграция старых настроек: если нет clientId/plan — дозаполняем
    const migrated: Settings = {
      ...current,
      clientId: current.clientId || uuidv4(),
      plan: current.plan ?? 'free',
    };
    if (migrated !== current) {
      await setStorage(STORAGE_KEY, migrated);
    }
    return migrated;
  }

  // Фоллбек на дефолты схемы
  const fallback: Settings = SettingsSchema.parse({});
  const withClientId: Settings = {
    ...fallback,
    clientId: fallback.clientId || uuidv4(),
  };
  await setStorage(STORAGE_KEY, withClientId);
  return withClientId;
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

/**
 * Reset settings to default values
 */
export async function resetSettingsToDefault(): Promise<Settings> {
  // Use schema to get proper defaults
  const initial: Settings = SettingsSchema.parse({});
  // Generate new clientId
  const withClientId: Settings = {
    ...initial,
    clientId: uuidv4(),
  };
  await setStorage(STORAGE_KEY, withClientId);
  return withClientId;
}


