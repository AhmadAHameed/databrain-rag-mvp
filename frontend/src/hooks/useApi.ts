import { useState, useCallback } from 'react';
import { ENV_CONFIG } from '../config/environment';
import type { FilterOptions } from '../components/AdvancedFiltering';

export interface GenerationRequest {
  filters: {
    author?: string;
    date_from?: string;
    date_to?: string;
    department?: string;
    division?: string;
    document_nature?: string;
    document_type?: string;
  };
  min_score: number;
  num_chunks: number;
  query: string;
  temperature: number;
  type: string;
}

export interface GenerationResponse {
  response: string;
  sources: string[];
  chunks_used: number;
  processing_time: number;
}

interface UseApiState {
  isLoading: boolean;
  error: string | null;
  response: GenerationResponse | null;
}

export function useApi() {
  const [state, setState] = useState<UseApiState>({
    isLoading: false,
    error: null,
    response: null
  });

  // Convert frontend FilterOptions to backend filters format
  const convertFiltersToBackendFormat = useCallback((filters: FilterOptions): GenerationRequest['filters'] => {
    const backendFilters: GenerationRequest['filters'] = {};

    // Map divisions to division (take first one if multiple selected)
    if (filters.divisions.length > 0) {
      backendFilters.division = filters.divisions[0];
    }

    // Map documentNatures to document_nature (take first one if multiple selected)
    if (filters.documentNatures.length > 0) {
      backendFilters.document_nature = filters.documentNatures[0];
    }

    // Map fileTypes to document_type (take first one if multiple selected)
    if (filters.fileTypes.length > 0) {
      backendFilters.document_type = filters.fileTypes[0];
    }

    // Map authors to author (take first one if multiple selected)
    if (filters.authors.length > 0) {
      backendFilters.author = filters.authors[0];
    }

    // Map date range
    if (filters.dateRange.start) {
      backendFilters.date_from = filters.dateRange.start;
    }
    if (filters.dateRange.end) {
      backendFilters.date_to = filters.dateRange.end;
    }

    return backendFilters;
  }, []);

  const generateResponse = useCallback(async (
    query: string,
    filters: FilterOptions,
    options?: {
      temperature?: number;
      minScore?: number;
      numChunks?: number;
      type?: string;
    }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const requestBody: GenerationRequest = {
        filters: convertFiltersToBackendFormat(filters),
        min_score: options?.minScore || 0.3,
        num_chunks: options?.numChunks || 3,
        query,
        temperature: options?.temperature || 0.7,
        type: options?.type || 'all'
      };

      // Use mock endpoint when mocks are enabled, otherwise use real endpoint
      const endpoint = ENV_CONFIG.useMocks 
        ? '/api/v1/mock/generation/generate' 
        : '/api/v1/generation/generate';
      console.log('🔌 Making POST request to:', `${ENV_CONFIG.apiBaseUrl}${endpoint}`);

      const response = await fetch(`${ENV_CONFIG.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      setState({ isLoading: false, error: null, response: result });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({ isLoading: false, error: errorMessage, response: null });
      throw error;
    }
  }, [convertFiltersToBackendFormat]);

  const generateStreamingResponse = useCallback(async function* (
    query: string,
    filters: FilterOptions,
    options?: {
      temperature?: number;
      minScore?: number;
      numChunks?: number;
      type?: string;
    }
  ) {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const requestBody: GenerationRequest = {
        filters: convertFiltersToBackendFormat(filters),
        min_score: options?.minScore || 0.3,
        num_chunks: options?.numChunks || 3,
        query,
        temperature: options?.temperature || 0.7,
        type: options?.type || 'all'
      };

      // Use mock endpoint when mocks are enabled, otherwise use real endpoint  
      const endpoint = ENV_CONFIG.useMocks 
        ? '/api/v1/mock/generation/generate' 
        : '/api/v1/generation/generate';
      console.log('🔌 Making streaming POST request to:', `${ENV_CONFIG.apiBaseUrl}${endpoint}`);

      const response = await fetch(`${ENV_CONFIG.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();

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
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  yield parsed.content;
                }
              } catch (e) {
                // Skip malformed JSON
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({ isLoading: false, error: errorMessage, response: null });
      throw error;
    }
  }, [convertFiltersToBackendFormat]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, response: null });
  }, []);

  return {
    ...state,
    generateResponse,
    generateStreamingResponse,
    reset
  };
}
