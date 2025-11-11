import { z } from 'zod';

export const AiModelEnum = z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4o-turbo']);
export type AiModel = z.infer<typeof AiModelEnum>;

export const SettingsSchema = z.object({
  unlockMinutes: z.number().int().min(1).max(120).default(15),
  unlockedUntil: z.number().nullable().default(null),
  lockEnabled: z.boolean().default(false),
  aiEnabled: z.boolean().default(false),
  openaiApiKey: z.string().optional(),
  aiModel: AiModelEnum.default('gpt-4o-mini'),
});

export type Settings = z.infer<typeof SettingsSchema>;


