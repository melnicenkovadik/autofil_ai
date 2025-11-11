import React, { useEffect, useState } from 'react';
import {
  Stack,
  Group,
  Button,
  Card,
  Text,
  TextInput,
  Textarea,
  Select,
  ActionIcon,
  Grid,
  Badge,
  FileInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  loadProfilesState,
  createProfile,
  updateProfile,
  deleteProfile,
  setActiveProfile,
} from '@modules/profiles';
import type { Profile, CustomField, CanonicalKey } from '@shared/types/profile';
import { CANONICAL_FIELDS } from '@shared/constants/canonical-fields';

export default function ProfilesTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const state = await loadProfilesState();
    setProfiles(state.profiles);
    setActiveProfileId(state.activeProfileId || state.profiles[0]?.id || null);
    if (state.profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(state.profiles[0]);
    }
  };

  const handleCreateProfile = async () => {
    const profile = await createProfile({ name: `Profile ${profiles.length + 1}` });
    notifications.show({ message: 'Profile created', color: 'green' });
    await loadData();
    setSelectedProfile(profile);
  };

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
  };

  const handleSaveProfile = async () => {
    if (!selectedProfile) return;
    await updateProfile(selectedProfile.id, selectedProfile);
    notifications.show({ message: 'Profile saved', color: 'green' });
    await loadData();
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile || profiles.length === 1) {
      notifications.show({ message: 'Cannot delete the last profile', color: 'red' });
      return;
    }
    await deleteProfile(selectedProfile.id);
    notifications.show({ message: 'Profile deleted', color: 'green' });
    await loadData();
    setSelectedProfile(profiles[0] || null);
  };

  const handleSetActive = async (profileId: string) => {
    await setActiveProfile(profileId);
    setActiveProfileId(profileId);
    notifications.show({ message: 'Active profile updated', color: 'green' });
  };

  const handleFieldChange = (key: CanonicalKey, value: string) => {
    if (!selectedProfile) return;
    setSelectedProfile({
      ...selectedProfile,
      fields: { ...selectedProfile.fields, [key]: value },
    });
  };

  const handleAddCustomField = () => {
    if (!selectedProfile) return;
    const custom = selectedProfile.custom || [];
    setSelectedProfile({
      ...selectedProfile,
      custom: [...custom, { key: '', type: 'text', value: '' }],
    });
  };

  const handleRemoveCustomField = (index: number) => {
    if (!selectedProfile) return;
    const custom = selectedProfile.custom || [];
    setSelectedProfile({
      ...selectedProfile,
      custom: custom.filter((_, i) => i !== index),
    });
  };

  const handleCustomFieldChange = (index: number, field: Partial<CustomField>) => {
    if (!selectedProfile) return;
    const custom = selectedProfile.custom || [];
    setSelectedProfile({
      ...selectedProfile,
      custom: custom.map((c, i) => (i === index ? { ...c, ...field } : c)),
    });
  };

  const handleFileUpload = async (index: number, file: File | null) => {
    if (!file || !selectedProfile) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_SIZE) {
      notifications.show({
        message: `File too large. Maximum size is 2 MB (current: ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        color: 'red',
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        handleCustomFieldChange(index, {
          value: base64,
          fileName: file.name,
          fileType: file.type,
        });
        notifications.show({ message: `File "${file.name}" uploaded`, color: 'green' });
      };
      reader.onerror = () => {
        notifications.show({ message: 'Failed to read file', color: 'red' });
      };
      reader.readAsDataURL(file);
    } catch {
      notifications.show({ message: 'Failed to upload file', color: 'red' });
    }
  };

  const groupedFields = CANONICAL_FIELDS.reduce((acc, field) => {
    if (!acc[field.group]) acc[field.group] = [];
    acc[field.group].push(field);
    return acc;
  }, {} as Record<string, typeof CANONICAL_FIELDS>);

  return (
    <Grid>
      <Grid.Col span={4}>
        <Stack gap="sm">
          <Button onClick={handleCreateProfile} fullWidth>
            Create New Profile
          </Button>

          {profiles.map((profile) => (
            <Card
              key={profile.id}
              padding="sm"
              withBorder
              style={{
                cursor: 'pointer',
                backgroundColor: selectedProfile?.id === profile.id ? 'var(--mantine-color-blue-light)' : undefined,
              }}
              onClick={() => handleSelectProfile(profile)}
            >
              <Group justify="space-between">
                <Text fw={500}>{profile.name}</Text>
                {activeProfileId === profile.id && <Badge size="xs">Active</Badge>}
              </Group>
            </Card>
          ))}
        </Stack>
      </Grid.Col>

      <Grid.Col span={8}>
        {selectedProfile ? (
          <Stack gap="md">
            <Card withBorder padding="md">
              <Stack gap="sm">
                <TextInput
                  label="Profile Name"
                  value={selectedProfile.name}
                  onChange={(e) => setSelectedProfile({ ...selectedProfile, name: e.target.value })}
                />

                <Group>
                  <Button onClick={handleSaveProfile}>Save Profile</Button>
                  {activeProfileId !== selectedProfile.id && (
                    <Button variant="light" onClick={() => handleSetActive(selectedProfile.id)}>
                      Set as Active
                    </Button>
                  )}
                  <Button color="red" variant="light" onClick={handleDeleteProfile}>
                    Delete
                  </Button>
                </Group>
              </Stack>
            </Card>

            {Object.entries(groupedFields).map(([group, fields]) => (
              <Card key={group} withBorder padding="md">
                <Text fw={600} mb="sm">
                  {group}
                </Text>
                <Stack gap="xs">
                  {fields.map((field) => (
                    <TextInput
                      key={field.key}
                      label={field.label}
                      value={selectedProfile.fields[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      size="sm"
                    />
                  ))}
                </Stack>
              </Card>
            ))}

            <Card withBorder padding="md">
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Custom Fields</Text>
                <Button size="xs" onClick={handleAddCustomField}>
                  Add Field
                </Button>
              </Group>

              <Stack gap="xs">
                {(selectedProfile.custom || []).map((custom, index) => (
                  <Group key={index} gap="xs" align="end">
                    <TextInput
                      label="Field Name"
                      placeholder="e.g., VAT Number"
                      value={custom.key}
                      onChange={(e) => handleCustomFieldChange(index, { key: e.target.value })}
                      style={{ flex: 1 }}
                      size="sm"
                    />
                    <Select
                      label="Type"
                      data={[
                        { value: 'text', label: 'Text' },
                        { value: 'email', label: 'Email' },
                        { value: 'tel', label: 'Phone' },
                        { value: 'date', label: 'Date' },
                        { value: 'url', label: 'URL' },
                        { value: 'multiline', label: 'Multiline' },
                        { value: 'file', label: 'File' },
                      ]}
                      value={custom.type}
                      onChange={(value) => handleCustomFieldChange(index, { type: value as any })}
                      style={{ width: 120 }}
                      size="sm"
                    />
                    {custom.type === 'multiline' ? (
                      <Textarea
                        placeholder="Value"
                        value={custom.value}
                        onChange={(e) => handleCustomFieldChange(index, { value: e.target.value })}
                        style={{ flex: 2 }}
                        size="sm"
                        rows={2}
                      />
                    ) : custom.type === 'file' ? (
                      <div style={{ flex: 2 }}>
                        <FileInput
                          placeholder={custom.fileName || 'Upload file (max 2 MB)'}
                          accept="*/*"
                          onChange={(file) => handleFileUpload(index, file)}
                          size="sm"
                        />
                        {custom.fileName && (
                          <Text size="xs" c="dimmed" mt={4}>
                            Current: {custom.fileName} ({((custom.value?.length || 0) * 0.75 / 1024).toFixed(0)} KB)
                          </Text>
                        )}
                      </div>
                    ) : (
                      <TextInput
                        placeholder="Value"
                        value={custom.value}
                        onChange={(e) => handleCustomFieldChange(index, { value: e.target.value })}
                        style={{ flex: 2 }}
                        size="sm"
                      />
                    )}
                    <ActionIcon color="red" onClick={() => handleRemoveCustomField(index)} size="lg">
                      ×
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Stack>
        ) : (
          <Text c="dimmed">Select a profile to edit</Text>
        )}
      </Grid.Col>
    </Grid>
  );
}

