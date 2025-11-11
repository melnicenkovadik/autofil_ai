import { getStorage, setStorage } from '../storage';
import type { DomainRulesState, FieldRule } from '../../shared/types/domain-rules';
import { DomainRulesStateSchema } from '../../shared/types/domain-rules';
import type { CanonicalKey } from '../../shared/types/profile';

const STORAGE_KEY = 'domain_rules_v1';

export async function loadDomainRules(): Promise<DomainRulesState> {
  const data = await getStorage<unknown>(STORAGE_KEY);
  const parsed = DomainRulesStateSchema.safeParse(data);
  
  if (parsed.success) {
    return parsed.data;
  }
  
  const defaultState: DomainRulesState = { rules: {} };
  await setStorage(STORAGE_KEY, defaultState);
  return defaultState;
}

export async function saveDomainRules(state: DomainRulesState): Promise<void> {
  await setStorage(STORAGE_KEY, state);
}

/**
 * Get domain from URL
 */
export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Get rules for a specific domain
 */
export async function getDomainRulesForUrl(url: string): Promise<FieldRule[]> {
  const domain = getDomainFromUrl(url);
  if (!domain) return [];
  
  const state = await loadDomainRules();
  return state.rules[domain] || [];
}

/**
 * Record a field rule for a domain
 */
export async function recordFieldForDomain(
  url: string,
  selector: string,
  canonicalKey: CanonicalKey
): Promise<void> {
  const domain = getDomainFromUrl(url);
  if (!domain) return;
  
  const state = await loadDomainRules();
  
  if (!state.rules[domain]) {
    state.rules[domain] = [];
  }
  
  // Check if rule already exists
  const existing = state.rules[domain].find((r) => r.selector === selector);
  if (existing) {
    existing.canonicalKey = canonicalKey;
  } else {
    state.rules[domain].push({ selector, canonicalKey });
  }
  
  await saveDomainRules(state);
}

/**
 * Clear rules for a specific domain
 */
export async function clearDomainRules(domain: string): Promise<void> {
  const state = await loadDomainRules();
  delete state.rules[domain];
  await saveDomainRules(state);
}

/**
 * Clear all domain rules
 */
export async function clearAllDomainRules(): Promise<void> {
  await saveDomainRules({ rules: {} });
}

/**
 * Get all domains with rules
 */
export async function getAllDomains(): Promise<string[]> {
  const state = await loadDomainRules();
  return Object.keys(state.rules);
}

