import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Chip, 
  IconButton, 
  Collapse, 
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList, 
  Clear, 
  ExpandMore, 
  ExpandLess,
  Description,
  Business,
  DateRange
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { PageContainer, AccentCard } from '../../components/PageThemedComponents';

interface SearchResult {
  id: string;
  title: string;
  division: string;
  documentNature: string;
  excerpt: string;
  lastModified: string;
  relevanceScore: number;
}

// Mock data for demonstration
const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Technical Specifications for Data Processing System',
    division: 'Engineering',
    documentNature: 'Technical Report',
    excerpt: 'This document outlines the technical specifications and requirements for implementing a comprehensive data processing system...',
    lastModified: '2025-05-25',
    relevanceScore: 0.95
  },
  {
    id: '2',
    title: 'Q1 Financial Performance Analysis',
    division: 'Finance',
    documentNature: 'Financial Report',
    excerpt: 'Comprehensive analysis of the first quarter financial performance, including revenue growth, cost analysis, and future projections...',
    lastModified: '2025-05-20',
    relevanceScore: 0.87
  },
  {
    id: '3',
    title: 'Employee Training Guidelines 2025',
    division: 'Human Resources',
    documentNature: 'Policy Document',
    excerpt: 'Updated guidelines for employee training programs, including mandatory courses, skill development tracks, and certification requirements...',
    lastModified: '2025-05-18',
    relevanceScore: 0.78
  }
];

const divisions = ['Engineering', 'Finance', 'Human Resources', 'Marketing', 'Operations'];
const documentNatures = ['Technical Report', 'Financial Report', 'Policy Document', 'Meeting Minutes', 'Project Plan'];

export default function SearchPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState<string>('');
  const [documentNature, setDocumentNature] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(!isMobile);

  useEffect(() => {
    setShowFilters(!isMobile);
  }, [isMobile]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter mock results based on query and filters
      let filteredResults = mockResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.excerpt.toLowerCase().includes(query.toLowerCase())
      );

      if (division) {
        filteredResults = filteredResults.filter(result => result.division === division);
      }

      if (documentNature) {
        filteredResults = filteredResults.filter(result => result.documentNature === documentNature);
      }

      setResults(filteredResults);
    } catch (err) {
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setDivision('');
    setDocumentNature('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    clearFilters();
  };

  return (
    <PageContainer>
      <Box sx={{ width: '100%', minHeight: '100%' }}>
        {/* Search Header */}
        <AccentCard 
          elevation={2} 
          sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 3,
            background: theme.palette.mode === 'light' 
              ? 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
              : 'linear-gradient(135deg, #0d5016 0%, #2e7d32 100%)',
            color: 'white'
          }}
        >
          <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
            Document Search
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Find documents, reports, and resources across all divisions
          </Typography>
        </AccentCard>

        {/* Search Input */}
        <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Search documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="outlined"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                  endAdornment: query && (
                    <IconButton onClick={() => setQuery('')} size="small">
                      <Clear />
                    </IconButton>
                  )
                }}
                placeholder="Enter keywords, document titles, or content..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' } }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={!query.trim() || isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                  sx={{ minHeight: 56, flex: 1 }}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
                {isMobile && (
                  <Button
                    variant="outlined"
                    onClick={() => setShowFilters(!showFilters)}
                    startIcon={<FilterList />}
                    endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                    sx={{ minHeight: 56 }}
                  >
                    Filters
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Filters Section */}
          <Collapse in={showFilters}>
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterList sx={{ mr: 1 }} />
                  Filters
                </Typography>
                {(division || documentNature) && (
                  <Button size="small" onClick={clearFilters} startIcon={<Clear />}>
                    Clear Filters
                  </Button>
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Division</InputLabel>
                    <Select
                      value={division}
                      onChange={(e) => setDivision(e.target.value as string)}
                      label="Division"
                      startAdornment={<Business sx={{ mr: 1, color: 'action.active' }} />}
                    >
                      <MenuItem value="">All Divisions</MenuItem>
                      {divisions.map((div) => (
                        <MenuItem key={div} value={div}>{div}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={documentNature}
                      onChange={(e) => setDocumentNature(e.target.value as string)}
                      label="Document Type"
                      startAdornment={<Description sx={{ mr: 1, color: 'action.active' }} />}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {documentNatures.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Paper>

        {/* Active Filters Display */}
        {(division || documentNature) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Active filters:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {division && (
                <Chip
                  label={`Division: ${division}`}
                  onDelete={() => setDivision('')}
                  color="primary"
                  variant="outlined"
                />
              )}
              {documentNature && (
                <Chip
                  label={`Type: ${documentNature}`}
                  onDelete={() => setDocumentNature('')}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search Results */}
        {hasSearched && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {isLoading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
                {query && ` for "${query}"`}
              </Typography>
              {hasSearched && !isLoading && (
                <Button size="small" onClick={clearSearch} startIcon={<Clear />}>
                  Clear Search
                </Button>
              )}
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : results.length > 0 ? (
              <Grid container spacing={2}>
                {results.map((result) => (
                  <Grid item xs={12} key={result.id}>
                    <Card 
                      elevation={1} 
                      sx={{ 
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': { 
                          elevation: 3,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {result.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<Business />}
                            label={result.division}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            icon={<Description />}
                            label={result.documentNature}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                          <Chip
                            icon={<DateRange />}
                            label={new Date(result.lastModified).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {result.excerpt}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Relevance: {Math.round(result.relevanceScore * 100)}%
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" color="primary">
                          View Document
                        </Button>
                        <Button size="small" color="secondary">
                          Download
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No documents found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search terms or filters
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Welcome State */}
        {!hasSearched && (
          <AccentCard sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: { xs: 160, md: 180 }, // reduced height
            py: { xs: 2, md: 3 }, // reduced vertical padding
            px: { xs: 2, md: 3 },
            textAlign: 'center',
            boxShadow: 0,
            mb: 3 // slightly reduced margin bottom
          }}>
            <SearchIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1.5 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Welcome to Document Search
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 420, mx: 'auto', mb: 1 }}>
              Enter keywords above to search through our comprehensive document database
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340, mx: 'auto' }}>
              Use filters to narrow down results by division and document type
            </Typography>
          </AccentCard>
        )}
      </Box>
    </PageContainer>
  );
}
