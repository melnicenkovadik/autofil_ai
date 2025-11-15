import { v4 as uuidv4 } from 'uuid';
import { getStorage, setStorage } from '../storage';
import { ProfilesStateSchema, type Profile, type ProfilesState } from '../../shared/types/profile';
import {
  aesDecryptJson,
  aesEncryptJson,
  exportAesKey,
  fromBase64,
  generateAesKey,
  importAesKey,
  toBase64,
  type EncryptedPayload,
} from '../../shared/utils/crypto';

const STORAGE_KEY: 'profiles_v1' = 'profiles_v1';
const PROFILES_KEY_STORAGE_KEY = 'profiles_key_v1';

type EncryptedProfilesState = EncryptedPayload & {
  kind: 'profiles';
};

type StoredProfilesState = ProfilesState | EncryptedProfilesState;

function isEncryptedProfilesState(value: unknown): value is EncryptedProfilesState {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Partial<EncryptedProfilesState>;
  return maybe.kind === 'profiles' && maybe.v === 1 && typeof maybe.iv === 'string' && typeof maybe.data === 'string';
}

async function getProfilesKey(): Promise<CryptoKey> {
  const res = await chrome.storage.local.get(PROFILES_KEY_STORAGE_KEY);
  const rawB64 = res[PROFILES_KEY_STORAGE_KEY] as string | undefined;

  if (rawB64) {
    const raw = fromBase64(rawB64);
    return importAesKey(raw.buffer);
  }

  const key = await generateAesKey();
  const raw = await exportAesKey(key);
  const b64 = toBase64(raw);
  await chrome.storage.local.set({ [PROFILES_KEY_STORAGE_KEY]: b64 });
  return key;
}

const DEFAULT_PROFILE = (): Profile => ({
  id: uuidv4(),
  name: 'Default',
  fields: {},
});

export async function loadProfilesState(): Promise<ProfilesState> {
  const stored = await getStorage<StoredProfilesState | undefined>(STORAGE_KEY);

  if (!stored) {
    const initial: ProfilesState = { activeProfileId: null, profiles: [DEFAULT_PROFILE()] };
    await saveProfilesState(initial);
    return initial;
  }

  let plain: unknown;

  if (isEncryptedProfilesState(stored)) {
    // Encrypted format
    const key = await getProfilesKey();
    plain = await aesDecryptJson<ProfilesState>(key, stored);
  } else {
    // Legacy plain format (pre-encryption)
    plain = stored;
  }

  const parsed = ProfilesStateSchema.safeParse(plain);
  if (parsed.success) {
    // If data was stored in legacy plain format, re-save it in encrypted form
    if (!isEncryptedProfilesState(stored)) {
      await saveProfilesState(parsed.data);
    }
    return parsed.data;
  }

  const fallback: ProfilesState = { activeProfileId: null, profiles: [DEFAULT_PROFILE()] };
  await saveProfilesState(fallback);
  return fallback;
}

export async function saveProfilesState(state: ProfilesState): Promise<void> {
  const parsed = ProfilesStateSchema.parse(state);
  const key = await getProfilesKey();
  const encrypted = await aesEncryptJson(key, parsed);
  const payload: EncryptedProfilesState = { ...encrypted, kind: 'profiles' };
  await setStorage(STORAGE_KEY, payload);
}

export async function getActiveProfileId(): Promise<string | null> {
  const state = await loadProfilesState();
  return state.activeProfileId ?? state.profiles[0]?.id ?? null;
}

export async function getActiveProfile(): Promise<Profile | null> {
  const state = await loadProfilesState();
  const id = await getActiveProfileId();
  return state.profiles.find((p) => p.id === id) ?? null;
}

export async function setActiveProfile(profileId: string): Promise<void> {
  const state = await loadProfilesState();
  if (!state.profiles.some((p) => p.id === profileId)) return;
  await saveProfilesState({ ...state, activeProfileId: profileId });
}

export async function createProfile(partial?: Partial<Profile>): Promise<Profile> {
  const state = await loadProfilesState();
  const profile: Profile = {
    id: uuidv4(),
    name: partial?.name?.trim() || `Profile ${state.profiles.length + 1}`,
    fields: partial?.fields ?? {},
    custom: partial?.custom ?? [],
  };
  const next: ProfilesState = {
    activeProfileId: state.activeProfileId ?? profile.id,
    profiles: [...state.profiles, profile],
  };
  await saveProfilesState(next);
  return profile;
}

export async function updateProfile(profileId: string, patch: Partial<Profile>): Promise<void> {
  const state = await loadProfilesState();
  const profiles = state.profiles.map((p) => (p.id === profileId ? { ...p, ...patch, id: p.id } : p));
  await saveProfilesState({ ...state, profiles });
}

export async function deleteProfile(profileId: string): Promise<void> {
  const state = await loadProfilesState();
  const profiles = state.profiles.filter((p) => p.id !== profileId);
  let activeProfileId = state.activeProfileId;
  if (activeProfileId === profileId) {
    activeProfileId = profiles[0]?.id ?? null;
  }
  await saveProfilesState({ activeProfileId, profiles });
}

export async function duplicateProfile(profileId: string): Promise<Profile> {
  const state = await loadProfilesState();
  const profile = state.profiles.find((p) => p.id === profileId);
  
  if (!profile) {
    throw new Error('Profile not found');
  }

  const newProfile: Profile = {
    ...profile,
    id: uuidv4(),
    name: `${profile.name} (copy)`,
  };

  const next: ProfilesState = {
    ...state,
    profiles: [...state.profiles, newProfile],
  };
  
  await saveProfilesState(next);
  return newProfile;
}


