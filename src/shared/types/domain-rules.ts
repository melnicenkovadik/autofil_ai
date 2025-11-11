import { z } from 'zod';
import { CanonicalKeyEnum } from './profile';

export const FieldRuleSchema = z.object({
  selector: z.string().min(1),
  canonicalKey: CanonicalKeyEnum,
});

export type FieldRule = z.infer<typeof FieldRuleSchema>;

export const DomainRulesSchema = z.record(z.string(), z.array(FieldRuleSchema));

export type DomainRules = z.infer<typeof DomainRulesSchema>;

export const DomainRulesStateSchema = z.object({
  rules: DomainRulesSchema.default({}),
});

export type DomainRulesState = z.infer<typeof DomainRulesStateSchema>;

