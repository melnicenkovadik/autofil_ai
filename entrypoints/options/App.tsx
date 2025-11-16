import React from 'react';
import { Container, Tabs, Title, Space } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import ProfilesTab from './components/ProfilesTab';
import SettingsTab from './components/SettingsTab';
import ImportExportTab from './components/ImportExportTab';
import BillingTab from './components/BillingTab';

export default function App() {
  const { t } = useTranslation();
  return (
    <Container size="xl" py="xl" px="md" style={{ minHeight: '100vh', width: '100%', maxWidth: '1400px' }}>
      <Title order={1} mb="lg">
        {t('app.autofillSettings')}
      </Title>

      <Tabs defaultValue="profiles">
        <Tabs.List>
          <Tabs.Tab value="profiles">{t('app.profiles')}</Tabs.Tab>
          <Tabs.Tab value="settings">{t('app.settings')}</Tabs.Tab>
          <Tabs.Tab value="import-export">{t('app.importExport')}</Tabs.Tab>
          <Tabs.Tab value="billing">{t('app.billing')}</Tabs.Tab>
        </Tabs.List>

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

        <Tabs.Panel value="billing">
          <BillingTab />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

