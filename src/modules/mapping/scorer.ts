import type { CanonicalKey } from '../../shared/types/profile';
import { matchSynonym } from './synonyms';

export type InputLike = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type ScoredKey = { key: CanonicalKey; score: number };

// Map HTML autocomplete tokens to canonical keys
const AUTOCOMPLETE_MAP: Record<string, CanonicalKey> = {
  name: 'fullName',
  'given-name': 'firstName',
  'additional-name': 'middleName',
  'family-name': 'lastName',
  email: 'emailPrimary',
  tel: 'phonePrimary',
  'tel-national': 'phonePrimary',
  'tel-country-code': 'phonePrimary',
  'street-address': 'addressLine1',
  'address-line1': 'addressLine1',
  'address-line2': 'addressLine2',
  country: 'country',
  'country-name': 'country',
  'postal-code': 'postalCode',
  'address-level1': 'region',
  'address-level2': 'city',
  organization: 'company',
  'organization-title': 'position',
  url: 'website',
  sex: 'gender',
  bday: 'dateOfBirth',
  'bday-day': 'dateOfBirth',
  'bday-month': 'dateOfBirth',
  'bday-year': 'dateOfBirth',
};

export type FieldMeta = {
  labelText?: string;
  placeholder?: string;
  ariaLabel?: string;
  nearbyText?: string;
};

export function scoreElementToKey(el: InputLike, meta: FieldMeta): ScoredKey | null {
  let best: ScoredKey | null = null;

  const add = (key: CanonicalKey, points: number) => {
    if (!best || points > best.score) best = { key, score: points };
  };

  const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
  if (autocomplete && AUTOCOMPLETE_MAP[autocomplete]) {
    add(AUTOCOMPLETE_MAP[autocomplete], 10);
  }

  const type = (el as HTMLInputElement).type?.toLowerCase?.() || '';
  if (type === 'email') add('emailPrimary', 6);
  if (type === 'tel') add('phonePrimary', 6);
  if (type === 'url') add('website', 6);
  if (type === 'date') add('dateOfBirth', 3);
  if (type === 'password') add('password', 8);

  const attrs = [
    (el.getAttribute('name') || '').toLowerCase(),
    (el.getAttribute('id') || '').toLowerCase(),
    (el.getAttribute('class') || '').toLowerCase(),
  ].join(' ');
  const textHaystack = [
    meta.labelText?.toLowerCase() || '',
    meta.placeholder?.toLowerCase() || '',
    meta.ariaLabel?.toLowerCase() || '',
    meta.nearbyText?.toLowerCase() || '',
  ]
    .filter(Boolean)
    .join(' ');

  const fromAttrs = matchSynonym(attrs);
  if (fromAttrs) add(fromAttrs, 5);

  const fromText = matchSynonym(textHaystack);
  if (fromText) add(fromText, 4);

  return best;
}


