import { Paper } from '@mui/material';
import { type FilterOptions } from '../../../components/AdvancedFiltering';
import { QuestionInputHeader } from './QuestionInputHeader';
import { FilteringSection } from './FilteringSection';
import { ActiveFiltersSummary } from './ActiveFiltersSummary';
import { QuestionTextField } from './QuestionTextField';
import { SuggestedQuestions } from './SuggestedQuestions';

interface QuestionInputProps {
    question: string;
    setQuestion: (question: string) => void;
    onSubmit: () => void;
    isConnected: boolean;
    conversation: any[];
    filters: FilterOptions;
    setFilters: (filters: FilterOptions) => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    hasActiveFilters: () => boolean;
    showApiConfig: boolean;
    setShowApiConfig: (show: boolean) => void;
    onSuggestedQuestion: (question: string) => void;
    onDemoSSE: () => void;
}

export function QuestionInput({
    question,
    setQuestion,
    onSubmit,
    isConnected,
    conversation,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    hasActiveFilters,
    showApiConfig,
    setShowApiConfig,
    onSuggestedQuestion,
    onDemoSSE
}: QuestionInputProps) {
    return (
        <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <QuestionInputHeader
                filters={filters}
                hasActiveFilters={hasActiveFilters}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                showApiConfig={showApiConfig}
                setShowApiConfig={setShowApiConfig}
            />

            <FilteringSection
                showFilters={showFilters}
                filters={filters}
                setFilters={setFilters}
                setShowFilters={setShowFilters}
            />

            <ActiveFiltersSummary
                filters={filters}
                hasActiveFilters={hasActiveFilters}
                showFilters={showFilters}
            />

            <QuestionTextField
                question={question}
                setQuestion={setQuestion}
                onSubmit={onSubmit}
                isConnected={isConnected}
            />

            <SuggestedQuestions
                conversation={conversation}
                isConnected={isConnected}
                onSuggestedQuestion={onSuggestedQuestion}
                onDemoSSE={onDemoSSE}
            />
        </Paper>
    );
}
