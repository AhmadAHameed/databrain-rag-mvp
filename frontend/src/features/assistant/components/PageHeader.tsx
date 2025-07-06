import {
    Box,
    Typography,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { AccentCard } from '../../../components/PageThemedComponents';

export function PageHeader() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <AccentCard
            elevation={2}
            sx={{
                p: { xs: 2, md: 3 },
                mb: 3,
                background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
                    : 'linear-gradient(135deg, #4a148c 0%, #9c27b0 100%)',
                color: 'white'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Psychology sx={{ fontSize: { xs: 32, md: 40 }, mr: 2 }} />
                <Box>
                    <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
                        AI Assistant
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        Ask questions about your documents and get intelligent answers
                    </Typography>
                </Box>
            </Box>
        </AccentCard>
    );
}
