import { Box, TextField, Button, CircularProgress, IconButton } from '@mui/material';
import { Send as SendIcon, Clear } from '@mui/icons-material';

interface QuestionTextFieldProps {
    question: string;
    setQuestion: (question: string) => void;
    onSubmit: () => void;
    isConnected: boolean;
}

export function QuestionTextField({
    question,
    setQuestion,
    onSubmit,
    isConnected
}: QuestionTextFieldProps) {
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (isConnected && question.trim()) {
                onSubmit();
            }
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                label="What would you like to know?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                variant="outlined"
                placeholder="Ask about documents, policies, procedures, or any information in your database..."
                disabled={!isConnected}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                    variant="contained"
                    onClick={onSubmit}
                    disabled={!question.trim() || !isConnected}
                    startIcon={!isConnected ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{ minHeight: 56, minWidth: 120 }}
                >
                    {!isConnected ? 'Thinking...' : 'Ask'}
                </Button>
                {question && (
                    <IconButton onClick={() => setQuestion('')} size="small">
                        <Clear />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}
