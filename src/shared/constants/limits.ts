import type { Profile } from '@shared/types/profile';
import type { Settings } from '@shared/types/settings';

export type Plan = Settings['plan'];

export type PlanLimits = {
  maxProfiles: number;
  maxFieldsPerProfile: number;
};

export const FREE_LIMITS: PlanLimits = {
  maxProfiles: 2,
  maxFieldsPerProfile: 30,
};

// По сути безлимит, но оставим разумные числа
export const PRO_LIMITS: PlanLimits = {
  maxProfiles: 10_000,
  maxFieldsPerProfile: 1_000,
};

export function getLimits(plan: Plan): PlanLimits {
  return plan === 'pro' ? PRO_LIMITS : FREE_LIMITS;
}

export function countProfileFields(profile: Profile): number {
  const canonicalCount = Object.keys(profile.fields ?? {}).length;
  const customCount = profile.custom?.length ?? 0;
  return canonicalCount + customCount;
}


