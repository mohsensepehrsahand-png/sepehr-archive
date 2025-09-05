"use client";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { ReactNode, useMemo } from "react";

// Create a simple cache without RTL plugins to avoid hydration issues
const createEmotionCache = () => createCache({
  key: "mui",
  prepend: true, // This ensures MUI styles are loaded first
});

// Light theme with RTL direction restored for proper Persian layout
const theme = createTheme({
  direction: "rtl", // Restored RTL direction for Persian layout
  typography: {
    fontFamily: "Vazirmatn, Arial, sans-serif",
    h1: { 
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2
    },
    h2: { 
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3
    },
    h3: { 
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3
    },
    h4: { 
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4
    },
    h5: { 
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4
    },
    h6: { 
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6
    },
    button: {
      fontWeight: 600,
      textTransform: 'none'
    }
  },
  palette: {
    primary: { 
      main: "#2563eb",
      light: "#3b82f6",
      dark: "#1d4ed8",
      contrastText: "#ffffff"
    },
    secondary: { 
      main: "#7c3aed",
      light: "#8b5cf6",
      dark: "#6d28d9",
      contrastText: "#ffffff"
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669"
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706"
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626"
    },
    info: {
      main: "#06b6d4",
      light: "#22d3ee",
      dark: "#0891b2"
    },
    background: { 
      default: "#f8fafc",
      paper: "#ffffff"
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b"
    },
    divider: "#e2e8f0"
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { 
          direction: "rtl", // Restored RTL direction for body
          backgroundColor: "#f8fafc"
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px'
        },
        '*::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px'
        },
        '*::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            background: '#a8a8a8'
          }
        }
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          '&:hover': {
            boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500
        }
      }
    }
  },
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  // Create cache instance on the client side to avoid SSR issues
  const cache = useMemo(() => createEmotionCache(), []);

  return (
    <CacheProvider value={cache}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  );
}
