import { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { PageContainer } from '../../components/PageThemedComponents';
import { AdvancedFiltering, defaultFilters, type FilterOptions } from '../../components/AdvancedFiltering';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ENV_CONFIG } from '../../config/environment';
import { useSSE } from '../../hooks/useSSE';
import { StreamingResponse } from '../../components/StreamingResponse';

// Import split components
import {
  QuestionInput,
  ConversationDisplay,
  WelcomeState,
  PageHeader,
} from './components';
import { type ConversationItem } from './components/types';

/*
 * AskPage Component - Refactored with split components
 * 
 * This component orchestrates the AI assistant interface using smaller,
 * focused components for better maintainability and reusability.
 */

export default function AskPage() {
  // Log current mode for debugging
  console.log(`🚀 AskPage loaded in ${ENV_CONFIG.useMocks ? 'MOCK' : 'LIVE'} mode`);
  
  // State management
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState<FilterOptions>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // API Configuration
  const apiConfig = {
    temperature: 0.7,
    minScore: 0.3,
    numChunks: 5, // Default to 5 chunks, will be overridden by filters.maxResults
    type: 'all'
  };

  // SSE Streaming
  const {
    data: messages,
    isConnected,
    error: sseError
  } = useSSE();

  // Custom SSE with POST request - updates conversation directly
  const [_sseConnected, setSseConnected] = useState(false);
  const [_currentAnswerId, setCurrentAnswerId] = useState<string | null>(null);
  
  const startSSEWithPost = async (url: string, requestBody: any, answerId: string) => {
    setSseConnected(true);
    setCurrentAnswerId(answerId);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let streamedContent = '';
      let contexts: any[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setSseConnected(false);
                setCurrentAnswerId(null);
                console.log('✅ SSE streaming complete, setting contexts:', contexts.length, 'documents');
                // Mark streaming as complete
                setConversation(prev =>
                  prev.map(item =>
                    item.id === answerId
                      ? { ...item, isStreaming: false, retrievedChunks: contexts }
                      : item
                  )
                );
                return;
              }
              try {
                const parsed = JSON.parse(data);
                console.log('📨 SSE data received:', parsed.type, parsed.type === 'contexts' ? `(${parsed.contexts?.length} contexts)` : '');
                
                if (parsed.type === 'answer') {
                  // Check if this is an empty content message (end signal)
                  if (parsed.content === '') {
                    console.log('✅ SSE streaming complete (empty content), finalizing with contexts:', contexts.length, 'documents');
                    setSseConnected(false);
                    setCurrentAnswerId(null);
                    // Mark streaming as complete
                    setConversation(prev =>
                      prev.map(item =>
                        item.id === answerId
                          ? { ...item, isStreaming: false, retrievedChunks: contexts }
                          : item
                      )
                    );
                    return;
                  }
                  
                  streamedContent += parsed.content || '';
                  // Update the answer in conversation directly
                  setConversation(prev =>
                    prev.map(item =>
                      item.id === answerId
                        ? { ...item, content: streamedContent, isStreaming: true }
                        : item
                    )
                  );
                } else if (parsed.type === 'contexts') {
                  contexts = parsed.contexts || [];
                  console.log('📚 Contexts stored:', contexts.length, 'documents');
                  // Immediately update the conversation item with contexts so they show up
                  setConversation(prev =>
                    prev.map(item =>
                      item.id === answerId
                        ? { ...item, retrievedChunks: contexts }
                        : item
                    )
                  );
                }
                
              } catch (e) {
                console.error('Error parsing SSE data:', e);
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        setSseConnected(false);
        setCurrentAnswerId(null);
      }
    } catch (error) {
      console.error('SSE POST error:', error);
      setSseConnected(false);
      setCurrentAnswerId(null);
      throw error;
    }
  };

  // Function to move SSE response to conversation history - no longer needed
  // Now we update conversation directly during streaming

  // Auto-move SSE to conversation when streaming completes - no longer needed
  // Now we update conversation directly during streaming

  // API hook
  const { generateStreamingResponse, isLoading } = useApi();

  // Check backend status
  const checkBackendStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`${ENV_CONFIG.apiBaseUrl}/api/v1/health/health`);
      setBackendOnline(response.ok);
      console.log(`🔗 Backend status: ${response.ok ? 'ONLINE' : 'OFFLINE'} (${ENV_CONFIG.useMocks ? 'MOCK' : 'LIVE'} mode)`);
    } catch (error) {
      console.error('Backend check failed:', error);
      setBackendOnline(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Initialize backend status check
  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Sync pending filters when filter panel opens
  useEffect(() => {
    if (showFilters) {
      setPendingFilters(filters);
    }
  }, [showFilters, filters]);

  // Handle question submission
  const handleSubmit = async () => {
    if (!question.trim() || !backendOnline || isLoading) return;

    const questionId = Date.now().toString();
    const answerId = `${questionId}_answer`;
    const currentQuestion = question.trim();
    
    const newQuestion: ConversationItem = {
      id: questionId,
      type: 'question',
      content: currentQuestion,
      timestamp: new Date().toISOString()
    };

    // Create initial streaming answer placeholder
    const initialAnswer: ConversationItem = {
      id: answerId,
      type: 'answer',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    };

    // Add both question and streaming answer to conversation immediately
    setConversation(prev => [...prev, newQuestion, initialAnswer]);
    setQuestion('');
    
    // Clear any previous SSE connection state
    setSseConnected(false);
    setCurrentAnswerId(null);

    try {
      // Use SSE streaming with POST request
      const requestBody = {
        query: currentQuestion,
        min_score: filters.relevanceThreshold, // Use the filter's relevance threshold
        num_chunks: filters.maxResults, // Use the filter's maxResults (default 5)
        temperature: apiConfig.temperature,
        type: apiConfig.type,
        filters: {
          // Database-driven filters - send arrays as they are
          ...(filters.divisions.length > 0 && { division: filters.divisions }),
          ...(filters.departments.length > 0 && { department: filters.departments }),
          ...(filters.document_names.length > 0 && { document_name: filters.document_names }),
          ...(filters.document_ids.length > 0 && { document_id: filters.document_ids })
        }
      };
      
      // Use the correct endpoint based on mock setting
      const endpoint = ENV_CONFIG.useMocks 
        ? '/api/v1/mock/generation/generate' 
        : '/api/v1/generation/generate';
      
      // Use custom SSE with POST - pass the answer ID to update directly
      console.log(`🔌 Attempting SSE connection to: ${ENV_CONFIG.apiBaseUrl}${endpoint}`);
      console.log(`📦 Request body:`, requestBody);
      await startSSEWithPost(`${ENV_CONFIG.apiBaseUrl}${endpoint}`, requestBody, answerId);

    } catch (error) {
      console.error('SSE connection error:', error);
      
      // Fallback to regular streaming on SSE error
      try {
        const streamGenerator = generateStreamingResponse(
          currentQuestion,
          filters,
          apiConfig
        );

        let streamedContent = '';

        for await (const chunk of streamGenerator) {
          streamedContent += chunk;

          // Update the streaming answer
          setConversation(prev => {
            const updated = [...prev];
            const answerIndex = updated.findIndex(item => item.id === answerId);

            if (answerIndex >= 0) {
              updated[answerIndex] = {
                ...updated[answerIndex],
                content: streamedContent,
                isStreaming: true
              };
            } else {
              updated.push({
                id: answerId,
                type: 'answer',
                content: streamedContent,
                timestamp: new Date().toISOString(),
                isStreaming: true
              });
            }

            return updated;
          });
        }

        // Mark streaming as complete
        setConversation(prev =>
          prev.map(item =>
            item.id === answerId
              ? { ...item, isStreaming: false }
              : item
          )
        );

      } catch (fallbackError) {
        console.error('Fallback streaming error:', fallbackError);
        // Add error message to conversation
        setConversation(prev => 
          prev.map(item =>
            item.id === answerId
              ? { ...item, content: `Error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error occurred'}`, isStreaming: false }
              : item
          )
        );
      }
    }
  };

  // Handle suggested questions
  const handleSuggestedQuestion = (suggestedQuestion: string) => {
    setQuestion(suggestedQuestion);
  };

  // Handle conversation clear
  const handleClearConversation = () => {
    setConversation([]);
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  // Check if there are active filters
  const hasActiveFilters = (): boolean => {
    return filters.divisions.length > 0 ||
      filters.departments.length > 0 ||
      filters.document_names.length > 0 ||
      filters.document_ids.length > 0;
  };

  // Demo SSE function for testing
  const handleDemoSSE = async () => {
    console.log('Demo SSE called - triggering SSE streaming response');
    
    const questionId = Date.now().toString();
    const answerId = `${questionId}_answer`;
    
    // Add the question to conversation if there's one
    const queryToUse = question.trim() || 'safety procedures for pipeline maintenance';
    if (question.trim()) {
      const newQuestion: ConversationItem = {
        id: questionId,
        type: 'question',
        content: question.trim(),
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, newQuestion]);
      setQuestion('');
    }
    
    // Create streaming answer placeholder
    const initialAnswer: ConversationItem = {
      id: answerId,
      type: 'answer',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    };
    
    setConversation(prev => [...prev, initialAnswer]);
    
    // Clear existing state and use real backend SSE
    setSseConnected(true);
    setCurrentAnswerId(answerId);
    
    try {
      // Use the real backend SSE endpoint
      const requestBody = {
        query: queryToUse,
        min_score: 0.3,
        num_chunks: 3,
        temperature: 0.7,
        type: 'all',
        filters: {}
      };
      
      const endpoint = ENV_CONFIG.useMocks 
        ? '/api/v1/mock/generation/generate' 
        : '/api/v1/generation/generate';
      
      await startSSEWithPost(`${ENV_CONFIG.apiBaseUrl}${endpoint}`, requestBody, answerId);
      
    } catch (error) {
      console.error('Demo SSE error:', error);
      setSseConnected(false);
      setCurrentAnswerId(null);
      
      // Add error message to conversation
      setConversation(prev =>
        prev.map(item =>
          item.id === answerId
            ? { ...item, content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, isStreaming: false }
            : item
        )
      );
    }
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader />

      {/* Backend Status Alert */}
      {!backendOnline && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isCheckingStatus ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Box
                  component="button"
                  onClick={checkBackendStatus}
                  sx={{
                    border: 'none',
                    background: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Retry
                </Box>
              )}
            </Box>
          }
        >
          Backend is offline. Please check your connection and try again.
        </Alert>
      )}

      {/* Welcome State - shown when no conversation */}
      <WelcomeState show={conversation.length === 0} />

      {/* Streaming Response Display - Legacy SSE support */}
      {messages.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <StreamingResponse
            messages={messages}
            isConnected={isConnected}
            error={sseError}
            onCopy={handleCopyToClipboard}
          />
        </Box>
      )}

      {/* Conversation Display - Shows conversation history below SSE */}
      {conversation.length > 0 && (
        <ConversationDisplay
          conversation={conversation}
          onCopyToClipboard={handleCopyToClipboard}
          onClearConversation={handleClearConversation}
        />
      )}

      {/* Question Input Section */}
      <QuestionInput
        question={question}
        setQuestion={setQuestion}
        onSubmit={handleSubmit}
        isConnected={backendOnline && !isLoading}
        conversation={conversation}
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        hasActiveFilters={hasActiveFilters}
        showApiConfig={showApiConfig}
        setShowApiConfig={setShowApiConfig}
        onSuggestedQuestion={handleSuggestedQuestion}
        onDemoSSE={handleDemoSSE}
      />

      {/* Advanced Filtering */}
      {showFilters && (
        <ErrorBoundary>
          <AdvancedFiltering
            filters={pendingFilters}
            onFiltersChange={(newFilters) => {
              console.log('🔍 Pending filters changed:', newFilters);
              setPendingFilters(newFilters);
            }}
            onApplyFilters={() => {
              console.log('✅ Applying filters:', pendingFilters);
              setFilters(pendingFilters);
              setShowFilters(false);
            }}
            onClearFilters={() => {
              console.log('🧹 Clearing filters');
              setPendingFilters(defaultFilters);
              setFilters(defaultFilters);
            }}
            onCancelFilters={() => {
              console.log('❌ Cancelling filter changes');
              setPendingFilters(filters);
              setShowFilters(false);
            }}
          />
        </ErrorBoundary>
      )}
    </PageContainer>
  );
}
