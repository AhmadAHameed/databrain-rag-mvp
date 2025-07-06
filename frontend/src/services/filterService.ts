// Service for fetching filter options from the backend
import { ENV_CONFIG } from '../config/environment';

export interface FilterOptionsResponse {
  divisions: string[];
  departments: string[];
  document_names: string[];
  document_ids: string[];
}

class FilterService {
  private baseUrl: string;

  constructor() {
    // Use the configured API base URL
    this.baseUrl = ENV_CONFIG.apiBaseUrl || 'http://localhost:8008';
  }

  async getFilterOptions(): Promise<FilterOptionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/documents/filter-options`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Return empty arrays as fallback
      return {
        divisions: [],
        departments: [],
        document_names: [],
        document_ids: [],
      };
    }
  }
}

export const filterService = new FilterService();
