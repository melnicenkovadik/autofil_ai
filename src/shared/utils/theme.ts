import type { Theme } from '../types/settings';

let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
let currentTheme: Theme | null = null;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  currentTheme = theme;
  
  // Remove previous listener if exists
  if (mediaQueryListener) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.removeEventListener('change', mediaQueryListener);
    mediaQueryListener = null;
  }
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme = prefersDark ? 'dark' : 'light';
    root.setAttribute('data-mantine-color-scheme', effectiveTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQueryListener = (e: MediaQueryListEvent) => {
      if (currentTheme === 'auto') {
        root.setAttribute('data-mantine-color-scheme', e.matches ? 'dark' : 'light');
        // Dispatch event to update MantineProvider
        window.dispatchEvent(new Event('themechange'));
      }
    };
    mediaQuery.addEventListener('change', mediaQueryListener);
  } else {
    root.setAttribute('data-mantine-color-scheme', theme);
  }
}

export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

