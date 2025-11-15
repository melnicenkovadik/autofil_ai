import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '@shared/theme';
import { loadSettings } from '@modules/unlock';
import { applyTheme, getEffectiveTheme } from '@shared/utils/theme';
import App from './App';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@shared/i18n';
import '@shared/dark-theme.css';

function Root() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      const settings = await loadSettings();
      const effectiveTheme = getEffectiveTheme(settings.theme);
      setColorScheme(effectiveTheme);
      applyTheme(settings.theme);
      setMounted(true);
    };
    init();

    // Listen for theme changes
    const handleThemeChange = async () => {
      const settings = await loadSettings();
      const effectiveTheme = getEffectiveTheme(settings.theme);
      setColorScheme(effectiveTheme);
      applyTheme(settings.theme);
    };

    window.addEventListener('themechange', handleThemeChange);
    
    // Also listen to storage changes (in case settings are changed in another tab)
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.settings_v1) {
        handleThemeChange();
      }
    });

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  if (!mounted) {
    return null; // Prevent flash of wrong theme
  }

  return (
    <MantineProvider key={colorScheme} theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme}>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  );
}

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}

