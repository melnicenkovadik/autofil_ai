# Autofill Extension

Chrome extension for fast and intelligent form autofilling with profiles, hotkeys, and optional AI assistance.

## Features

- **Multiple Profiles**: Create and manage unlimited profiles with your personal data
- **Smart Field Detection**: Automatically detects form fields using heuristics and HTML autocomplete attributes
- **Hotkeys**: 
  - `Alt+Shift+I` (Mac: `⌥⇧I`) - Fill current field
  - `Alt+Shift+F` (Mac: `⌥⇧F`) - Fill entire form
- **Custom Fields**: Add any custom fields beyond the standard set (text, email, phone, files, etc.)
- **File Uploads**: Store and autofill files (resume, documents) as Base64 (up to 2 MB per file)
- **AI Classification** (Optional): Use OpenAI to classify ambiguous fields when heuristics aren't confident
- **Optional Lock**: Enable temporary lock with auto-timeout for security (disabled by default)
- **Import/Export**: Full backup and restore (profiles, settings, custom fields) via file or clipboard
- **Interactive Prompts**: Click "+" button to quickly add custom fields for unrecognized inputs

## Installation

### Development

1. Clone the repository:
```bash
git clone <repo-url>
cd autofil_extension
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3` directory

### Production Build

```bash
npm run build
npm run zip
```

The packaged extension will be in `.output/` directory.

## Usage

### First Time Setup

1. Click the extension icon to open popup
2. Go to "Profiles" tab and create your first profile
3. Fill in your personal information (name, email, phone, address, etc.)
4. Optionally add custom fields (social media handles, documents, etc.)
5. (Optional) Enable AI classification in "Settings" tab with your OpenAI API key
6. (Optional) Enable lock in "Settings" if you want security timeout

### Filling Forms

1. Navigate to any website with a form
2. Focus on an input field and press `Alt+Shift+I` (Mac: `⌥⇧I`) to fill just that field
3. Or press `Alt+Shift+F` (Mac: `⌥⇧F`) anywhere to fill the entire form (or all visible inputs)
4. If a field can't be filled, you'll see a toast with "+" button to add it as custom field

### Adding Custom Fields

**Method 1: From popup**
- Click extension icon → Profiles tab → scroll to "Custom Fields" → Add Field
- Choose field type (text, email, phone, file, etc.)
- For files: Upload (max 2 MB), stored as Base64

**Method 2: On-the-fly**
- Try to fill a field that doesn't work (e.g., Twitter handle)
- Click "+" button in the toast notification
- Enter field name, type, and value
- Field will be saved and filled immediately

### Managing Profiles

- **Create**: Popup → Profiles → "Create New Profile"
- **Edit**: Select a profile, modify fields, click "Save Profile"
- **Switch**: Select different profile from list (active profile has badge)
- **Delete**: Select profile → "Delete" button
- **Backup**: Popup → Backup → Export (download or copy to clipboard)
- **Restore**: Popup → Backup → Import (from file or paste JSON)

### Customizing Hotkeys

1. Open `chrome://extensions/shortcuts`
2. Find "Autofill" in the list
3. Click the edit icon to customize hotkeys

## Configuration

### Settings

- **Unlock Timeout**: How long the extension stays unlocked (1-120 minutes)
- **AI Classification**: Enable/disable AI assistance for ambiguous fields
- **OpenAI API Key**: Your API key (stored locally, never shared)
- **AI Model**: Choose between gpt-4o-mini (fast), gpt-4o (balanced), or gpt-4o-turbo (most capable)

### Data Storage

All data is stored locally in Chrome storage:
- Profiles and settings: `chrome.storage.local`
- No encryption (for personal use only)
- No cloud sync

## Architecture

```
entrypoints/
├── background.ts              # Service worker (hotkeys, AI calls)
├── content.ts                 # Content script initialization
├── content-utils/             # Content script utilities
│   ├── fill.ts                # Main filling logic
│   ├── file-autofill.ts       # File input handling
│   ├── selectors.ts           # DOM utilities
│   ├── hover-ui.ts            # Tooltip overlay
│   ├── add-field-modal.ts     # Custom field creation modal
│   ├── toast.ts               # Notifications
│   └── record.ts              # Field detection logging
├── popup/                     # Extension popup UI (main interface)
│   ├── main.tsx               # React entry point
│   └── App.tsx                # Popup app with tabs
└── options/                   # Full-page settings (fallback)
    ├── main.tsx               # React entry point
    ├── App.tsx                # Options app
    └── components/            # Reusable tab components
        ├── ProfilesTab.tsx    # Profile management
        ├── SettingsTab.tsx    # Extension settings
        └── ImportExportTab.tsx # Backup/restore

src/
├── modules/                   # Business logic modules
│   ├── profiles/              # Profile CRUD operations
│   ├── unlock/                # Lock/unlock logic
│   ├── mapping/               # Field detection heuristics
│   │   ├── scorer.ts          # Field scoring algorithm
│   │   ├── synonyms.ts        # Field name patterns
│   │   └── normalize.ts       # Data normalization
│   ├── ai/                    # OpenAI integration
│   └── storage/               # Chrome storage wrapper
└── shared/                    # Shared utilities
    ├── types/                 # TypeScript schemas (Zod)
    ├── constants/             # Canonical field definitions
    └── utils/                 # Logger, helpers
```

## Field Detection Priority

1. **Scorer Heuristics**: Autocomplete attributes, input types, name/id/class patterns, nearby labels
2. **Custom Fields**: User-defined field mappings (matches field name/id/class against custom.key)
3. **AI Classification** (if enabled): OpenAI API for ambiguous fields with low confidence scores

## Privacy & Security

- All data stored locally on your device (`chrome.storage.local`)
- No telemetry, analytics, or cloud sync
- API keys never leave your browser except for OpenAI API calls
- Optional lock mechanism (disabled by default for convenience)
- No encryption (personal use only)
- Files stored as Base64 (kept locally)

## Testing

Test page included in `test-pages/coverage.html` with 80+ fields covering:
- Personal info (names, DOB, gender)
- Contact (emails, phones, social media)
- Addresses (various formats and naming conventions)
- Work info (company, position, department)
- Documents (IDs, passport, tax numbers)
- Files (resume, portfolio, avatar)
- Payment (cards, IBAN, SWIFT)
- Authentication (passwords, usernames, PINs)
- Edge cases (cryptic names, no labels, AI test fields)

Open `test-pages/coverage.html` in Chrome (enable "Allow access to file URLs" in extension settings) to test.

## Tech Stack

- **Framework**: React + TypeScript
- **Build Tool**: wxt (Vite-based)
- **UI Library**: Mantine
- **Validation**: Zod
- **Phone Formatting**: libphonenumber-js
- **Country Data**: i18n-iso-countries

## Development

### Scripts

- `npm run dev` - Development mode with hot reload
- `npm run build` - Production build
- `npm run zip` - Create distributable .zip
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

### Adding New Canonical Fields

1. Add field to `CanonicalKeyEnum` in `src/shared/types/profile.ts`
2. Add field definition to `CANONICAL_FIELDS` in `src/shared/constants/canonical-fields.ts`
3. (Optional) Add synonyms/patterns in `src/modules/mapping/synonyms.ts`
4. (Optional) Add autocomplete mapping in `src/modules/mapping/scorer.ts`

No need to update UI components — they use `CANONICAL_FIELDS` automatically.

## License

MIT

## Support

For issues or feature requests, please open an issue on GitHub.

