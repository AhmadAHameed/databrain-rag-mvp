import { Box, Typography, Chip } from '@mui/material';
import { type FilterOptions } from '../../../components/AdvancedFiltering';

interface ActiveFiltersSummaryProps {
    filters: FilterOptions;
    hasActiveFilters: () => boolean;
    showFilters: boolean;
}

export function ActiveFiltersSummary({
    filters,
    hasActiveFilters,
    showFilters
}: ActiveFiltersSummaryProps) {
    if (!hasActiveFilters() || showFilters) {
        return null;
    }

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Active filters: Search optimized for your criteria
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {filters.divisions.length > 0 && (
                    <Chip label={`Divisions: ${filters.divisions.length}`} size="small" variant="outlined" />
                )}
                {filters.documentNatures.length > 0 && (
                    <Chip label={`Document Types: ${filters.documentNatures.length}`} size="small" variant="outlined" />
                )}
                {filters.fileTypes.length > 0 && (
                    <Chip label={`File Types: ${filters.fileTypes.length}`} size="small" variant="outlined" />
                )}
                {filters.authors.length > 0 && (
                    <Chip label={`Authors: ${filters.authors.length}`} size="small" variant="outlined" />
                )}
                {filters.dateRange.start && (
                    <Chip label="Date Range" size="small" variant="outlined" />
                )}
                {filters.semanticSearchMode !== 'hybrid' && (
                    <Chip label={`Mode: ${filters.semanticSearchMode}`} size="small" variant="outlined" />
                )}
                {filters.maxResults !== 10 && (
                    <Chip label={`Max Results: ${filters.maxResults}`} size="small" variant="outlined" />
                )}
            </Box>
        </Box>
    );
}
