export const HOTKEYS = {
  fillField: 'fill-field',
  fillForm: 'fill-form',
} as const;

export type HotkeyName = typeof HOTKEYS[keyof typeof HOTKEYS];


