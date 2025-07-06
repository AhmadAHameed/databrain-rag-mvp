import { useState, useEffect, useCallback, useRef } from 'react';

export interface SSEMessage {
  type: 'contexts' | 'answer';
  content?: string;
  contexts?: Array<{
    content: string;
    score: number;
    metadata: {
      source_id: string | null;
      chunk_id: string;
      document_type: string | null;
      department: string;
      division: string;
      created_at: string | null;
      processed_by: string | null;
      relevance_score: number;
      extraction_method: string | null;
      document_name: string;
      document_page_no: number;
    };
  }>;
  query?: string;
}

export interface UseSSEReturn {
  data: SSEMessage[];
  isConnected: boolean;
  error: string | null;
  connect: (url: string) => void;
  disconnect: () => void;
  reset: () => void;
  retry: () => void;
}

export const useSSE = (): UseSSEReturn => {
  const [data, setData] = useState<SSEMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const currentUrlRef = useRef<string | null>(null);
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
    
    reconnectAttemptsRef.current = 0;
    currentUrlRef.current = null;
  }, []);
  const reset = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  const attemptReconnect = useCallback((url: string) => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
      
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectAttemptsRef.current++;
        connect(url);
      }, delay);
    } else {
      console.log('Max reconnection attempts reached');
      setError('Connection to server lost. Please refresh the page to try again.');
    }
  }, []);  const connect = useCallback((url: string) => {
    // Disconnect any existing connection
    disconnect();
    reset();
    
    // Store the URL for potential reconnection
    currentUrlRef.current = url;

    console.log('Attempting to connect to SSE:', url); // Debug log

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened successfully'); // Debug log
        setIsConnected(true);
        setError(null);
        // Reset reconnection attempts on successful connection
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data); // Debug log
        try {
          // Skip empty data events
          if (!event.data || event.data.trim() === '') {
            return;
          }

          const parsedData: SSEMessage = JSON.parse(event.data);

          // Validate message structure
          if (!parsedData.type) {
            console.warn('SSE message missing type field:', parsedData);
            return;
          }

          console.log('Parsed SSE message:', parsedData); // Debug log
          setData(prev => [...prev, parsedData]);
        } catch (err) {
          console.error('Failed to parse SSE data:', err, 'Raw data:', event.data);
          setError('Failed to parse server response');
        }
      };      eventSource.onerror = (event) => {
        console.error('SSE error:', event, 'ReadyState:', eventSource.readyState);
        setIsConnected(false);

        // Provide more specific error messages based on ready state
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE connection closed by server');
          setError('Connection to server was closed. The server might be unavailable.');
          disconnect();
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          console.log('SSE attempting to reconnect...');
          setError('Reconnecting to server...');
        } else {
          console.log('SSE connection failed, attempting manual reconnect');
          setError('Connection to server lost. Retrying...');
          disconnect();
          attemptReconnect(url);
        }
      };

    } catch (err) {
      console.error('Failed to establish SSE connection:', err);
      setError(`Failed to connect to server: ${err instanceof Error ? err.message : 'Unknown error'}`);
      attemptReconnect(url);
    }
  }, [disconnect, reset, attemptReconnect]);
  const retry = useCallback(() => {
    if (currentUrlRef.current) {
      reconnectAttemptsRef.current = 0; // Reset attempts for manual retry
      connect(currentUrlRef.current);
    }
  }, [connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect,
    reset,
    retry
  };
};
