import { createTheme, MantineColorsTuple } from '@mantine/core';

// Very Peri (Pantone 2025) - periwinkle blue to violet-red
const primaryColor: MantineColorsTuple = [
  '#f3f1ff',
  '#e6e1ff',
  '#d4c9ff',
  '#bfadff',
  '#a88dff',
  '#9370ff',
  '#6667ab',
  '#5c539f',
  '#524192',
  '#483685',
];

const accentColor: MantineColorsTuple = [
  '#ffe8f5',
  '#ffd0e8',
  '#ffb5db',
  '#ff96cd',
  '#ff73be',
  '#ff4fb0',
  '#d63f91',
  '#b33478',
  '#8f2960',
  '#6e1f49',
];

const grayColor: MantineColorsTuple = [
  '#fafafa',
  '#f4f4f5',
  '#e4e4e7',
  '#d4d4d8',
  '#a1a1aa',
  '#71717a',
  '#52525b',
  '#3f3f46',
  '#2d2d33', // Светлее чем было (#27272a)
  '#1f1f24', // Светлее чем было (#18181b)
];

export const theme = createTheme({
  primaryColor: 'veryPeri',
  colors: {
    veryPeri: primaryColor,
    accent: accentColor,
    gray: grayColor,
  },
  
  // Radius settings
  defaultRadius: 'md',
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  
  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.3', fontWeight: '700' },
      h2: { fontSize: '1.5rem', lineHeight: '1.35', fontWeight: '600' },
      h3: { fontSize: '1.25rem', lineHeight: '1.4', fontWeight: '600' },
      h4: { fontSize: '1.1rem', lineHeight: '1.45', fontWeight: '600' },
    },
  },
  
  // Spacing
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  // Shadows with Very Peri tint
  shadows: {
    xs: '0 1px 3px rgba(147, 112, 255, 0.08), 0 1px 2px rgba(147, 112, 255, 0.12)',
    sm: '0 2px 4px rgba(147, 112, 255, 0.1), 0 4px 8px rgba(147, 112, 255, 0.12)',
    md: '0 4px 8px rgba(147, 112, 255, 0.12), 0 8px 16px rgba(147, 112, 255, 0.15)',
    lg: '0 8px 16px rgba(147, 112, 255, 0.15), 0 16px 32px rgba(147, 112, 255, 0.18)',
    xl: '0 16px 32px rgba(147, 112, 255, 0.18), 0 24px 48px rgba(147, 112, 255, 0.22)',
  },
  
  // Component overrides
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: () => ({
        root: {
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      }),
    },
    
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        withBorder: true,
      },
      styles: () => ({
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderColor: 'rgba(147, 112, 255, 0.15)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 24px rgba(147, 112, 255, 0.2), 0 24px 48px rgba(255, 79, 176, 0.15)',
            borderColor: 'rgba(147, 112, 255, 0.3)',
          },
        },
      }),
    },
    
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: () => ({
        input: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderColor: 'rgba(147, 112, 255, 0.2)',
          '&:focus': {
            borderColor: 'rgba(147, 112, 255, 0.5)',
            boxShadow: '0 0 0 2px rgba(147, 112, 255, 0.1)',
          },
        },
      }),
    },
    
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
      styles: () => ({
        input: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderColor: 'rgba(147, 112, 255, 0.2)',
          '&:focus': {
            borderColor: 'rgba(147, 112, 255, 0.5)',
            boxShadow: '0 0 0 2px rgba(147, 112, 255, 0.1)',
          },
        },
      }),
    },
    
    Select: {
      defaultProps: {
        radius: 'md',
      },
      styles: () => ({
        input: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderColor: 'rgba(147, 112, 255, 0.2)',
          '&:focus': {
            borderColor: 'rgba(147, 112, 255, 0.5)',
            boxShadow: '0 0 0 2px rgba(147, 112, 255, 0.1)',
          },
        },
      }),
    },
    
    Modal: {
      defaultProps: {
        radius: 'lg',
        overlayProps: {
          opacity: 0.6,
          blur: 8,
          backgroundOpacity: 0.55,
        },
        transitionProps: {
          transition: 'slide-up',
          duration: 300,
        },
      },
      styles: () => ({
        content: {
          boxShadow: '0 20px 40px rgba(147, 112, 255, 0.3), 0 30px 60px rgba(255, 79, 176, 0.2)',
        },
        header: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        },
      }),
    },
    
    Paper: {
      defaultProps: {
        radius: 'md',
        shadow: 'xs',
        withBorder: true,
      },
      styles: () => ({
        root: {
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      }),
    },
    
    Tabs: {
      styles: () => ({
        tab: {
          fontWeight: 500,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderBottom: '2px solid transparent',
          '&[data-active]': {
            fontWeight: 600,
            background: 'linear-gradient(135deg, rgba(147, 112, 255, 0.1), rgba(255, 79, 176, 0.1))',
            borderBottomColor: 'rgba(147, 112, 255, 0.5)',
          },
          '&:hover': {
            background: 'rgba(147, 112, 255, 0.05)',
          },
        },
        list: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          paddingBottom: '8px',
        },
      }),
    },
    
    Badge: {
      defaultProps: {
        radius: 'md',
        variant: 'gradient',
        gradient: { from: '#9370ff', to: '#ff4fb0', deg: 135 },
      },
    },
  },
  
  // Other settings
  cursorType: 'pointer',
  defaultGradient: {
    from: '#9370ff',
    to: '#ff4fb0',
    deg: 135,
  },
  
  // Active elements
  activeClassName: 'mantine-active',
  focusClassName: 'mantine-focus-auto',
  
  // Smooth transitions everywhere
  respectReducedMotion: true,

  // Custom CSS variables for lighter dark theme
  other: {
    buttonBorder: true,
  },
  
  // Override dark theme colors to be lighter
  white: '#ffffff',
  black: '#000000',
});

