import { z } from 'zod';

export const CanonicalKeyEnum = z.enum([
  'fullName',
  'firstName',
  'lastName',
  'middleName',
  'emailPrimary',
  'emailAlt',
  'phonePrimary',
  'phoneAlt',
  'country',
  'region',
  'city',
  'postalCode',
  'addressLine1',
  'addressLine2',
  'company',
  'position',
  'website',
  'telegram',
  'linkedin',
  'github',
  'dateOfBirth',
  'gender',
  'password',
]);

export type CanonicalKey = z.infer<typeof CanonicalKeyEnum>;

export const CustomFieldSchema = z.object({
  key: z.string().min(1),
  type: z.enum(['text', 'email', 'tel', 'date', 'url', 'multiline', 'file']),
  value: z.string().default(''),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
});
export type CustomField = z.infer<typeof CustomFieldSchema>;

const canonicalFieldShape = CanonicalKeyEnum.options.reduce(
  (shape, key) => {
    shape[key as CanonicalKey] = z.string().default('');
    return shape;
  },
  {} as Record<CanonicalKey, z.ZodDefault<z.ZodString>>,
);

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  fields: z.object(canonicalFieldShape).partial().default({}),
  custom: z.array(CustomFieldSchema).optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfilesStateSchema = z.object({
  activeProfileId: z.string().nullable(),
  profiles: z.array(ProfileSchema),
});
export type ProfilesState = z.infer<typeof ProfilesStateSchema>;


