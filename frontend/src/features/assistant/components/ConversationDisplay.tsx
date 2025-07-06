import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Divider,
    Chip,
    Button,
    Collapse,
    CircularProgress,
    Skeleton
} from '@mui/material';
import {
    ContentCopy,
    ThumbUp,
    ThumbDown,
    Clear,
    ExpandMore,
    ExpandLess,
    Source
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useState } from 'react';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import { SourceDocumentCard } from './SourceDocumentCard';
import { type ConversationItem } from './types';

interface ConversationDisplayProps {
    conversation: ConversationItem[];
    onCopyToClipboard: (text: string) => void;
    onClearConversation: () => void;
}

export function ConversationDisplay({
    conversation,
    onCopyToClipboard,
    onClearConversation
}: ConversationDisplayProps) {
    const theme = useTheme();

    if (conversation.length === 0) {
        return null;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Conversation ({Math.ceil(conversation.length / 2)} questions)
                </Typography>
                <Button size="small" onClick={onClearConversation} startIcon={<Clear />}>
                    Clear All
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {conversation.map((item) => (
                    <Card
                        key={item.id}
                        elevation={1}
                        sx={{
                            ml: item.type === 'question' ? 'auto' : 0,
                            mr: item.type === 'answer' ? 'auto' : 0,
                            maxWidth: '85%',
                            background: item.type === 'question'
                                ? theme.palette.primary.main
                                : theme.palette.background.paper
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            {item.type === 'question' ? (
                                <QuestionCard item={item} />
                            ) : (
                                <AnswerCard item={item} onCopyToClipboard={onCopyToClipboard} />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
}

interface QuestionCardProps {
    item: ConversationItem;
}

function QuestionCard({ item }: QuestionCardProps) {
    return (
        <Box>
            <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                {item.content}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {new Date(item.timestamp).toLocaleTimeString()}
            </Typography>
        </Box>
    );
}

interface AnswerCardProps {
    item: ConversationItem;
    onCopyToClipboard: (text: string) => void;
}

function AnswerCard({ item, onCopyToClipboard }: AnswerCardProps) {
    const [showSources, setShowSources] = useState(false);
    const theme = useTheme();

    // Show loading state when streaming but no content yet
    const isThinking = item.isStreaming && (!item.content || item.content.trim().length === 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1, mr: 2 }}>
                    {isThinking ? (
                        // Loading state when LLM is thinking
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            py: 2,
                            px: 1,
                            backgroundColor: theme.palette.mode === 'dark' 
                                ? theme.palette.grey[900] 
                                : theme.palette.grey[50],
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.mode === 'dark' 
                                ? theme.palette.grey[700] 
                                : theme.palette.grey[200]}`,
                            maxWidth: '85%', // Match answer/source card width
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            width: '100%',
                            boxSizing: 'border-box',
                            transition: 'max-width 0.2s ease-in-out'
                        }}>
                            <CircularProgress size={20} thickness={4} />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                    AI is thinking...
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Skeleton variant="text" width={120} height={16} />
                                    <Skeleton variant="text" width={80} height={16} />
                                    <Skeleton variant="text" width={100} height={16} />
                                </Box>
                            </Box>
                        </Box>
                    ) : (
                        <MarkdownRenderer
                            content={item.content}
                            variant="body1"
                        />
                    )}
                </Box>
                {!isThinking && (
                    <IconButton
                        size="small"
                        onClick={() => onCopyToClipboard(item.content)}
                        title="Copy answer"
                    >
                        <ContentCopy />
                    </IconButton>
                )}
            </Box>

            {/* Enhanced Sources Section with Horizontal Cards */}
            {item.retrievedChunks && item.retrievedChunks.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Source sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 600 }}>
                            Source Documents ({item.retrievedChunks.length})
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setShowSources(!showSources)}
                            sx={{ color: 'text.secondary' }}
                        >
                            {showSources ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Box>
                    
                    <Collapse in={showSources}>
                        <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {item.retrievedChunks.map((chunk, index) => (
                                <SourceDocumentCard
                                    key={index}
                                    chunk={chunk}
                                    index={index}
                                />
                            ))}
                        </Box>
                    </Collapse>
                </Box>
            )}

            {/* Legacy sources display */}
            {item.sources && item.sources.length > 0 && !item.retrievedChunks && (
                <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Sources:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                        {item.sources.map((source, index) => (
                            <Chip
                                key={index}
                                label={source}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    {new Date(item.timestamp).toLocaleTimeString()}
                </Typography>
                <Box>
                    <IconButton size="small" title="Helpful">
                        <ThumbUp />
                    </IconButton>
                    <IconButton size="small" title="Not helpful">
                        <ThumbDown />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}
