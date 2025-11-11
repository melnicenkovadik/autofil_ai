import type { CanonicalKey } from '../../shared/types/profile';

type Synonym = { key: CanonicalKey; patterns: RegExp[] };

export const SYNONYMS: Synonym[] = [
  { key: 'firstName', patterns: [/^first$/, /first[_\s-]?name/i, /\bgiven\b/i, /\bfname\b/i, /\bgivenname\b/i] },
  { key: 'lastName', patterns: [/^last$/, /last[_\s-]?name/i, /\bsurname\b/i, /\blname\b/i, /\bfamily\b/i] },
  { key: 'middleName', patterns: [/^middle$/, /middle[_\s-]?name/i, /\bpatronymic\b/i] },
  { key: 'fullName', patterns: [/^name$/i, /\bfullname\b/i, /\bdisplayname\b/i] },
  { key: 'emailPrimary', patterns: [/^email$/i, /\bemail[_\s-]?address\b/i, /\bmail\b/i] },
  { key: 'emailAlt', patterns: [/\balternate[_\s-]?email\b/i, /\bbackup[_\s-]?email\b/i] },
  { key: 'phonePrimary', patterns: [/^phone$/i, /\bphone[_\s-]?number\b/i, /\bmobile\b/i, /\btel\b/i] },
  { key: 'phoneAlt', patterns: [/\balternate[_\s-]?phone\b/i, /\bbackup[_\s-]?phone\b/i] },
  { key: 'company', patterns: [/^company$/i, /\borg(anization)?\b/i, /\bemployer\b/i] },
  { key: 'position', patterns: [/^position$/i, /\btitle\b/i, /\bjob\b/i, /\brole\b/i] },
  { key: 'country', patterns: [/^country$/i, /\bnation\b/i] },
  { key: 'region', patterns: [/^region$/i, /\bstate\b/i, /\bprovince\b/i, /\boblast\b/i] },
  { key: 'city', patterns: [/^city$/i, /\ntown\b/i, /\blocality\b/i] },
  { key: 'postalCode', patterns: [/^zip$/i, /\bpostal[_\s-]?code\b/i, /\bpostcode\b/i] },
  { key: 'addressLine1', patterns: [/\baddress[_\s-]?line1\b/i, /\bstreet\b/i, /\baddr1\b/i] },
  { key: 'addressLine2', patterns: [/\baddress[_\s-]?line2\b/i, /\bapt\b/i, /\bsuite\b/i, /\baddr2\b/i] },
  { key: 'website', patterns: [/^website$/i, /\bsite\b/i, /\burl\b/i] },
  { key: 'telegram', patterns: [/telegram/i, /\btg\b/i] },
  { key: 'linkedin', patterns: [/linkedin/i] },
  { key: 'github', patterns: [/github/i] },
  { key: 'dateOfBirth', patterns: [/birth/i, /\bdob\b/i, /\bbirthday\b/i] },
  { key: 'gender', patterns: [/gender/i, /\bsex\b/i] },
  { key: 'password', patterns: [/password/i, /passcode/i, /pwd/i] },
];

export function matchSynonym(text: string): CanonicalKey | null {
  for (const s of SYNONYMS) {
    if (s.patterns.some((re) => re.test(text))) return s.key;
  }
  return null;
}


