"use client";
import React from 'react';
import {
  TextField,
  InputAdornment,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  Clear
} from '@mui/icons-material';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showChip?: boolean;
  chipLabel?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export default function SearchFilter({
  value,
  onChange,
  placeholder = "جستجو...",
  disabled = false,
  showChip = true,
  chipLabel,
  fullWidth = true,
  size = 'medium'
}: SearchFilterProps) {
  const handleClear = () => {
    onChange('');
  };

  const hasValue = value.trim() !== '';

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField
        fullWidth={fullWidth}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        size={size}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: hasValue && (
            <InputAdornment position="end">
              <Tooltip title="پاک کردن جستجو">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  edge="end"
                >
                  <Clear />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
        sx={{ 
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          '& .MuiInputBase-input': {
            fontFamily: 'Vazirmatn, Arial, sans-serif'
          }
        }}
      />
      
      {showChip && hasValue && (
        <Chip
          label={chipLabel || `"${value}"`}
          onDelete={handleClear}
          color="primary"
          variant="outlined"
          size={size}
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontSize: size === 'small' ? '0.75rem' : '0.875rem'
          }}
        />
      )}
    </Box>
  );
}
