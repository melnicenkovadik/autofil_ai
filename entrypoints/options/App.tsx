import React from 'react';
import { Container, Tabs, Title, Space } from '@mantine/core';
import ProfilesTab from './components/ProfilesTab';
import SettingsTab from './components/SettingsTab';
import ImportExportTab from './components/ImportExportTab';

export default function App() {
  return (
    <Container size="xl" py="xl" px="md" style={{ minHeight: '100vh', width: '100%', maxWidth: '1400px' }}>
      <Title order={1} mb="lg">
        Autofill Settings
      </Title>

      <Tabs defaultValue="profiles">
        <Tabs.List>
          <Tabs.Tab value="profiles">Profiles</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
          <Tabs.Tab value="import-export">Import/Export</Tabs.Tab>
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
      </Tabs>
    </Container>
  );
}

