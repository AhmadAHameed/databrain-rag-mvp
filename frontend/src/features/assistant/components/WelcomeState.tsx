import {
    Typography,
    Paper,
    useTheme
} from '@mui/material';
import { Psychology } from '@mui/icons-material';

interface WelcomeStateProps {
    show: boolean;
}

export function WelcomeState({ show }: WelcomeStateProps) {
    const theme = useTheme();

    if (!show) {
        return null;
    }

    return (
        <Paper sx={{
            p: 4,
            textAlign: 'center',
            background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'
                : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
        }}>
            <Psychology sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
                Welcome to AI Assistant
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Ask any question about your documents, policies, or procedures and get real-time streaming responses
            </Typography>
            <Typography variant="body2" color="text.secondary">
                🔄 Real-time streaming • 🔍 Contextual search • 📊 Source attribution
            </Typography>
        </Paper>
    );
}
