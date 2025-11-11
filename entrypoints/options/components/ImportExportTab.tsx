import React, { useState } from 'react';
import { Stack, Card, Text, Button, Radio, FileInput, Group, Textarea, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
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

      notifications.show({ message: 'Data exported successfully', color: 'green' });
    } catch {
      notifications.show({ message: 'Export failed', color: 'red' });
    }
  };

  const handleCopy = async () => {
    try {
      const exportData = await getExportData();
      const jsonString = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      notifications.show({ message: 'Copied to clipboard', color: 'green' });
    } catch {
      notifications.show({ message: 'Copy failed', color: 'red' });
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
        notifications.show({ message: 'Profiles overwritten', color: 'green' });
      } else {
        // Append profiles
        const currentState = await loadProfilesState();
        const mergedProfiles = [...currentState.profiles, ...importData.profiles.profiles];
        await saveProfilesState({
          ...currentState,
          profiles: mergedProfiles,
        });
        notifications.show({ message: `${importData.profiles.profiles.length} profile(s) imported`, color: 'green' });
      }

      // Import all settings (replace completely to ensure all keys are updated)
      const settingsKeys = Object.keys(importData.settings) as Array<keyof Settings>;
      const settingsUpdate: Partial<Settings> = {};
      for (const key of settingsKeys) {
        settingsUpdate[key] = importData.settings[key];
      }
      await saveSettings(settingsUpdate);
      notifications.show({ message: 'Settings imported', color: 'green' });

      setFile(null);
      setJsonText('');
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      notifications.show({ message: 'Import failed: Invalid file format', color: 'red' });
    }
  };

  const handleImportFromFile = async () => {
    if (!file) {
      notifications.show({ message: 'Please select a file', color: 'red' });
      return;
    }

    const text = await file.text();
    await processImport(text);
  };

  const handleImportFromText = async () => {
    if (!jsonText.trim()) {
      notifications.show({ message: 'Please paste JSON data', color: 'red' });
      return;
    }

    await processImport(jsonText);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      notifications.show({ message: 'Pasted from clipboard', color: 'blue' });
    } catch {
      notifications.show({ message: 'Failed to read clipboard', color: 'red' });
    }
  };

  return (
    <Stack gap="md" style={{ width: '100%', maxWidth: '800px' }}>
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            Export Data
          </Text>
          <Text size="sm" c="dimmed">
            Download all your profiles, settings (including API key), and custom fields
          </Text>
          <Group>
            <Button onClick={handleExport}>Export All Data</Button>
            <Button onClick={handleCopy} variant="light">Copy to Clipboard</Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Stack gap="sm">
          <Text fw={600} size="lg">
            Import Data
          </Text>
          <Text size="sm" c="dimmed">
            Import profiles and settings from a backup file or paste JSON
          </Text>

          <Radio.Group value={importMode} onChange={(value) => setImportMode(value as any)} label="Import mode">
            <Stack gap="xs" mt="xs">
              <Radio value="append" label="Append - Add imported profiles to existing ones" />
              <Radio value="overwrite" label="Overwrite - Replace all existing profiles" />
            </Stack>
          </Radio.Group>

          <Divider label="From File" labelPosition="center" my="md" />

          <FileInput
            label="Select backup file"
            placeholder="Choose JSON file"
            accept="application/json"
            value={file}
            onChange={setFile}
          />

          <Button onClick={handleImportFromFile} disabled={!file}>
            Import from File
          </Button>

          <Divider label="Or Paste JSON" labelPosition="center" my="md" />

          <Textarea
            label="Paste JSON data"
            placeholder='{"version": "1.0", "profiles": {...}, "settings": {...}}'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            minRows={6}
            maxRows={12}
            styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
          />

          <Group>
            <Button onClick={handlePasteFromClipboard} variant="light">
              Paste from Clipboard
            </Button>
            <Button onClick={handleImportFromText} disabled={!jsonText.trim()}>
              Import from JSON
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

