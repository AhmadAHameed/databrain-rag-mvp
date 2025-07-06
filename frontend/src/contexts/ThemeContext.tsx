import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { getPageIdFromPath, getPageTheme } from '../utils/pageThemes';
import type { PageId } from '../utils/pageThemes';

interface ThemeContextType {
  themeMode: PaletteMode;
  setThemeMode: (mode: PaletteMode) => void;
  currentPageId: PageId;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
};

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<PaletteMode>('light');
  const location = useLocation();
  const currentPageId = getPageIdFromPath(location.pathname);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeMode(savedTheme);
    }
  }, []);

  const handleSetThemeMode = (mode: PaletteMode) => {
    setThemeMode(mode);
    localStorage.setItem('theme', mode);
  };

  const pageTheme = getPageTheme(currentPageId, themeMode);
  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: pageTheme.palette.primary,
      secondary: pageTheme.palette.secondary,
      background: {
        default: themeMode === 'light' ? '#fafafa' : '#121212',
        paper: themeMode === 'light' ? '#ffffff' : '#1d1d1d',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        '@media (max-width:600px)': {
          fontSize: '1.75rem',
        },
      },
      h5: {
        '@media (max-width:600px)': {
          fontSize: '1.5rem',
        },
      },
    },
    components: {
      MuiContainer: {
        styleOverrides: {
          root: {
            width: '100%',
            maxWidth: '100%',
            paddingLeft: 0,
            paddingRight: 0,
            '@media (min-width: 0px)': {
              paddingLeft: 0,
              paddingRight: 0,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },      MuiAppBar: {
        styleOverrides: {
          root: {
            background: pageTheme.appBarBackground,
            backgroundImage: pageTheme.appBarBackground,
            boxShadow: themeMode === 'light' 
              ? '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)'
              : '0px 2px 4px -1px rgba(0,0,0,0.4), 0px 4px 5px 0px rgba(0,0,0,0.3), 0px 1px 10px 0px rgba(0,0,0,0.2)',
            '&.MuiAppBar-root': {
              background: pageTheme.appBarBackground,
              backgroundImage: pageTheme.appBarBackground,
            },
          },
        },
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
  });

  const contextValue: ThemeContextType = {
    themeMode,
    setThemeMode: handleSetThemeMode,
    currentPageId,
    theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
