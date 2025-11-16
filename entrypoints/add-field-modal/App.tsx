import React, { useEffect, useState } from 'react';
import { Paper, Stack, TextInput, Select, Button, Group, Text, FileInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { getActiveProfileId, loadProfilesState, updateProfile } from '@modules/profiles';
import { logger } from '@shared/utils/logger';

interface ModalData {
  suggestedName: string;
}

export default function App() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<string>('text');
  const [fieldValue, setFieldValue] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Listen for messages from content script
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'OPEN_ADD_FIELD_MODAL') {
        const data: ModalData = event.data.payload;
        setFieldName(data.suggestedName || '');
        setFieldValue('');
        setFieldType('text');
        setFile(null);
        setVisible(true);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that we're ready
    window.parent.postMessage({ type: 'ADD_FIELD_MODAL_READY' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    window.parent.postMessage({ type: 'ADD_FIELD_MODAL_CLOSED' }, '*');
  };

  const handleSave = async () => {
    if (!fieldName.trim()) {
      notifications.show({ message: t('addField.fieldNameRequired'), color: 'red' });
      return;
    }

    try {
      if (fieldType === 'file') {
        if (!file) {
          notifications.show({ message: t('addField.pleaseSelectFile'), color: 'red' });
          return;
        }

        const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
        if (file.size > MAX_SIZE) {
          notifications.show({
            message: t('addField.fileTooLarge', { size: (file.size / 1024 / 1024).toFixed(2) }),
            color: 'red',
          });
          return;
        }

        const base64 = await fileToBase64(file);
        await saveCustomField(fieldName, fieldType, base64, file.name, file.type);
      } else {
        await saveCustomField(fieldName, fieldType, fieldValue);
      }

      notifications.show({ message: t('addField.customFieldSaved', { name: fieldName }), color: 'green' });
      handleClose();
      
      // Request refill
      window.parent.postMessage({ type: 'ADD_FIELD_MODAL_SAVED' }, '*');
    } catch (error) {
      if (error instanceof Error && error.message === 'MAX_FIELDS_REACHED') {
        // Respect global free plan limit on fields per profile
        notifications.show({ message: t('billing.maxFieldsReached'), color: 'red' });
      } else {
        logger.error('Failed to save custom field', error);
        notifications.show({ message: t('addField.failedToSave'), color: 'red' });
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const saveCustomField = async (
    name: string,
    type: string,
    value: string,
    fileName?: string,
    fileType?: string
  ) => {
    const profileId = await getActiveProfileId();
    if (!profileId) {
      throw new Error('No active profile');
    }

    const state = await loadProfilesState();
    const profile = state.profiles.find((p) => p.id === profileId);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const existingCustom = profile.custom || [];
    const existingIndex = existingCustom.findIndex((c) => c.key === name);

    const newField = {
      key: name,
      type: type as any,
      value: value,
      ...(fileName && { fileName }),
      ...(fileType && { fileType }),
    };

    let updatedCustom;
    if (existingIndex >= 0) {
      updatedCustom = existingCustom.map((c, i) => (i === existingIndex ? newField : c));
    } else {
      updatedCustom = [...existingCustom, newField];
    }

    await updateProfile(profileId, { custom: updatedCustom });
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(147, 112, 255, 0.4)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
      onClick={handleClose}
    >
      <Paper
        shadow="xl"
        p="xl"
        radius="lg"
        style={{
          maxWidth: 480,
          width: '100%',
          border: '1px solid rgba(147, 112, 255, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Stack gap="md">
          <div>
            <Title
              order={2}
              style={{
                background: 'linear-gradient(135deg, #9370ff, #ff4fb0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 8,
              }}
            >
              {t('addField.title')}
            </Title>
            <Text size="sm" c="dimmed">
              {t('addField.description')}
            </Text>
          </div>

          <TextInput
            label={t('addField.fieldName')}
            placeholder={t('addField.fieldNamePlaceholder')}
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            description={t('addField.fieldNameDescription')}
            required
            autoFocus
          />

          <Select
            label={t('addField.fieldType')}
            value={fieldType}
            onChange={(value) => setFieldType(value || 'text')}
            data={[
              { value: 'text', label: 'Text' },
              { value: 'email', label: 'Email' },
              { value: 'tel', label: 'Phone' },
              { value: 'url', label: 'URL' },
              { value: 'date', label: 'Date' },
              { value: 'multiline', label: 'Multiline' },
              { value: 'file', label: 'File (Base64, max 2 MB)' },
            ]}
          />

          {fieldType === 'file' ? (
            <FileInput
              label={t('addField.uploadFile')}
              placeholder={t('addField.uploadFilePlaceholder')}
              value={file}
              onChange={setFile}
              description={t('addField.uploadFileDescription')}
              accept="*/*"
            />
          ) : (
            <TextInput
              label={t('addField.defaultValue')}
              placeholder={t('addField.defaultValuePlaceholder')}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              description={t('addField.defaultValueDescription')}
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} variant="gradient">
              {t('addField.saveCustomField')}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </div>
  );
}

