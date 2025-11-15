import React, { useEffect, useState } from 'react';
import { Stack, NumberInput, Switch, PasswordInput, Select, Button, Card, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { loadSettings, saveSettings } from '@modules/unlock';
import { applyTheme } from '@shared/utils/theme';
import type { Settings, AiModel, Theme, Language } from '@shared/types/settings';

export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language, i18n]);

  const loadData = async () => {
    const data = await loadSettings();
    setSettings(data);
    if (data.language) {
      i18n.changeLanguage(data.language);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    await saveSettings(settings);
    notifications.show({ message: t('settings.saved'), color: 'green' });
  };

  const handleThemeChange = async (theme: Theme) => {
    if (!settings) return;
    const updatedSettings = { ...settings, theme };
    setSettings(updatedSettings);
    // Save immediately
    await saveSettings({ theme });
    // Apply theme immediately
    applyTheme(theme);
    // Update MantineProvider by triggering a re-render
    window.dispatchEvent(new Event('themechange'));
  };

  const handleLanguageChange = async (language: Language) => {
    if (!settings) return;
    const updatedSettings = { ...settings, language };
    setSettings(updatedSettings);
    // Save immediately
    await saveSettings({ language });
    // Change language immediately
    i18n.changeLanguage(language);
  };

  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme);
    }
  }, [settings?.theme]);

  if (!settings) return <Text>{t('common.loading')}</Text>;

  return (
    <Stack gap="md" style={{ width: '100%', maxWidth: '800px' }}>
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            {t('settings.appSettings')}
          </Text>

          <Select
            label={t('settings.theme')}
            description={t('settings.themeDescription')}
            value={settings.theme}
            onChange={(value) => handleThemeChange((value as Theme) || 'light')}
            data={[
              { value: 'light', label: t('theme.light') },
              { value: 'dark', label: t('theme.dark') },
              { value: 'auto', label: t('theme.auto') },
            ]}
          />

          <Select
            label={t('settings.language')}
            description={t('settings.languageDescription')}
            value={settings.language}
            onChange={(value) => handleLanguageChange((value as Language) || 'en')}
            data={[
              { value: 'en', label: t('language.en') },
              { value: 'ru', label: t('language.ru') },
              { value: 'uk', label: t('language.uk') },
              { value: 'zh', label: t('language.zh') },
              { value: 'es', label: t('language.es') },
              { value: 'hi', label: t('language.hi') },
              { value: 'ar', label: t('language.ar') },
              { value: 'id', label: t('language.id') },
              { value: 'pt', label: t('language.pt') },
              { value: 'fr', label: t('language.fr') },
              { value: 'de', label: t('language.de') },
              { value: 'ja', label: t('language.ja') },
              { value: 'it', label: t('language.it') },
              { value: 'pl', label: t('language.pl') },
              { value: 'be', label: t('language.be') },
            ]}
          />
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            {t('settings.security')}
          </Text>

          <Switch
            label={t('settings.enableLock')}
            description={t('settings.lockDescription')}
            checked={settings.lockEnabled}
            onChange={(event) =>
              setSettings({
                ...settings,
                lockEnabled: event.currentTarget.checked,
                unlockedUntil: event.currentTarget.checked ? settings.unlockedUntil : null,
              })
            }
          />

          <NumberInput
            label={t('settings.autoLockTimeout')}
            description={t('settings.autoLockDescription')}
            value={settings.unlockMinutes}
            onChange={(value) => setSettings({ ...settings, unlockMinutes: Number(value) || 15 })}
            min={1}
            max={120}
            disabled={!settings.lockEnabled}
          />

          <Text fw={500}>{t('settings.encryptionTitle')}</Text>
          <Text size="sm" c="dimmed">
            {t('settings.encryptionDescription')}
          </Text>
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            {t('settings.ai')}
          </Text>

          <Switch
            label={t('settings.enableAI')}
            description={t('settings.aiDescription')}
            checked={settings.aiEnabled}
            onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })}
          />

          {settings.aiEnabled && (
            <>
              <PasswordInput
                label={t('settings.openaiKey')}
                description={t('settings.openaiKeyDescription')}
                value={settings.openaiApiKey || ''}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                placeholder="sk-..."
              />

              <Select
                label={t('settings.aiModel')}
                description={t('settings.aiModelDescription')}
                data={[
                  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
                  { value: 'gpt-4o', label: 'GPT-4o (Balanced)' },
                  { value: 'gpt-4o-turbo', label: 'GPT-4o Turbo (Most Capable)' },
                ]}
                value={settings.aiModel}
                onChange={(value) => setSettings({ ...settings, aiModel: (value as AiModel) || 'gpt-4o-mini' })}
              />
            </>
          )}
        </Stack>
      </Card>

      <Button onClick={handleSave} size="md">
        {t('settings.save')}
      </Button>
    </Stack>
  );
}

