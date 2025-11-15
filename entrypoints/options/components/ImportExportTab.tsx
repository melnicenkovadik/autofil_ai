import React, { useState } from 'react';
import { Stack, Card, Text, Button, Radio, FileInput, Group, Textarea, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { loadProfilesState, saveProfilesState } from '@modules/profiles';
import { loadSettings, saveSettings } from '@modules/unlock';
import type { ProfilesState } from '@shared/types/profile';
import type { Settings } from '@shared/types/settings';

type ExportData = {
  version: string;
  profiles: ProfilesState;
  settings: Settings;
};

export default function ImportExportTab() {
  const { t } = useTranslation();
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('append');
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState<string>('');

  const getExportData = async (): Promise<ExportData> => {
    const profiles = await loadProfilesState();
    const settings = await loadSettings();

    return {
      version: '1.0',
      profiles,
      settings,
    };
  };

  const handleExport = async () => {
    try {
      const exportData = await getExportData();

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autofill-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      notifications.show({ message: t('backup.exported'), color: 'green' });
    } catch {
      notifications.show({ message: t('backup.exportFailed'), color: 'red' });
    }
  };

  const handleCopy = async () => {
    try {
      const exportData = await getExportData();
      const jsonString = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      notifications.show({ message: t('backup.copiedToClipboard'), color: 'green' });
    } catch {
      notifications.show({ message: t('backup.copyFailed'), color: 'red' });
    }
  };

  const processImport = async (text: string) => {
    try {
      const importData: ExportData = JSON.parse(text);

      if (!importData.profiles || !importData.settings) {
        throw new Error('Invalid data format');
      }

      if (importMode === 'overwrite') {
        // Replace all profiles
        await saveProfilesState(importData.profiles);
        notifications.show({ message: t('backup.profilesOverwritten'), color: 'green' });
      } else {
        // Append profiles
        const currentState = await loadProfilesState();
        const mergedProfiles = [...currentState.profiles, ...importData.profiles.profiles];
        await saveProfilesState({
          ...currentState,
          profiles: mergedProfiles,
        });
        notifications.show({ message: t('backup.profilesImported', { count: importData.profiles.profiles.length }), color: 'green' });
      }

      // Import all settings (replace completely to ensure all keys are updated)
      const settingsKeys = Object.keys(importData.settings) as Array<keyof Settings>;
      const settingsUpdate: Partial<Settings> = {};
      for (const key of settingsKeys) {
        settingsUpdate[key] = importData.settings[key];
      }
      await saveSettings(settingsUpdate);
      notifications.show({ message: t('backup.settingsImported'), color: 'green' });

      setFile(null);
      setJsonText('');
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      notifications.show({ message: t('backup.importFailedInvalid'), color: 'red' });
    }
  };

  const handleImportFromFile = async () => {
    if (!file) {
      notifications.show({ message: t('backup.pleaseSelectFile'), color: 'red' });
      return;
    }

    const text = await file.text();
    await processImport(text);
  };

  const handleImportFromText = async () => {
    if (!jsonText.trim()) {
      notifications.show({ message: t('backup.pleasePasteJson'), color: 'red' });
      return;
    }

    await processImport(jsonText);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      notifications.show({ message: t('backup.pastedFromClipboard'), color: 'blue' });
    } catch {
      notifications.show({ message: t('backup.failedToReadClipboard'), color: 'red' });
    }
  };

  return (
    <Stack gap="md" style={{ width: '100%', maxWidth: '800px' }}>
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            {t('backup.exportData')}
          </Text>
          <Text size="sm" c="dimmed">
            {t('backup.exportDescription')}
          </Text>
          <Group>
            <Button onClick={handleExport}>{t('backup.exportAllData')}</Button>
            <Button onClick={handleCopy} variant="light">{t('backup.exportToClipboard')}</Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            {t('backup.importData')}
          </Text>
          <Text size="sm" c="dimmed">
            {t('backup.importDescription')}
          </Text>

          <Radio.Group value={importMode} onChange={(value) => setImportMode(value as any)} label={t('backup.importMode')}>
            <Stack gap="xs" mt="xs">
              <Radio value="append" label={t('backup.append')} />
              <Radio value="overwrite" label={t('backup.overwrite')} />
            </Stack>
          </Radio.Group>

          <Divider label={t('backup.fromFile')} labelPosition="center" my="md" />

          <FileInput
            label={t('backup.selectBackupFile')}
            placeholder={t('backup.chooseJsonFile')}
            accept="application/json"
            value={file}
            onChange={setFile}
          />

          <Button onClick={handleImportFromFile} disabled={!file}>
            {t('backup.importFromFileButton')}
          </Button>

          <Divider label={t('backup.orPasteJson')} labelPosition="center" my="md" />

          <Textarea
            label={t('backup.pasteJsonData')}
            placeholder={t('backup.pasteJsonPlaceholder')}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            minRows={6}
            maxRows={12}
            styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
          />

          <Group>
            <Button onClick={handlePasteFromClipboard} variant="light">
              {t('backup.pasteFromClipboard')}
            </Button>
            <Button onClick={handleImportFromText} disabled={!jsonText.trim()}>
              {t('backup.importFromJson')}
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

