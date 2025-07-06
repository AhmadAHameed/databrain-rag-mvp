// Custom hook for managing filter options from the backend
import { useState, useEffect } from 'react';
import { filterService, type FilterOptionsResponse } from '../services/filterService';

export interface UseFilterOptionsResult {
  filterOptions: FilterOptionsResponse;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFilterOptions = (): UseFilterOptionsResult => {
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse>({
    divisions: [],
    departments: [],
    document_names: [],
    document_ids: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const options = await filterService.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load filter options');
      console.error('Error fetching filter options:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  return {
    filterOptions,
    loading,
    error,
    refetch: fetchFilterOptions,
  };
};
