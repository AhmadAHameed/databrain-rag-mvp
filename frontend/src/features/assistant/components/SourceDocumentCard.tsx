import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Collapse,
    Grid,
    Divider
} from '@mui/material';
import {
    ExpandMore,
    ExpandLess,
    Description,
    Person,
    CalendarToday,
    Category,
    Business,
    DataUsage,
    Code,
    Pages
} from '@mui/icons-material';
import { useTheme } from '@mui/material';

interface SourceDocumentCardProps {
    chunk: {
        content: string;
        score: number;
        metadata: {
            source_id: string | null;
            document_type: string | null;
            department: string;
            division: string;
            created_at: string | null;
            processed_by: string | null;
            relevance_score: number;
            extraction_method: string | null;
            document_name: string;
            document_page_no: number;
            author?: string | null;
            document_size?: number | null;
            keywords?: string[] | null;
        };
    };
    index: number;
}

export function SourceDocumentCard({ chunk, index }: SourceDocumentCardProps) {
    const [expanded, setExpanded] = useState(false);
    const theme = useTheme();

    const formatScore = (score: number) => {
        return `${(score * 100).toFixed(1)}%`;
    };

    const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
        if (score >= 0.8) return 'success';
        if (score >= 0.6) return 'warning';
        return 'error';
    };

    const formatFileSize = (bytes: number | null | undefined) => {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getDocumentIcon = (docType: string | null) => {
        switch (docType?.toLowerCase()) {
            case 'pdf':
                return <Description sx={{ color: '#d32f2f' }} />;
            case 'docx':
            case 'doc':
                return <Description sx={{ color: '#1976d2' }} />;
            default:
                return <Description sx={{ color: theme.palette.text.secondary }} />;
        }
    };

    const handleCardClick = (event: React.MouseEvent) => {
        // Only expand if the card is currently collapsed
        if (!expanded) {
            setExpanded(true);
        }
    };

    const handleHeaderClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setExpanded(!expanded);
    };

    return (
        <Card
            sx={{
                mb: 1,
                cursor: expanded ? 'default' : 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-1px)'
                },
                border: expanded ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0'
            }}
            onClick={handleCardClick}
        >
            <CardContent sx={{ p: 2 }}>
                {/* Horizontal layout for basic info - clickable header area */}
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        cursor: 'pointer',
                        borderRadius: 1,
                        p: expanded ? 1 : 0,
                        mx: expanded ? -1 : 0,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': expanded ? {
                            backgroundColor: 'action.hover'
                        } : {},
                        position: 'relative'
                    }}
                    onClick={handleHeaderClick}
                    title={expanded ? "Click to collapse" : ""}
                >
                    {/* Document icon and type */}
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
                        {getDocumentIcon(chunk.metadata.document_type)}
                        <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                            #{index + 1}
                        </Typography>
                    </Box>

                    {/* Document name and preview */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                            variant="subtitle2" 
                            sx={{ 
                                fontWeight: 600, 
                                color: 'primary.main',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {chunk.metadata.document_name}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.85rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mt: 0.5
                            }}
                        >
                            {chunk.content.substring(0, 120)}...
                        </Typography>
                    </Box>

                    {/* Key info chips */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                        <Chip
                            label={formatScore(chunk.score)}
                            size="small"
                            color={getScoreColor(chunk.score)}
                            variant="filled"
                        />
                        <Chip
                            label={`Page ${chunk.metadata.document_page_no}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                        />
                        <IconButton 
                            size="small" 
                            sx={{ 
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                            title={expanded ? "Click to collapse" : "Click to expand"}
                        >
                            <ExpandMore />
                        </IconButton>
                    </Box>
                </Box>

                {/* Expanded details */}
                <Collapse in={expanded}>
                    <Box 
                        sx={{ mt: 2 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Divider sx={{ mb: 2 }} />
                        
                        {/* Full content */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Document Content
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    lineHeight: 1.6,
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? theme.palette.grey[900] 
                                        : theme.palette.grey[50],
                                    color: theme.palette.text.primary,
                                    p: 2,
                                    borderRadius: 1,
                                    border: `1px solid ${theme.palette.mode === 'dark' 
                                        ? theme.palette.grey[700] 
                                        : theme.palette.grey[200]}`
                                }}
                            >
                                {chunk.content}
                            </Typography>
                        </Box>

                        {/* Metadata chips */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Document Metadata
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    icon={<Description sx={{ fontSize: '16px !important' }} />}
                                    label={chunk.metadata.document_name}
                                    variant="filled"
                                    size="small"
                                    sx={{ 
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        '& .MuiChip-icon': { color: 'white !important' }
                                    }}
                                />
                                <Chip
                                    icon={<Business sx={{ fontSize: '16px !important' }} />}
                                    label={chunk.metadata.department}
                                    variant="filled"
                                    size="small"
                                    sx={{ 
                                        backgroundColor: '#ed6c02',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        '& .MuiChip-icon': { color: 'white !important' }
                                    }}
                                />
                                <Chip
                                    icon={<Category sx={{ fontSize: '16px !important' }} />}
                                    label={chunk.metadata.division}
                                    variant="filled"
                                    size="small"
                                    sx={{ 
                                        backgroundColor: '#9c27b0',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        '& .MuiChip-icon': { color: 'white !important' }
                                    }}
                                />
                                {chunk.metadata.author && (
                                    <Chip
                                        icon={<Person sx={{ fontSize: '16px !important' }} />}
                                        label={chunk.metadata.author}
                                        variant="filled"
                                        size="small"
                                        sx={{ 
                                            backgroundColor: '#2e7d32',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            '& .MuiChip-icon': { color: 'white !important' }
                                        }}
                                    />
                                )}
                                {chunk.metadata.created_at && (
                                    <Chip
                                        icon={<CalendarToday sx={{ fontSize: '16px !important' }} />}
                                        label={new Date(chunk.metadata.created_at).toLocaleDateString()}
                                        variant="filled"
                                        size="small"
                                        sx={{ 
                                            backgroundColor: '#d32f2f',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            '& .MuiChip-icon': { color: 'white !important' }
                                        }}
                                    />
                                )}
                                <Chip
                                    icon={<Pages sx={{ fontSize: '16px !important' }} />}
                                    label={`Page ${chunk.metadata.document_page_no}`}
                                    variant="filled"
                                    size="small"
                                    sx={{ 
                                        backgroundColor: '#0288d1',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        '& .MuiChip-icon': { color: 'white !important' }
                                    }}
                                />
                                {chunk.metadata.document_size && (
                                    <Chip
                                        icon={<DataUsage sx={{ fontSize: '16px !important' }} />}
                                        label={formatFileSize(chunk.metadata.document_size)}
                                        variant="filled"
                                        size="small"
                                        sx={{ 
                                            backgroundColor: '#f57c00',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            '& .MuiChip-icon': { color: 'white !important' }
                                        }}
                                    />
                                )}
                                {chunk.metadata.extraction_method && (
                                    <Chip
                                        icon={<Code sx={{ fontSize: '16px !important' }} />}
                                        label={chunk.metadata.extraction_method}
                                        variant="filled"
                                        size="small"
                                        sx={{ 
                                            backgroundColor: '#7b1fa2',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            '& .MuiChip-icon': { color: 'white !important' }
                                        }}
                                    />
                                )}
                                <Chip
                                    icon={<DataUsage sx={{ fontSize: '16px !important' }} />}
                                    label={`Relevance ${formatScore(chunk.score)}`}
                                    variant="filled"
                                    size="small"
                                    color={getScoreColor(chunk.score)}
                                    sx={{ 
                                        fontSize: '0.75rem',
                                        '& .MuiChip-icon': { color: 'white !important' }
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Keywords */}
                        {chunk.metadata.keywords && chunk.metadata.keywords.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Keywords
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {chunk.metadata.keywords.map((keyword, idx) => (
                                        <Chip
                                            key={idx}
                                            label={keyword}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
}
