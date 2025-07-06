import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Collapse,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  ContentCopy,
  ExpandMore,
  ExpandLess,
  Source,
  Analytics,
  Refresh
} from '@mui/icons-material';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { SSEMessage } from '../hooks/useSSE';

interface StreamingResponseProps {
  messages: SSEMessage[];
  isConnected: boolean;
  error: string | null;
  onCopy?: (content: string) => void;
  onRetry?: () => void;
}

interface ContextItem {
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
}

export const StreamingResponse: React.FC<StreamingResponseProps> = ({
  messages,
  isConnected,
  error,
  onCopy,
  onRetry
}) => {
  const [showSources, setShowSources] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());  // Process messages to extract contexts and build streaming answer
  const { contexts, query, finalAnswer } = useMemo(() => {
    let contexts: ContextItem[] = [];
    let query = '';
    let answerParts: string[] = [];

    messages.forEach(msg => {
      if (msg.type === 'contexts' && msg.contexts) {
        contexts = msg.contexts;
        query = msg.query || '';
        console.log('StreamingResponse: Found contexts', contexts.length, contexts);
      } else if (msg.type === 'answer' && msg.content !== undefined) {
        answerParts.push(msg.content);
      }
    });

    const finalAnswer = answerParts.join('');

    return {
      contexts,
      query,
      finalAnswer
    };
  }, [messages]);

  // Update streaming content as new messages arrive
  useEffect(() => {
    setStreamingContent(finalAnswer);
  }, [finalAnswer]);

  const handleCopyAnswer = () => {
    if (onCopy && finalAnswer) {
      onCopy(finalAnswer);
    }
  };

  const formatScore = (score: number) => {
    return `${(score * 100).toFixed(1)}%`;
  };
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ mb: 2 }}
        action={
          onRetry && (
            <IconButton
              color="inherit"
              size="small"
              onClick={onRetry}
              title="Retry connection"
            >
              <Refresh />
            </IconButton>
          )
        }
      >
        {error}
      </Alert>
    );
  }

  if (messages.length === 0 && !isConnected) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* AI Answer - Show first and prominently */}
      {(streamingContent || isConnected || messages.some(msg => msg.type === 'answer')) && (
        <Card elevation={3} sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '2px solid #e3f2fd'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Analytics sx={{ mr: 2, color: 'primary.main', fontSize: '1.5rem' }} />
              <Typography variant="h5" sx={{ 
                flexGrow: 1, 
                fontWeight: 600,
                color: 'primary.main'
              }}>
                AI Analysis & Response
              </Typography>
              {streamingContent && (
                <IconButton
                  onClick={handleCopyAnswer}
                  size="medium"
                  title="Copy answer"
                  sx={{
                    backgroundColor: 'primary.50',
                    border: '1px solid',
                    borderColor: 'primary.200',
                    '&:hover': {
                      backgroundColor: 'primary.100',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <ContentCopy />
                </IconButton>
              )}
            </Box>

            {streamingContent ? (
              <Box sx={{
                backgroundColor: 'white',
                borderRadius: 2,
                p: 3,
                border: '1px solid #e0e0e0',
                minHeight: '100px'
              }}>
                <MarkdownRenderer
                  content={streamingContent}
                  variant="body1"
                  sx={{ 
                    fontSize: '1rem',
                    lineHeight: 1.7
                  }}
                />
                {isConnected && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mt: 3, 
                    p: 2,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 1,
                    border: '1px solid #e9ecef'
                  }}>
                    <CircularProgress size={20} sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      Continuing to generate response...
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : isConnected ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                py: 4,
                px: 3,
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                border: '1px dashed #d0d7de'
              }}>
                <CircularProgress size={32} sx={{ mr: 3, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                    AI is analyzing your question...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Searching through documents and preparing a comprehensive response
                  </Typography>
                </Box>
              </Box>
            ) : messages.some(msg => msg.type === 'answer') ? (
              <Box sx={{ 
                py: 3,
                px: 3,
                backgroundColor: '#fff3e0',
                borderRadius: 2,
                border: '1px solid #ffb74d'
              }}>
                <Typography variant="body1" sx={{ 
                  color: '#ef6c00', 
                  fontWeight: 500,
                  textAlign: 'center'
                }}>
                  Processing answer...
                </Typography>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Context Sources */}
      {contexts.length > 0 && (
        <Card elevation={2} sx={{
          mb: 2,
          background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
          border: '1px solid #e0e0e0'
        }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Source sx={{ mr: 1.5, color: 'primary.main', fontSize: '1.2rem' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 0.3
                }}>
                  Source Documents ({contexts.length})
                </Typography>
                <Typography variant="caption" sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}>
                  Relevant content found from your knowledge base
                </Typography>
              </Box>
              <IconButton
                onClick={() => setShowSources(!showSources)}
                size="small"
                sx={{
                  backgroundColor: showSources ? 'primary.main' : 'action.hover',
                  color: showSources ? 'white' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: showSources ? 'primary.dark' : 'action.selected',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {showSources ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            {query && (
              <Box sx={{
                backgroundColor: '#f8f9fa',
                borderRadius: 1,
                p: 1.5,
                mb: 2,
                borderLeft: '3px solid',
                borderLeftColor: 'primary.main'
              }}>
                <Typography variant="body2" sx={{
                  color: 'text.primary',
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  lineHeight: 1.4
                }}>
                  <strong>Query:</strong> "{query}"
                </Typography>
              </Box>
            )}            <Collapse in={showSources}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: '60vh',
                overflowY: 'auto',
                px: 1,
                py: 1,
                scrollSnapType: 'y mandatory',
                '&::-webkit-scrollbar': {
                  width: 8,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f3f4',
                  borderRadius: 4,
                  margin: '8px 0',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#dadce0',
                  borderRadius: 4,
                  border: '1px solid #f1f3f4',
                  '&:hover': {
                    backgroundColor: '#bdc1c6',
                  },
                  '&:active': {
                    backgroundColor: '#9aa0a6',
                  },
                },
                // Firefox scrollbar styling
                scrollbarWidth: 'thin',
                scrollbarColor: '#dadce0 #f1f3f4',
              }}>
                {/* Add a subtle indicator when there are more cards to scroll */}
                {contexts.length > 3 && (
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
                    width: '100%',
                    height: '40px',
                    pointerEvents: 'none',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    pb: 1
                  }}>
                    <Typography variant="caption" sx={{
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap'
                    }}>
                      ↓ scroll for more
                    </Typography>
                  </Box>
                )}

                {contexts.map((context, index) => {
                  const isExpanded = expandedCards.has(index);
                  const shouldShowExpandButton = context.content.length > 200;

                  return (
                    <Fade key={index} in={true} timeout={300 + (index * 100)}>
                      <Card variant="outlined" sx={{
                        p: 3,
                        width: '100%',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                        border: '1px solid #e3e6ea',
                        borderRadius: 3,
                        transition: 'all 0.3s ease-in-out',
                        scrollSnapAlign: 'start',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          borderColor: 'primary.main',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        }
                      }}>
                        {/* Header with document name, score, and expand button */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start', 
                          mb: 2 
                        }}>
                          <Box sx={{ flex: 1, mr: 2 }}>
                            <Typography variant="h6" sx={{
                              fontWeight: 600,
                              color: 'primary.main',
                              fontSize: '1.1rem',
                              lineHeight: 1.3,
                              mb: 0.5
                            }}>
                              {context.metadata.document_name}
                            </Typography>
                            <Typography variant="caption" sx={{
                              color: 'text.secondary',
                              fontSize: '0.8rem',
                              display: 'block'
                            }}>
                              Page {context.metadata.document_page_no} • {context.metadata.department} • {context.metadata.division}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={formatScore(context.score)}
                              size="medium"
                              color={getScoreColor(context.score)}
                              variant="filled"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 28
                              }}
                            />
                            {shouldShowExpandButton && (
                              <Tooltip title={isExpanded ? "Show less" : "Show more"}>
                                <IconButton
                                  size="small"
                                  onClick={() => toggleCardExpansion(index)}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    color: 'text.secondary',
                                    border: '1px solid #e0e0e0',
                                    '&:hover': { 
                                      color: 'primary.main',
                                      borderColor: 'primary.main',
                                      backgroundColor: 'primary.50'
                                    }
                                  }}
                                >
                                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>

                        {/* Content */}
                        <Box sx={{
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          borderRadius: 2,
                          p: 2.5,
                          mb: 2,
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main'
                        }}>
                          <Typography variant="body1" sx={{
                            lineHeight: 1.7,
                            color: 'text.primary',
                            fontSize: '0.95rem',
                            ...(!isExpanded && shouldShowExpandButton ? {
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            } : {})
                          }}>
                            {context.content}
                          </Typography>
                        </Box>

                        {/* Enhanced Metadata Section */}
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: 2,
                          mb: 2
                        }}>
                          {/* Document Information */}
                          <Box>
                            <Typography variant="caption" sx={{ 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              mb: 1,
                              display: 'block'
                            }}>
                              Document Details
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {context.metadata.document_type && (
                                <Chip
                                  label={context.metadata.document_type}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              )}
                              {context.metadata.extraction_method && (
                                <Chip
                                  label={`Extract: ${context.metadata.extraction_method}`}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              )}
                              {context.metadata.document_size && (
                                <Chip
                                  label={`Size: ${(context.metadata.document_size / 1024).toFixed(1)} KB`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    backgroundColor: '#fff3e0',
                                    color: '#f57c00',
                                    border: '1px solid #ffb74d'
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          {/* Organizational Information */}
                          <Box>
                            <Typography variant="caption" sx={{ 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              mb: 1,
                              display: 'block'
                            }}>
                              Organization
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={context.metadata.department}
                                size="small"
                                variant="filled"
                                sx={{
                                  backgroundColor: '#e3f2fd',
                                  color: '#1565c0',
                                  fontSize: '0.75rem'
                                }}
                              />
                              <Chip
                                label={context.metadata.division}
                                size="small"
                                variant="filled"
                                sx={{
                                  backgroundColor: '#f3e5f5',
                                  color: '#7b1fa2',
                                  fontSize: '0.75rem'
                                }}
                              />
                              {context.metadata.author && (
                                <Chip
                                  label={`Author: ${context.metadata.author}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#e8f5e8',
                                    color: '#2e7d32'
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          {/* Relevance Scores */}
                          <Box>
                            <Typography variant="caption" sx={{ 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              mb: 1,
                              display: 'block'
                            }}>
                              Relevance Metrics
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={`Match: ${formatScore(context.score)}`}
                                size="small"
                                color={getScoreColor(context.score)}
                                variant="filled"
                                sx={{ fontSize: '0.75rem' }}
                              />
                              {context.metadata.relevance_score !== context.score && (
                                <Chip
                                  label={`Semantic: ${formatScore(context.metadata.relevance_score)}`}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              )}
                            </Box>
                          </Box>

                          {/* Keywords */}
                          {context.metadata.keywords && context.metadata.keywords.length > 0 && (
                            <Box>
                              <Typography variant="caption" sx={{ 
                                fontWeight: 600, 
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                mb: 1,
                                display: 'block'
                              }}>
                                Keywords
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {context.metadata.keywords.slice(0, 3).map((keyword, idx) => (
                                  <Chip
                                    key={idx}
                                    label={keyword}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: '0.7rem',
                                      height: '20px',
                                      backgroundColor: '#fafafa',
                                      color: '#666'
                                    }}
                                  />
                                ))}
                                {context.metadata.keywords.length > 3 && (
                                  <Chip
                                    label={`+${context.metadata.keywords.length - 3} more`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: '0.7rem',
                                      height: '20px',
                                      color: '#999'
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>

                        {/* Processing Information Footer */}
                        <Box sx={{
                          pt: 2,
                          borderTop: '1px solid #f0f0f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1
                        }}>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {context.metadata.created_at && (
                              <Chip
                                label={`Created: ${new Date(context.metadata.created_at).toLocaleDateString()}`}
                                size="small"
                                variant="filled"
                                sx={{
                                  backgroundColor: '#e8f5e8',
                                  color: '#2e7d32',
                                  fontSize: '0.7rem',
                                  height: '22px'
                                }}
                              />
                            )}
                            {context.metadata.source_id && (
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                                fontFamily: 'monospace',
                                backgroundColor: '#f5f5f5',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                Source ID: {context.metadata.source_id}
                              </Typography>
                            )}
                            {context.metadata.document_size && (
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                                fontStyle: 'italic'
                              }}>
                                • Size: {(context.metadata.document_size / 1024).toFixed(1)} KB
                              </Typography>
                            )}
                          </Box>
                          {context.metadata.processed_by && (
                            <Typography variant="caption" sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.7rem',
                              fontStyle: 'italic'
                            }}>
                              Processed by: {context.metadata.processed_by}
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    </Fade>
                  );
                })}

                {/* Context Summary Footer */}
                {contexts.length > 0 && (
                  <Box sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid #e9ecef'
                  }}>
                    <Typography variant="caption" sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      mb: 1,
                      display: 'block'
                    }}>
                      Summary Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {contexts.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          sources found
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatScore(Math.max(...contexts.map(c => c.score)))}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          best match
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {[...new Set(contexts.map(c => c.metadata.department))].length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          departments
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {[...new Set(contexts.map(c => c.metadata.document_name))].length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          unique documents
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StreamingResponse;
