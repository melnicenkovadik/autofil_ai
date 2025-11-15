import type { CanonicalKey } from '../types/profile';

export type CanonicalFieldDefinition = {
  key: CanonicalKey;
  label: string;
  group: string;
};

export const CANONICAL_FIELDS: CanonicalFieldDefinition[] = [
  { key: 'fullName', label: 'Full Name', group: 'Personal' },
  { key: 'firstName', label: 'First Name', group: 'Personal' },
  { key: 'lastName', label: 'Last Name', group: 'Personal' },
  { key: 'middleName', label: 'Middle Name', group: 'Personal' },
  { key: 'emailPrimary', label: 'Primary Email', group: 'Contact' },
  { key: 'emailAlt', label: 'Alternate Email', group: 'Contact' },
  { key: 'phonePrimary', label: 'Primary Phone', group: 'Contact' },
  { key: 'phoneAlt', label: 'Alternate Phone', group: 'Contact' },
  { key: 'country', label: 'Country', group: 'Address' },
  { key: 'region', label: 'Region/State', group: 'Address' },
  { key: 'city', label: 'City', group: 'Address' },
  { key: 'postalCode', label: 'Postal Code', group: 'Address' },
  { key: 'addressLine1', label: 'Address Line 1', group: 'Address' },
  { key: 'addressLine2', label: 'Address Line 2', group: 'Address' },
  { key: 'company', label: 'Company', group: 'Work' },
  { key: 'position', label: 'Position', group: 'Work' },
  { key: 'website', label: 'Website', group: 'Social' },
  { key: 'telegram', label: 'Telegram', group: 'Social' },
  { key: 'linkedin', label: 'LinkedIn', group: 'Social' },
  { key: 'github', label: 'GitHub', group: 'Social' },
  { key: 'dateOfBirth', label: 'Date of Birth', group: 'Other' },
  { key: 'gender', label: 'Gender', group: 'Other' },
  { key: 'password', label: 'Password', group: 'Security' },
];

/**
 * Get translated canonical fields
 * For React components, use useTranslation hook and call this function
 * For non-React contexts, use getTranslation from i18n-content
 */
export function getTranslatedCanonicalFields(
  t: (key: string) => string
): CanonicalFieldDefinition[] {
  return CANONICAL_FIELDS.map(field => ({
    key: field.key,
    label: t(`fields.${field.key}`),
    group: t(`fields.groups.${field.group}`),
  }));
}
