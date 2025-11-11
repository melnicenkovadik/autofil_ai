import type { FieldContext, AiClassifierResponse } from '../../shared/types/messages';
import type { Settings } from '../../shared/types/settings';
import { logger } from '../../shared/utils/logger';

const AI_TIMEOUT = 3000;

/**
 * Classify a field using OpenAI API
 */
export async function classifyField(
  context: FieldContext,
  settings: Settings
): Promise<AiClassifierResponse> {
  if (!settings.aiEnabled || !settings.openaiApiKey) {
    return { ok: false, error: 'AI disabled or no API key' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const prompt = buildClassifierPrompt(context);
    const model = settings.aiModel || 'gpt-4o-mini';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Return ONLY a single canonical key token, nothing else. If uncertain, return "unknown".',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      logger.warn('AI classification failed', res.status);
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const json = (await res.json()) as any;
    const content: string | undefined = json?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { ok: false, error: 'Empty AI response' };
    }

    // Normalize output (strip code formatting/newlines)
    const key = content.replace(/[`"'\n\r\s]/g, '');

    if (key === 'unknown' || key === '') {
      return { ok: false, error: 'AI returned unknown' };
    }

    return { ok: true, key: key as any };
  } catch (e) {
    clearTimeout(timeout);
    logger.warn('AI classification error', e);
    return { ok: false, error: e instanceof Error ? e.message : 'AI error' };
  }
}

function buildClassifierPrompt(ctx: FieldContext): string {
  const canonical = [
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
  ].join(', ');

  const lines = [
    `Canonical keys: [${canonical}]`,
    `Choose the best matching key for a web form field.`,
    `Return ONLY the key. If unknown, return "unknown".`,
    `Context:`,
    `tag=${ctx.tag || ''}`,
    `type=${ctx.type || ''}`,
    `autocomplete=${ctx.autocomplete || ''}`,
    `name=${ctx.name || ''}`,
    `id=${ctx.id || ''}`,
    `class=${ctx.className || ''}`,
    `label=${ctx.label || ''}`,
    `placeholder=${ctx.placeholder || ''}`,
    `ariaLabel=${ctx.ariaLabel || ''}`,
    `nearbyText=${(ctx.nearbyText || '').slice(0, 80)}`,
  ];

  return lines.join('\n');
}

