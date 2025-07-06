import React from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Chip,
  Autocomplete,
  Slider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
  Search,
  Info
} from '@mui/icons-material';
import { useFilterOptions } from '../hooks/useFilterOptions';

export interface FilterOptions {
  divisions: string[];
  departments: string[];
  document_names: string[];
  document_ids: string[];
  documentNatures: string[];
  fileTypes: string[];
  authors: string[];
  dateRange: [string, string]; // <-- Add this line
  relevanceThreshold: number;
  maxResults: number;
}

interface AdvancedFilteringProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onCancelFilters?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const defaultFilters: FilterOptions = {
  divisions: [],
  departments: [],
  document_names: [],
  document_ids: [],
  documentNatures: [],
  fileTypes: [],
  authors: [],
  dateRange: ['', ''], // <-- Add this line
  relevanceThreshold: 0.5,
  maxResults: 5, // Default to 5 chunks
};

export const AdvancedFiltering: React.FC<AdvancedFilteringProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  onCancelFilters,
  isExpanded = false,
  onToggleExpanded
}) => {
  const { filterOptions, loading, error } = useFilterOptions();

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.divisions.length > 0 ||
      filters.departments.length > 0 ||
      filters.document_names.length > 0 ||
      filters.document_ids.length > 0 ||
      filters.fileTypes.length > 0 ||
      filters.relevanceThreshold !== 0.5 ||
      filters.maxResults !== 5 ||
      filters.authors.length > 0 // <-- Add this line
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.divisions.length > 0) count++;
    if (filters.departments.length > 0) count++;
    if (filters.document_names.length > 0) count++;
    if (filters.document_ids.length > 0) count++;
    if (filters.fileTypes.length > 0) count++;
    if (filters.relevanceThreshold !== 0.5) count++;
    if (filters.maxResults !== 5) count++;
    if (filters.authors.length > 0) count++; // <-- Add this line
    return count;
  };

  // Fallback options in case of error or loading
  const safeFilterOptions = {
    divisions: filterOptions.divisions.length > 0 ? filterOptions.divisions : ['Engineering', 'Piping', 'Civil', 'Pressure Vessels'],
    departments: filterOptions.departments.length > 0 ? filterOptions.departments : ['Design', 'General', 'PV Dept'],
    document_names: filterOptions.document_names.length > 0 ? filterOptions.document_names : ['400-001', '0000-000-300-001', '0000-000-100-007__PV_Spec', '1000482.1-ADD-SP-09-001_1_PIPING BASIS OF DESIGN'],
    document_ids: filterOptions.document_ids.length > 0 ? filterOptions.document_ids : ['1', '2', '3', '4', '5'],
    fileTypes:
      'fileTypes' in filterOptions && Array.isArray((filterOptions as any).fileTypes) && (filterOptions as any).fileTypes.length > 0
        ? (filterOptions as any).fileTypes
        : ['PDF', 'DOCX', 'PPTX'],
    authors: [] // <-- Add this line
  };

  if (error) {
    console.error('Filter options error:', error);
  }

  return (
    <Card sx={{ mb: 2 }}>
      <Accordion expanded={isExpanded} onChange={onToggleExpanded}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <FilterList />
            <Typography variant="h6">Search Filters</Typography>
            {hasActiveFilters() && (
              <Chip 
                label={`${getActiveFiltersCount()} active`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
            <Box sx={{ ml: 'auto' }}>
              {hasActiveFilters() && (
                <Tooltip title="Clear all filters">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onClearFilters(); }}>
                    <Clear />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, gridColumn: '1 / -1' }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading filter options...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="warning" sx={{ gridColumn: '1 / -1', mb: 2 }}>
                Failed to load filter options from server. Using default options.
              </Alert>
            )}

            {/* Division Filter */}
            <Autocomplete
              multiple
              options={safeFilterOptions.divisions}
              value={filters.divisions}
              onChange={(_, newValue) => handleFilterChange('divisions', newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Divisions"
                  placeholder="Select divisions to search in"
                  helperText="Filter by organizational divisions"
                />
              )}
              disabled={loading}
            />

            {/* Department Filter */}
            <Autocomplete
              multiple
              options={safeFilterOptions.departments}
              value={filters.departments}
              onChange={(_, newValue) => handleFilterChange('departments', newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Departments"
                  placeholder="Select departments"
                  helperText="Filter by document departments"
                />
              )}
              disabled={loading}
            />

            {/* Document Names Filter */}
            <Autocomplete
              multiple
              options={safeFilterOptions.document_names}
              value={filters.document_names}
              onChange={(_, newValue) => handleFilterChange('document_names', newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Document Names"
                  placeholder="Select specific documents"
                  helperText="Filter by specific document names"
                />
              )}
              disabled={loading}
            />


            {/* Document IDs Filter */}
            <Autocomplete
              multiple
              options={safeFilterOptions.document_ids}
              value={filters.document_ids}
              onChange={(_, newValue) => handleFilterChange('document_ids', newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Document IDs"
                  placeholder="Select specific document IDs"
                  helperText="Filter by document IDs"
                />
              )}
              disabled={loading}
            />

            {/* File Types Filter */}
            <Autocomplete
              multiple
              options={safeFilterOptions.fileTypes}
              value={filters.fileTypes}
              onChange={(_, newValue) => handleFilterChange('fileTypes', newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="File Types"
                  placeholder="Select file types"
                  helperText="Filter by file type (e.g., PDF, DOCX)"
                />
              )}
              disabled={loading}
            />

            <Divider sx={{ gridColumn: '1 / -1' }} />

            {/* Relevance Threshold */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2" gutterBottom>
                Relevance Threshold: {Math.round(filters.relevanceThreshold * 100)}%
                <Tooltip title="Minimum relevance score for search results. Higher values return more precise but fewer results.">
                  <Info sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                </Tooltip>
              </Typography>
              <Slider
                value={filters.relevanceThreshold}
                onChange={(_, newValue) => handleFilterChange('relevanceThreshold', newValue)}
                min={0}
                max={1}
                step={0.05}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              />
            </Box>

            {/* Max Results (Number of Chunks) */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2" gutterBottom>
                Number of Chunks: {filters.maxResults}
                <Tooltip title="Maximum number of document chunks to retrieve for analysis.">
                  <Info sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                </Tooltip>
              </Typography>
              <Slider
                value={filters.maxResults}
                onChange={(_, newValue) => handleFilterChange('maxResults', newValue)}
                min={1}
                max={20}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Divider sx={{ gridColumn: '1 / -1' }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', gridColumn: '1 / -1' }}>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={onClearFilters}
                disabled={!hasActiveFilters()}
              >
                Clear Filters
              </Button>
              {onCancelFilters && (
                <Button
                  variant="outlined"
                  onClick={onCancelFilters}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={onApplyFilters}
              >
                Apply Filters
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};
