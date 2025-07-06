export interface ConversationItem {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: string;
  sources?: string[];
  isStreaming?: boolean;
  retrievedChunks?: Array<{
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
  }>;
  metadata?: {
    sources?: string[];
    chunksUsed?: number;
    processingTime?: number;
  };
}

export interface BackendStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked?: string;
}

export interface FilterConfig {
  divisions: string[];
  documentNatures: string[];
  fileTypes: string[];
  authors: string[];
  dateRange: { start: string; end: string };
}

export interface ApiConfig {
  temperature: number;
  minScore: number;
  numChunks: number;
  type: string;
}

// Suggested questions for the assistant
export const SUGGESTED_QUESTIONS = [
  "What are the safety procedures for pipeline maintenance?",
  "How do I configure the data processing system?",
  "What are the environmental compliance requirements?",
  "Show me the project management guidelines",
  "What are the technical specifications for equipment installation?",
  "How do I handle vibration monitoring procedures?"
];