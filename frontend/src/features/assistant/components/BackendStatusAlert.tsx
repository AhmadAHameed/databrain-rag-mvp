import React from 'react';
import { Alert, Button } from '@mui/material';
import { ENV_CONFIG } from '../../../config/environment';
import type { BackendStatus } from './types';

interface BackendStatusAlertProps {
  backendStatus: BackendStatus;
  onCheckBackendStatus: () => void;
}

export const BackendStatusAlert: React.FC<BackendStatusAlertProps> = ({
  backendStatus,
  onCheckBackendStatus,
}) => {
  if (backendStatus.isOnline) {
    return null;
  }

  return (
    <Alert 
      severity="warning" 
      sx={{ mb: 3 }}
      action={
        <Button size="small" onClick={onCheckBackendStatus}>
          Retry
        </Button>
      }
    >
      <strong>Backend Offline:</strong> The backend server is not responding. 
      Please start the backend server on {ENV_CONFIG.apiBaseUrl} to use the AI Assistant.
    </Alert>
  );
};
