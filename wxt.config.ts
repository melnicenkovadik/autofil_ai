import { defineConfig } from 'wxt';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  extensionApi: 'chrome',
  devServer: {
    port: 3000,
  },
  vite: () => ({
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
    },
    resolve: {
      alias: {
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '~': path.resolve(__dirname, 'src'),
      },
    },
  }),
  manifest: {
    name: 'Autofill - Smart Form Filler',
    description: 'Fast autofill for forms with profiles, hotkeys, and optional AI. Supports files, custom fields, import/export.',
    version: '0.1.0',
    author: 'Your Name',
    homepage_url: 'https://github.com/yourusername/autofil_extension',
    permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
    host_permissions: ['<all_urls>', 'http://localhost/*'],
    web_accessible_resources: [
      {
        resources: ['add-field-modal.html'],
        matches: ['<all_urls>'],
      },
    ],
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content-scripts/content.js'],
        run_at: 'document_idle',
        all_frames: true,
      },
    ],
    commands: {
      'fill-field': {
        suggested_key: {
          default: 'Alt+Shift+I',
          mac: 'Alt+Shift+I',
        },
        description: 'Fill current field',
      },
      'fill-form': {
        suggested_key: {
          default: 'Alt+Shift+F',
          mac: 'Alt+Shift+F',
        },
        description: 'Fill current form',
      },
    },
  },
});


