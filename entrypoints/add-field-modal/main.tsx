import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '@shared/theme';
import App from './App';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@shared/i18n';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        <App />
      </MantineProvider>
    </React.StrictMode>
  );
}

