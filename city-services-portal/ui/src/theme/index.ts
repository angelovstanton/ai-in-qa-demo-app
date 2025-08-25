import { createTheme, Theme } from '@mui/material/styles';
import { designTokens } from './tokens';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
  }
}

export const theme: Theme = createTheme({
  palette: {
    primary: {
      50: designTokens.colors.primary[50],
      100: designTokens.colors.primary[100],
      500: designTokens.colors.primary[500],
      600: designTokens.colors.primary[600],
      700: designTokens.colors.primary[700],
      900: designTokens.colors.primary[900],
      main: designTokens.colors.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: designTokens.colors.secondary[500],
      contrastText: '#ffffff',
    },
    error: {
      main: designTokens.colors.error[500],
      light: designTokens.colors.error[50],
      dark: designTokens.colors.error[700],
    },
    warning: {
      main: designTokens.colors.warning[500],
      light: designTokens.colors.warning[50],
      dark: designTokens.colors.warning[700],
    },
    success: {
      main: designTokens.colors.success[500],
      light: designTokens.colors.success[50],
      dark: designTokens.colors.success[700],
    },
    grey: {
      50: designTokens.colors.gray[50],
      100: designTokens.colors.gray[100],
      200: designTokens.colors.gray[200],
      300: designTokens.colors.gray[300],
      400: designTokens.colors.gray[400],
      500: designTokens.colors.gray[500],
      600: designTokens.colors.gray[600],
      700: designTokens.colors.gray[700],
      800: designTokens.colors.gray[800],
      900: designTokens.colors.gray[900],
    },
  },
  typography: {
    fontFamily: designTokens.typography.fontFamily.sans.join(','),
    h1: {
      fontSize: designTokens.typography.fontSize['3xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: designTokens.typography.fontSize.xl,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: designTokens.typography.fontSize.lg,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: designTokens.typography.fontSize.base,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: designTokens.typography.fontSize.sm,
      lineHeight: 1.5,
    },
  },
  spacing: (factor: number) => `${factor * 8}px`, // 8px base unit
  shape: {
    borderRadius: parseInt(designTokens.borderRadius.md),
  },
  shadows: [
    'none',
    designTokens.shadows.sm,
    designTokens.shadows.md,
    designTokens.shadows.lg,
    designTokens.shadows.xl,
    // Add more shadows as needed
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: designTokens.typography.fontWeight.medium,
          borderRadius: designTokens.borderRadius.md,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.borderRadius.md,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
          boxShadow: designTokens.shadows.md,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: designTokens.shadows.md,
        },
      },
    },
  },
});