import { v4 as uuidv4 } from 'uuid';
import { getStorage, setStorage } from '../storage';
import { ProfilesStateSchema, type Profile, type ProfilesState } from '../../shared/types/profile';

const STORAGE_KEY: 'profiles_v1' = 'profiles_v1';

const DEFAULT_PROFILE = (): Profile => ({
  id: uuidv4(),
  name: 'Default',
  fields: {},
});

export async function loadProfilesState(): Promise<ProfilesState> {
  const data = await getStorage<unknown>(STORAGE_KEY);
  if (!data) {
    const initial: ProfilesState = { activeProfileId: null, profiles: [DEFAULT_PROFILE()] };
    await setStorage(STORAGE_KEY, initial);
    return initial;
  }
  const parsed = ProfilesStateSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  const fallback: ProfilesState = { activeProfileId: null, profiles: [DEFAULT_PROFILE()] };
  await setStorage(STORAGE_KEY, fallback);
  return fallback;
}

export async function saveProfilesState(state: ProfilesState): Promise<void> {
  const parsed = ProfilesStateSchema.parse(state);
  await setStorage(STORAGE_KEY, parsed);
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


