import { Box, Typography, Button } from '@mui/material';
import {
    QuestionAnswer,
    FilterList,
    ExpandMore,
    ExpandLess,
    Psychology
} from '@mui/icons-material';
import { type FilterOptions } from '../../../components/AdvancedFiltering';

interface QuestionInputHeaderProps {
    filters: FilterOptions;
    hasActiveFilters: () => boolean;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    showApiConfig: boolean;
    setShowApiConfig: (show: boolean) => void;
}

export function QuestionInputHeader({
    filters,
    hasActiveFilters,
    showFilters,
    setShowFilters,
    showApiConfig,
    setShowApiConfig
}: QuestionInputHeaderProps) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <QuestionAnswer sx={{ mr: 1 }} />
                <Typography variant="h6">Ask a Question</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    variant={hasActiveFilters() ? "contained" : "outlined"}
                    size="small"
                    startIcon={<FilterList />}
                    endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                    onClick={() => setShowFilters(!showFilters)}
                    color={hasActiveFilters() ? "primary" : "inherit"}
                >
                    Filters {hasActiveFilters() && `(${Object.values(filters).flat().filter(v => v !== '' && v !== null && v !== false && (Array.isArray(v) ? v.length > 0 : true)).length})`}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Psychology />}
                    endIcon={showApiConfig ? <ExpandLess /> : <ExpandMore />}
                    onClick={() => setShowApiConfig(!showApiConfig)}
                >
                    AI Settings
                </Button>
            </Box>
        </Box>
    );
}
