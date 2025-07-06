import { Box, Typography, Chip, Button } from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import { SUGGESTED_QUESTIONS } from './types';

interface SuggestedQuestionsProps {
    conversation: any[];
    isConnected: boolean;
    onSuggestedQuestion: (question: string) => void;
    onDemoSSE: () => void;
}

export function SuggestedQuestions({
    conversation,
    isConnected,
    onSuggestedQuestion,
    onDemoSSE
}: SuggestedQuestionsProps) {
    if (conversation.length > 0) {
        return null;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lightbulb sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                    Try asking:
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {SUGGESTED_QUESTIONS.map((q, index) => (
                    <Chip
                        key={index}
                        label={q}
                        onClick={() => onSuggestedQuestion(q)}
                        variant="outlined"
                        clickable
                        size="small"
                    />
                ))}
            </Box>

            {/* Demo SSE Button */}
            <Box sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Demo: Test real-time streaming response
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onDemoSSE}
                    disabled={isConnected}
                >
                    Demo SSE Stream
                </Button>
            </Box>
        </Box>
    );
}
