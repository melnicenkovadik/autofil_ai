import React, { useEffect, useState } from 'react';
import { Stack, NumberInput, Switch, PasswordInput, Select, Button, Card, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { loadSettings, saveSettings } from '@modules/unlock';
import type { Settings, AiModel } from '@shared/types/settings';

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await loadSettings();
    setSettings(data);
  };

  const handleSave = async () => {
    if (!settings) return;
    await saveSettings(settings);
    notifications.show({ message: 'Settings saved', color: 'green' });
  };

  if (!settings) return <Text>Loading...</Text>;

  return (
    <Stack gap="md" style={{ width: '100%', maxWidth: '800px' }}>
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            Security
          </Text>

          <Switch
            label="Enable lock"
            description="Require unlocking before autofill can be used"
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
            label="Auto-lock timeout (minutes)"
            description="Extension will automatically lock after this period of inactivity"
            value={settings.unlockMinutes}
            onChange={(value) => setSettings({ ...settings, unlockMinutes: Number(value) || 15 })}
            min={1}
            max={120}
            disabled={!settings.lockEnabled}
          />
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            AI Classification
          </Text>

          <Switch
            label="Enable AI field classification"
            description="Use OpenAI to classify ambiguous form fields"
            checked={settings.aiEnabled}
            onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })}
          />

          {settings.aiEnabled && (
            <>
              <PasswordInput
                label="OpenAI API Key"
                description="Your API key is stored locally and never shared"
                value={settings.openaiApiKey || ''}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                placeholder="sk-..."
              />

              <Select
                label="AI Model"
                description="Choose the OpenAI model for classification"
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
        Save Settings
      </Button>
    </Stack>
  );
}

