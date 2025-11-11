import React from 'react';
import { Tabs, Space } from '@mantine/core';
import ProfilesTab from '../options/components/ProfilesTab';
import SettingsTab from '../options/components/SettingsTab';
import ImportExportTab from '../options/components/ImportExportTab';

export default function App() {
  return (
    <div style={{ width: '800px', height: '600px', display: 'flex', flexDirection: 'column' }}>
      <Tabs defaultValue="profiles" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 0 16px', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <Tabs.List>
            <Tabs.Tab value="profiles">Profiles</Tabs.Tab>
            <Tabs.Tab value="settings">Settings</Tabs.Tab>
            <Tabs.Tab value="import-export">Backup</Tabs.Tab>
          </Tabs.List>
        </div>

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

