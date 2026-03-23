import type { PaletteMode } from '@mui/material';
import { alpha, createTheme } from '@mui/material/styles';
import { typography } from './typography';

export const createAppTheme = (mode: PaletteMode) => {
  const isDark = mode === 'dark';
  const backgroundDefault = isDark ? '#212121' : '#f7f7f8';
  const backgroundPaper = isDark ? '#2f2f2f' : '#ffffff';
  const divider = isDark ? '#3d3d3d' : '#d9d9de';
  const primary = '#10a37f';

  return createTheme({
    palette: {
      mode,
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      primary: {
        main: primary,
        light: '#21b990',
        dark: '#0c8a6b',
      },
      text: {
        primary: isDark ? '#ececec' : '#1f1f1f',
        secondary: isDark ? '#b4b4b4' : '#5f6368',
        disabled: isDark ? '#7d7d7d' : '#9aa0a6',
      },
      divider,
      success: {
        main: '#2f9b74',
      },
      error: {
        main: '#d94f5c',
      },
    },
    shape: {
      borderRadius: 20,
    },
    typography,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            textTransform: 'none',
            boxShadow: 'none',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            borderColor: divider,
            backgroundColor: alpha(backgroundPaper, isDark ? 0.48 : 0.8),
            color: isDark ? '#dedede' : '#343541',
            '&:hover': {
              backgroundColor: alpha(backgroundPaper, isDark ? 0.72 : 1),
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'transparent',
              borderRadius: 28,
              '& fieldset': {
                borderColor: divider,
              },
              '&:hover fieldset': {
                borderColor: alpha(primary, 0.5),
              },
              '&.Mui-focused fieldset': {
                borderColor: alpha(primary, 0.65),
                boxShadow: `0 0 0 4px ${alpha(primary, isDark ? 0.18 : 0.12)}`,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundPaper,
            boxShadow: 'none',
            backgroundImage: 'none',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: divider,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#111111' : '#ffffff',
            color: isDark ? '#ececec' : '#1f1f1f',
            border: `1px solid ${divider}`,
            boxShadow: `0 16px 40px ${alpha('#000000', isDark ? 0.28 : 0.08)}`,
            fontSize: '0.75rem',
          },
          arrow: {
            color: isDark ? '#111111' : '#ffffff',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            minHeight: '100vh',
            background: isDark
              ? 'radial-gradient(circle at top, rgba(255,255,255,0.045), transparent 24%), #212121'
              : 'radial-gradient(circle at top, rgba(16,163,127,0.08), transparent 22%), #f7f7f8',
            color: isDark ? '#ececec' : '#1f1f1f',
          },
          '#root': {
            minHeight: '100vh',
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: `${alpha(isDark ? '#8c8c8c' : '#b7bcc3', 0.9)} transparent`,
          },
          '*::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },
          '*::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(isDark ? '#8c8c8c' : '#b7bcc3', 0.72),
            borderRadius: '999px',
            border: `2px solid ${backgroundDefault}`,
          },
          '::selection': {
            backgroundColor: alpha(primary, isDark ? 0.34 : 0.18),
          },
        },
      },
    },
  });
};
