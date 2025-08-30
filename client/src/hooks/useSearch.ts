import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface UseSearchOptions {
  debounceDelay?: number;
  initialQuery?: string;
}

export interface UseSearchReturn {
  searchQuery: string;
  debouncedQuery: string;
  isSearching: boolean;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  setIsSearching: (searching: boolean) => void;
}

/**
 * Custom hook for managing search state with debouncing
 * @param options - Configuration options for the search hook
 * @returns Search state and control functions
 */
export const useSearch = ({
  debounceDelay = 300,
  initialQuery = '',
}: UseSearchOptions = {}): UseSearchReturn => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, debounceDelay);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    debouncedQuery,
    isSearching,
    setSearchQuery,
    clearSearch,
    setIsSearching,
  };
};
