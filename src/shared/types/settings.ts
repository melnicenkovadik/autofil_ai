import { z } from 'zod';

export const AiModelEnum = z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4o-turbo']);
export type AiModel = z.infer<typeof AiModelEnum>;

export const ThemeEnum = z.enum(['light', 'dark', 'auto']);
export type Theme = z.infer<typeof ThemeEnum>;

export const LanguageEnum = z.enum([
  'en',
  'ru',
  'uk',
  'zh',
  'es',
  'hi',
  'ar',
  'id',
  'pt',
  'fr',
  'de',
  'ja',
  'it',
  'pl',
  'be',
]);
export type Language = z.infer<typeof LanguageEnum>;

export const SettingsSchema = z.object({
  unlockMinutes: z.number().int().min(1).max(120).default(15),
  unlockedUntil: z.number().nullable().default(null),
  lockEnabled: z.boolean().default(false),
  aiEnabled: z.boolean().default(false),
  openaiApiKey: z.string().optional(),
  aiModel: AiModelEnum.default('gpt-4o-mini'),
  theme: ThemeEnum.default('dark'),
  language: LanguageEnum.default('en'),
});

export type Settings = z.infer<typeof SettingsSchema>;


