import type { PaletteMode } from '@mui/material';

// Page identifiers
export type PageId = 'home' | 'ask' | 'search' | 'admin';

// Color schemes for each page
export interface PageColorScheme {
  primary: {
    main: string;
    light: string;
    dark: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
  };
  appBarGradient: {
    light: string;
    dark: string;
  };
  accent?: string;
}

export const pageColorSchemes: Record<PageId, PageColorScheme> = {
  home: {
    primary: {
      main: '#1976d2', // Blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#f48fb1',
      dark: '#c51162',
    },
    appBarGradient: {
      light: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      dark: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
    },
    accent: '#64b5f6',
  },
  ask: {
    primary: {
      main: '#9c27b0', // Purple
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    appBarGradient: {
      light: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
      dark: 'linear-gradient(135deg, #4a148c 0%, #9c27b0 100%)',
    },
    accent: '#ce93d8',
  },
  search: {
    primary: {
      main: '#2e7d32', // Green
      light: '#66bb6a',
      dark: '#1b5e20',
    },
    secondary: {
      main: '#ff5722',
      light: '#ff8a65',
      dark: '#d84315',
    },
    appBarGradient: {
      light: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
      dark: 'linear-gradient(135deg, #0d5016 0%, #2e7d32 100%)',
    },
    accent: '#81c784',
  },
  admin: {
    primary: {
      main: '#d32f2f', // Red
      light: '#f44336',
      dark: '#c62828',
    },
    secondary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    appBarGradient: {
      light: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
      dark: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
    },
    accent: '#ef5350',
  },
};

// Get page ID from pathname
export const getPageIdFromPath = (pathname: string): PageId => {
  if (pathname === '/') {
    return 'home';
  } else if (pathname.startsWith('/ask')) {
    return 'ask';
  } else if (pathname.startsWith('/search')) {
    return 'search';
  } else if (pathname.startsWith('/admin')) {
    return 'admin';
  }
  return 'home';
};

// Get theme colors for a specific page
export const getPageTheme = (pageId: PageId, mode: PaletteMode) => {
  const colorScheme = pageColorSchemes[pageId];
  
  return {
    palette: {
      mode,
      primary: colorScheme.primary,
      secondary: colorScheme.secondary,
    },
    appBarBackground: colorScheme.appBarGradient[mode],
    accent: colorScheme.accent,
  };
};
