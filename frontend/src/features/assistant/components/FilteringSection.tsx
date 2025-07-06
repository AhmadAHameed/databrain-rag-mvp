import { Box, Alert, Collapse } from '@mui/material';
import { AdvancedFiltering, type FilterOptions, defaultFilters } from '../../../components/AdvancedFiltering';

interface FilteringSectionProps {
    showFilters: boolean;
    filters: FilterOptions;
    setFilters: (filters: FilterOptions) => void;
    setShowFilters: (show: boolean) => void;
}

export function FilteringSection({
    showFilters,
    filters,
    setFilters,
    setShowFilters
}: FilteringSectionProps) {
    return (
        <Collapse in={showFilters}>
            <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Use filters to refine your search and get more targeted responses. The AI will search only within documents that match your filter criteria.
                </Alert>
                <AdvancedFiltering
                    filters={filters}
                    onFiltersChange={setFilters}
                    onApplyFilters={() => {
                        setShowFilters(false);
                        console.log('Applying filters:', filters);
                    }}
                    onClearFilters={() => setFilters(defaultFilters)}
                    isExpanded={true}
                />
            </Box>
        </Collapse>
    );
}
