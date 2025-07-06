// Development Mode Indicator Component
// Shows developers whether the app is using mock data or real API

import { Box, Chip, Tooltip } from '@mui/material';
import { CloudOff, Cloud } from '@mui/icons-material';
import { ENV_CONFIG } from '../config/environment';

interface DevelopmentModeIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  variant?: 'fixed' | 'inline';
}

export const DevelopmentModeIndicator: React.FC<DevelopmentModeIndicatorProps> = ({ 
  position = 'bottom-right',
  variant = 'fixed'
}) => {
  // Only show in development mode
  if (!ENV_CONFIG.isDevelopment) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 },
  };

  const chipProps = {
    icon: ENV_CONFIG.useMocks ? <CloudOff /> : <Cloud />,
    label: ENV_CONFIG.useMocks ? 'Mock Mode' : 'Live API',
    color: ENV_CONFIG.useMocks ? ('warning' as const) : ('success' as const),
    variant: 'filled' as const,
    size: 'small' as const,
  };  const tooltipContent = ENV_CONFIG.useMocks 
    ? `Using mock endpoints. Set VITE_USE_MOCKS=false to use real API.`
    : `Using live API at ${ENV_CONFIG.apiBaseUrl}. Set VITE_USE_MOCKS=true to use mock endpoints.`;

  if (variant === 'fixed') {
    return (
      <Box
        sx={{
          position: 'fixed',
          zIndex: 9999,
          ...positionStyles[position],
        }}
      >
        <Tooltip title={tooltipContent} arrow>
          <Chip {...chipProps} />
        </Tooltip>
      </Box>
    );
  }

  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip {...chipProps} />
    </Tooltip>
  );
};

// Hook to get current development mode info
export const useDevelopmentMode = () => {  return {
    isDevelopment: ENV_CONFIG.isDevelopment,
    isProduction: ENV_CONFIG.isProduction,
    useMocks: ENV_CONFIG.useMocks,
    apiBaseUrl: ENV_CONFIG.apiBaseUrl,
  };
};
