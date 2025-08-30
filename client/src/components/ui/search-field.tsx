import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  isSearching?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}

/**
 * Reusable search field component with clear button and loading state
 */
export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  isSearching = false,
  fullWidth = true,
  disabled = false,
}) => {
  return (
    <TextField
      fullWidth={fullWidth}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment position="end">
            {isSearching ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton
                size="small"
                onClick={onClear}
                edge="end"
                disabled={disabled}
              >
                <ClearIcon />
              </IconButton>
            )}
          </InputAdornment>
        ),
      }}
    />
  );
};
