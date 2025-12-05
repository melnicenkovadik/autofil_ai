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
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
      },
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
    version: '0.1.2',
    author: 'Your Name',
    homepage_url: 'https://github.com/yourusername/autofil_extension',
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
    action: {
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
        128: 'icon-128.png',
      },
    },
    permissions: ['storage', 'activeTab'],
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


