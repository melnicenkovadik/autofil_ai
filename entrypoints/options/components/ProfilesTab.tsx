import React, { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Group,
  Button,
  Card,
  Text,
  TextInput,
  Textarea,
  Select,
  Badge,
  ScrollArea,
  Table,
  Modal,
  ActionIcon,
  Tabs,
  Box,
  Tooltip,
  FileInput,
} from '@mantine/core';
import { IconPlus, IconTrash, IconCopy, IconChevronDown, IconSearch, IconStar, IconPencil } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import {
  loadProfilesState,
  createProfile,
  updateProfile,
  deleteProfile,
  setActiveProfile,
  duplicateProfile,
} from '@modules/profiles';
import type { Profile, CanonicalKey } from '@shared/types/profile';
import { getTranslatedCanonicalFields } from '@shared/constants/canonical-fields';

type FieldRow = {
  key: string;
  label: string;
  value: string;
  type: string;
  isCanonical: boolean;
  canonicalKey?: CanonicalKey;
  customIndex?: number;
};

export default function ProfilesTab() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [profileSelectorOpened, setProfileSelectorOpened] = useState(false);
  const [editNameModalOpened, setEditNameModalOpened] = useState(false);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [editingProfileName, setEditingProfileName] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const state = await loadProfilesState();
    setProfiles(state.profiles);
    const activeId = state.activeProfileId || state.profiles[0]?.id || null;
    setActiveProfileId(activeId);
    
    if (state.profiles.length > 0 && !selectedProfile) {
      const activeProfile = state.profiles.find(p => p.id === activeId) || state.profiles[0];
      if (activeProfile) {
        setSelectedProfile(activeProfile);
      }
    }
  };

  const handleCreateProfile = async () => {
    const profile = await createProfile({ name: `${t('profiles.title')} ${profiles.length + 1}` });
    notifications.show({ message: t('profiles.profileCreated'), color: 'green' });
    await loadData();
    setSelectedProfile(profile);
  };

  const handleSelectProfile = async (profile: Profile) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setSelectedProfile(profile);
    // Auto-activate when switching profiles
    if (profile.id !== activeProfileId) {
      await handleSetActive(profile.id);
    }
  };

  const autoSaveProfile = async (profile: Profile) => {
    await updateProfile(profile.id, profile);
    notifications.show({ message: t('profiles.changesSaved'), color: 'green', autoClose: 2000 });
    await loadData();
  };

  const handleOpenEditNameModal = () => {
    if (!selectedProfile) return;
    setEditingProfileName(selectedProfile.name);
    setEditNameModalOpened(true);
  };

  useEffect(() => {
    if (editNameModalOpened && editNameInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        editNameInputRef.current?.focus();
        editNameInputRef.current?.select();
      }, 100);
    }
  }, [editNameModalOpened]);

  const handleSaveProfileName = async () => {
    if (!selectedProfile || !editingProfileName.trim()) {
      notifications.show({ message: t('profiles.profileNameRequired'), color: 'red' });
      return;
    }
    
    const updatedProfile = { ...selectedProfile, name: editingProfileName.trim() };
    await autoSaveProfile(updatedProfile);
    setEditNameModalOpened(false);
    notifications.show({ message: t('profiles.profileSaved'), color: 'green' });
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile || profiles.length === 1) {
      notifications.show({ message: t('profiles.cannotDeleteLast'), color: 'red' });
      return;
    }
    setDeleteModalOpened(false);
    await deleteProfile(selectedProfile.id);
    notifications.show({ message: t('profiles.profileDeleted'), color: 'green' });
    
    // Reload data and select first profile
    const state = await loadProfilesState();
    setProfiles(state.profiles);
    const nextProfile = state.profiles[0] || null;
    if (nextProfile) {
      setSelectedProfile(nextProfile);
      setActiveProfileId(state.activeProfileId || nextProfile.id);
    }
  };

  const handleDuplicateProfile = async () => {
    if (!selectedProfile) return;
    const duplicated = await duplicateProfile(selectedProfile.id);
    notifications.show({ message: t('profiles.profileDuplicated'), color: 'green' });
    await loadData();
    setSelectedProfile(duplicated);
  };

  const handleSetActive = async (profileId: string) => {
    await setActiveProfile(profileId);
    setActiveProfileId(profileId);
    notifications.show({ message: t('profiles.activeProfileUpdated'), color: 'green' });
  };

  // Get all fields as rows (including empty ones)
  const getFieldRows = (): FieldRow[] => {
    if (!selectedProfile) return [];
    
    const rows: FieldRow[] = [];
    const translatedFields = getTranslatedCanonicalFields(t);
    
    // Canonical fields - show if field exists in profile (even if empty)
    translatedFields.forEach(field => {
      const value = selectedProfile.fields[field.key];
      if (value !== undefined) {
        rows.push({
          key: field.key,
          label: field.label,
          value,
          type: 'text',
          isCanonical: true,
          canonicalKey: field.key,
        });
      }
    });
    
    // Custom fields
    (selectedProfile.custom || []).forEach((custom, index) => {
      if (custom.key) {
        rows.push({
          key: `custom_${index}`,
          label: custom.key,
          value: custom.value,
          type: custom.type,
          isCanonical: false,
          customIndex: index,
        });
      }
    });
    
    return rows;
  };

  const handleFieldValueChange = (row: FieldRow, newValue: string) => {
    if (!selectedProfile) return;
    
    if (row.isCanonical && row.canonicalKey) {
      setSelectedProfile({
        ...selectedProfile,
        fields: { ...selectedProfile.fields, [row.canonicalKey]: newValue },
      });
    } else if (row.customIndex !== undefined) {
      const custom = [...(selectedProfile.custom || [])];
      const existing = custom[row.customIndex];
      if (!existing) return;
      custom[row.customIndex] = { 
        key: existing.key, 
        type: existing.type, 
        value: newValue,
        fileName: existing.fileName,
        fileType: existing.fileType,
      };
      setSelectedProfile({ ...selectedProfile, custom });
    }
  };

  const handleFileUpload = async (row: FieldRow, file: File | null) => {
    if (!file || !selectedProfile || row.customIndex === undefined) return;

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
        const custom = [...(selectedProfile.custom || [])];
        const existing = custom[row.customIndex!];
        if (!existing) return;
        custom[row.customIndex!] = {
          key: existing.key,
          type: existing.type,
          value: base64,
          fileName: file.name,
          fileType: file.type,
        };
        setSelectedProfile({ ...selectedProfile, custom });
        notifications.show({ message: t('profiles.fileUploaded', { name: file.name }), color: 'green' });
      };
      reader.onerror = () => {
        notifications.show({ message: t('backup.failedToReadClipboard'), color: 'red' });
      };
      reader.readAsDataURL(file);
    } catch {
      notifications.show({ message: t('backup.failedToReadClipboard'), color: 'red' });
    }
  };

  const handleDeleteField = async (row: FieldRow) => {
    if (!selectedProfile) return;
    
    let updatedProfile: Profile;
    
    if (row.isCanonical && row.canonicalKey) {
      const fields = { ...selectedProfile.fields };
      delete fields[row.canonicalKey];
      updatedProfile = { ...selectedProfile, fields };
    } else if (row.customIndex !== undefined) {
      const custom = (selectedProfile.custom || []).filter((_, i) => i !== row.customIndex);
      updatedProfile = { ...selectedProfile, custom };
    } else {
      return;
    }
    
    setSelectedProfile(updatedProfile);
    await updateProfile(updatedProfile.id, updatedProfile);
    notifications.show({ message: t('profiles.fieldDeleted'), color: 'green' });
    await loadData();
  };

  const handleAddCanonicalField = async (canonicalKey: CanonicalKey) => {
    if (!selectedProfile) {
      console.error('No selected profile');
      return;
    }
    const profileId = selectedProfile.id;
    const updatedProfile = {
      ...selectedProfile,
      fields: { ...selectedProfile.fields, [canonicalKey]: '' },
    };
    try {
      await updateProfile(updatedProfile.id, updatedProfile);
      setAddModalOpened(false);
      notifications.show({ message: t('profiles.fieldAdded'), color: 'green' });
      
      // Reload data and restore selected profile
      const state = await loadProfilesState();
      setProfiles(state.profiles);
      const refreshedProfile = state.profiles.find(p => p.id === profileId);
      if (refreshedProfile) {
        setSelectedProfile(refreshedProfile);
      }
    } catch (error) {
      console.error('Error adding field:', error);
      notifications.show({ message: t('backup.importError'), color: 'red' });
    }
  };

  const handleAddCustomField = async (key: string, type: string, file?: File) => {
    if (!selectedProfile || !key.trim()) return;
    const profileId = selectedProfile.id;
    const custom = selectedProfile.custom || [];
    
    let value = '';
    let fileName: string | undefined;
    let fileType: string | undefined;
    
    // If file is provided, read it
    if (file && type === 'file') {
      const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
      if (file.size > MAX_SIZE) {
        notifications.show({
          message: t('backup.importFailedInvalid'),
          color: 'red',
        });
        return;
      }
      
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        value = base64;
        fileName = file.name;
        fileType = file.type;
      } catch {
        notifications.show({ message: t('backup.failedToReadClipboard'), color: 'red' });
        return;
      }
    }
    
    const updatedProfile = {
      ...selectedProfile,
      custom: [...custom, { 
        key: key.trim(), 
        type: type as any, 
        value,
        fileName,
        fileType,
      }],
    };
    try {
      await updateProfile(updatedProfile.id, updatedProfile);
      setAddModalOpened(false);
      notifications.show({ 
        message: t('profiles.customFieldAdded'), 
        color: 'green' 
      });
      
      // Reload data and restore selected profile
      const state = await loadProfilesState();
      setProfiles(state.profiles);
      const refreshedProfile = state.profiles.find(p => p.id === profileId);
      if (refreshedProfile) {
        setSelectedProfile(refreshedProfile);
      }
    } catch (error) {
      console.error('Error adding field:', error);
      notifications.show({ message: t('backup.importError'), color: 'red' });
    }
  };

  const fieldRows = getFieldRows();

  // Filter profiles by search query
  const filteredProfiles = profiles
    .filter(p => {
      if (!profileSearchQuery.trim()) return true;
      const query = profileSearchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      // Active profile first
      if (a.id === activeProfileId) return -1;
      if (b.id === activeProfileId) return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <Stack gap="xs" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Compact Header */}
      <Card withBorder padding="xs">
        <Group justify="space-between" gap="xs" wrap="nowrap">
          {/* Left: Profile selector + name */}
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Button
              variant="light"
              leftSection={selectedProfile && activeProfileId === selectedProfile.id ? <IconStar size={16} fill="currentColor" /> : <IconChevronDown size={16} />}
              rightSection={<IconChevronDown size={14} />}
              onClick={() => setProfileSelectorOpened(true)}
              style={{ minWidth: 220, maxWidth: 280, justifyContent: 'space-between' }}
              size="sm"
            >
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedProfile 
                  ? `${selectedProfile.name}`
                  : t('profiles.select')}
              </span>
            </Button>
            
            {selectedProfile && (
              <Tooltip label={t('profiles.rename')}>
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={handleOpenEditNameModal}
                  color="gray"
                >
                  <IconPencil size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>

          {/* Right: Actions */}
          {selectedProfile && (
            <Group gap="xs" wrap="nowrap">
              <Tooltip label={t('profiles.duplicate')}>
                <ActionIcon 
                  onClick={handleDuplicateProfile} 
                  size="lg" 
                  variant="light"
                  color="blue"
                >
                  <IconCopy size={18} />
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label={t('profiles.delete')}>
                <ActionIcon 
                  onClick={() => setDeleteModalOpened(true)} 
                  size="lg" 
                  variant="light" 
                  color="red"
                  disabled={profiles.length === 1}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
              
              <Button 
                onClick={handleCreateProfile} 
                size="sm" 
                variant="light"
                leftSection={<IconPlus size={16} />}
              >
                {t('common.add')}
              </Button>
            </Group>
          )}
        </Group>
      </Card>

      {/* Fields Table */}
      {selectedProfile ? (

        <Card withBorder padding="xs" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="sm">{t('profiles.fields')} ({fieldRows.length})</Text>
            <Button 
              leftSection={<IconPlus size={16} />} 
              size="xs" 
              variant="light"
              onClick={() => setAddModalOpened(true)}
            >
              {t('profiles.addField')}
            </Button>
          </Group>

          <ScrollArea style={{ flex: 1 }}>
            {fieldRows.length > 0 ? (
              <Table striped highlightOnHover withTableBorder withColumnBorders style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={200}>{t('profiles.fieldNameLabel')}</Table.Th>
                    <Table.Th>{t('profiles.valueLabel')}</Table.Th>
                    <Table.Th w={100}>{t('profiles.typeLabel')}</Table.Th>
                    <Table.Th w={50}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {fieldRows.map((row) => (
                    <Table.Tr key={row.key}>
                      <Table.Td>
                        <Text size="xs" fw={500}>{row.label}</Text>
                      </Table.Td>
                      <Table.Td>
                        {row.type === 'multiline' ? (
                          <Textarea
                            value={row.value.length > 100 ? row.value.slice(0, 100) + '...' : row.value}
                            onChange={(e) => {
                              const newValue = e.target.value.replace('...', '');
                              handleFieldValueChange(row, newValue);
                            }}
                            size="xs"
                            rows={2}
                            autosize
                            minRows={1}
                            maxRows={3}
                            title={row.value.length > 100 ? row.value : undefined}
                          />
                        ) : row.type === 'file' ? (
                          <FileInput
                            placeholder={row.customIndex !== undefined && selectedProfile.custom?.[row.customIndex]?.fileName || t('profiles.uploadFile')}
                            onChange={(file) => handleFileUpload(row, file)}
                            size="xs"
                            accept="*/*"
                            clearable
                          />
                        ) : (
                          <TextInput
                            value={row.value.length > 100 ? row.value.slice(0, 100) + '...' : row.value}
                            onChange={(e) => {
                              const newValue = e.target.value.replace('...', '');
                              handleFieldValueChange(row, newValue);
                            }}
                            size="xs"
                            title={row.value.length > 100 ? row.value : undefined}
                          />
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant={row.isCanonical ? 'light' : 'filled'}>
                          {row.isCanonical ? t('profiles.template') : t('profiles.custom')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon 
                          size="sm" 
                          variant="subtle" 
                          color="red"
                          onClick={() => handleDeleteField(row)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
                ) : (
                  <Text c="dimmed" size="sm" ta="center" mt="xl">
                    {t('profiles.noFields')}
                  </Text>
                )}
          </ScrollArea>
        </Card>
      ) : (
        <Card withBorder padding="md">
          <Stack align="center" gap="md">
            <Text c="dimmed" size="sm">{t('profiles.noProfile')}</Text>
            <Button 
              onClick={handleCreateProfile} 
              leftSection={<IconPlus size={16} />}
            >
              {t('profiles.createFirst')}
            </Button>
          </Stack>
        </Card>
      )}

      <AddFieldModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        onAddCanonical={handleAddCanonicalField}
        onAddCustom={handleAddCustomField}
        existingFields={selectedProfile ? Object.keys(selectedProfile.fields) : []}
      />

      {/* Profile Selector Modal */}
      <Modal
        opened={profileSelectorOpened}
        onClose={() => {
          setProfileSelectorOpened(false);
          setProfileSearchQuery('');
        }}
        title={t('profiles.title')}
        size="md"
        centered
        styles={{
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '430px',
            overflow: 'hidden',
            maxHeight: '430px',
          },
          content: {
            overflow: 'hidden',
          },
        }}
      >
        <Stack gap={0} style={{ height: '100%', overflow: 'hidden' }}>
          {/* Fixed search input */}
          <div style={{ flexShrink: 0, padding: '16px', paddingBottom: '12px' }}>
            <TextInput
              placeholder={t('profiles.searchProfiles')}
              value={profileSearchQuery}
              onChange={(e) => setProfileSearchQuery(e.target.value)}
              leftSection={<IconSearch size={16} />}
              size="sm"
            />
          </div>

          {/* Scrollable profiles list */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ScrollArea style={{ flex: 1 }} offsetScrollbars>
            <div style={{ padding: '0 16px' }}>
              <Stack gap="xs">
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.map((profile) => {
                    const fieldCount = Object.keys(profile.fields).length + (profile.custom?.length || 0);
                    const isActive = profile.id === activeProfileId;
                    const isSelected = profile.id === selectedProfile?.id;
                    
                    return (
                      <Card
                        key={profile.id}
                        withBorder
                        padding="sm"
                        style={{
                          cursor: 'pointer',
                          borderColor: isSelected ? 'var(--mantine-color-primary-6)' : undefined,
                          borderWidth: isSelected ? 2 : 1,
                          backgroundColor: isSelected ? 'var(--mantine-color-primary-0)' : undefined,
                        }}
                        onClick={() => {
                          handleSelectProfile(profile);
                          setProfileSelectorOpened(false);
                          setProfileSearchQuery('');
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '';
                          }
                        }}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                            {isActive && (
                              <IconStar size={16} fill="var(--mantine-color-yellow-6)" color="var(--mantine-color-yellow-6)" />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={isSelected ? 600 : 500} size="sm" truncate>
                                {profile.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {fieldCount} {t('profiles.fields').toLowerCase()}
                              </Text>
                            </div>
                          </Group>
                          {isSelected && (
                            <Badge size="sm" variant="light" color="primary">
                              {t('profiles.active')}
                            </Badge>
                          )}
                        </Group>
                      </Card>
                    );
                  })
                ) : (
                  <Text c="dimmed" size="sm" ta="center" py="xl">
                    {profileSearchQuery ? t('profiles.noProfilesFound') : t('profiles.noProfile')}
                  </Text>
                )}
              </Stack>
            </div>
            </ScrollArea>
          </div>

          {/* Fixed button at bottom */}
          <div style={{ flexShrink: 0, padding: '16px', paddingTop: '12px', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setProfileSelectorOpened(false);
                setProfileSearchQuery('');
                handleCreateProfile();
              }}
            >
              {t('profiles.create')}
            </Button>
          </div>
        </Stack>
      </Modal>

      {/* Edit Profile Name Modal */}
      <Modal
        opened={editNameModalOpened}
        onClose={() => {
          setEditNameModalOpened(false);
          setEditingProfileName('');
        }}
        title={t('profiles.rename')}
        size="sm"
        centered
      >
        <Stack gap="md">
          <TextInput
            ref={editNameInputRef}
            label={t('profiles.profileName')}
            value={editingProfileName}
            onChange={(e) => setEditingProfileName(e.target.value)}
            placeholder={t('profiles.profileName')}
            size="sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveProfileName();
              }
            }}
          />
          <Group justify="flex-end" gap="xs">
            <Button 
              variant="light" 
              onClick={() => {
                setEditNameModalOpened(false);
                setEditingProfileName('');
              }}
              size="sm"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSaveProfileName}
              size="sm"
              disabled={!editingProfileName.trim()}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Profile Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title={t('profiles.delete')}
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {t('profiles.deleteConfirm', { name: selectedProfile?.name })}
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="light" onClick={() => setDeleteModalOpened(false)} size="sm">
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={handleDeleteProfile} size="sm">
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

type AddFieldModalProps = {
  opened: boolean;
  onClose: () => void;
  onAddCanonical: (key: CanonicalKey) => void;
  onAddCustom: (key: string, type: string, file?: File) => void;
  existingFields: string[];
};

function AddFieldModal({ opened, onClose, onAddCanonical, onAddCustom, existingFields }: AddFieldModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>('templates');
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldType, setCustomFieldType] = useState('text');
  const [customFieldFile, setCustomFieldFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const translatedFields = getTranslatedCanonicalFields(t);
  const availableCanonicalFields = translatedFields.filter(
    field => !existingFields.includes(field.key)
  );

  const filteredFields = availableCanonicalFields.filter(field =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFields = filteredFields.reduce((acc, field) => {
    if (!acc[field.group]) {
      acc[field.group] = [];
    }
    acc[field.group]!.push(field);
    return acc;
  }, {} as Record<string, typeof translatedFields>);

  const handleAddCustom = () => {
    if (customFieldName.trim()) {
      onAddCustom(customFieldName, customFieldType, customFieldFile || undefined);
      setCustomFieldName('');
      setCustomFieldType('text');
      setCustomFieldFile(null);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={t('profiles.addFieldTitle')}
      size="lg"
      padding="sm"
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="templates">{t('profiles.fromTemplates')} ({availableCanonicalFields.length})</Tabs.Tab>
          <Tabs.Tab value="custom">{t('profiles.customField')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="templates" pt="sm">
          <Stack gap="xs">
            <TextInput
              placeholder={t('profiles.searchFields')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
            />

            <ScrollArea h={400}>
              {filteredFields.length > 0 ? (
                <Stack gap="xs">
                  {Object.entries(groupedFields).map(([group, fields]) => (
                    <Box key={group}>
                      <Text size="xs" fw={600} c="dimmed" mb={4}>{group}</Text>
                      <Stack gap={4}>
                        {fields.map(field => (
                          <Button
                            key={field.key}
                            variant="light"
                            size="xs"
                            fullWidth
                            justify="flex-start"
                            onClick={() => onAddCanonical(field.key)}
                          >
                            {field.label}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" size="sm" ta="center" mt="xl">
                  {searchQuery ? t('profiles.noFieldsFound') : t('profiles.allFieldsAdded')}
                </Text>
              )}
            </ScrollArea>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="custom" pt="sm">
          <Stack gap="sm">
            <TextInput
              label={t('profiles.fieldName')}
              placeholder={t('profiles.fieldNamePlaceholder')}
              value={customFieldName}
              onChange={(e) => setCustomFieldName(e.target.value)}
              size="sm"
            />
            
            <Select
              label={t('profiles.fieldType')}
              value={customFieldType}
              onChange={(val) => {
                setCustomFieldType(val || 'text');
                if (val !== 'file') {
                  setCustomFieldFile(null);
                }
              }}
              data={[
                { value: 'text', label: 'Text' },
                { value: 'email', label: 'Email' },
                { value: 'tel', label: 'Phone' },
                { value: 'date', label: 'Date' },
                { value: 'url', label: 'URL' },
                { value: 'multiline', label: 'Multiline' },
                { value: 'file', label: 'File' },
              ]}
              size="sm"
            />

            {customFieldType === 'file' && (
              <FileInput
                label={t('profiles.uploadFile')}
                placeholder={t('profiles.uploadFile')}
                value={customFieldFile}
                onChange={setCustomFieldFile}
                accept="*/*"
                size="sm"
                clearable
              />
            )}

            <Button 
              onClick={handleAddCustom} 
              disabled={!customFieldName.trim()}
              fullWidth
              size="sm"
            >
              {t('profiles.addCustomField')}
            </Button>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
