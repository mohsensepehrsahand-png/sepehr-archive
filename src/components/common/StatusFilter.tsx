"use client";
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Clear
} from '@mui/icons-material';

export interface StatusOption {
  value: string;
  label: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

interface StatusFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: StatusOption[];
  label?: string;
  disabled?: boolean;
  showChip?: boolean;
  chipLabel?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export default function StatusFilter({
  value,
  onChange,
  options,
  label = "وضعیت",
  disabled = false,
  showChip = true,
  chipLabel,
  size = 'medium',
  fullWidth = true
}: StatusFilterProps) {
  const handleClear = () => {
    onChange(null);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <FormControl 
        fullWidth={fullWidth} 
        size={size}
        disabled={disabled}
      >
        <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {label}
        </InputLabel>
        <Select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          label={label}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          <MenuItem value="" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            همه
          </MenuItem>
          {options.map((option) => (
            <MenuItem 
              key={option.value} 
              value={option.value}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={option.label}
                  color={option.color || 'default'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {showChip && value && selectedOption && (
        <Chip
          label={chipLabel || selectedOption.label}
          onDelete={handleClear}
          color={selectedOption.color || 'primary'}
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
