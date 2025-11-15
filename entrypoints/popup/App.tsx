import React from 'react';
import { Tabs, Space, ActionIcon, Tooltip, Group, Paper } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import ProfilesTab from '../options/components/ProfilesTab';
import SettingsTab from '../options/components/SettingsTab';
import ImportExportTab from '../options/components/ImportExportTab';

export default function App() {
  const { t } = useTranslation();
  const handleOpenFullPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  };

  return (
    <div style={{ width: '800px', height: '600px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Tabs defaultValue="profiles" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Paper 
          p="md" 
          pb={0}
          style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 10,
          }}
          withBorder={false}
          shadow="sm"
        >
          <Group justify="space-between" wrap="nowrap">
            <Tabs.List style={{ flex: 1, overflow: 'hidden' }}>
              <Tabs.Tab value="profiles">{t('app.profiles')}</Tabs.Tab>
              <Tabs.Tab value="settings">{t('app.settings')}</Tabs.Tab>
              <Tabs.Tab value="import-export">{t('app.backup')}</Tabs.Tab>
            
            <Tooltip label={t('app.openInFullPage')} position="bottom" style={{ padding: 0 }}>
              <ActionIcon 
                variant="light" 
                size="md"
                className="external-link-icon"
                style={{ position: 'absolute', top: -3, right: 0, padding: 0 }}
                onClick={handleOpenFullPage}
              >
                <IconExternalLink size={18} />
              </ActionIcon>
            </Tooltip>
            </Tabs.List>
          </Group>
        </Paper>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px 16px' }}>
          <Space h="md" />

          <Tabs.Panel value="profiles">
            <ProfilesTab />
          </Tabs.Panel>

          <Tabs.Panel value="settings">
            <SettingsTab />
          </Tabs.Panel>

          <Tabs.Panel value="import-export">
            <ImportExportTab />
          </Tabs.Panel>
        </div>
      </Tabs>
    </div>
  );
}

