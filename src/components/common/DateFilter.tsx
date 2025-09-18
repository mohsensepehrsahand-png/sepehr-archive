"use client";
import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Chip
} from '@mui/material';
import {
  FilterList,
  Clear
} from '@mui/icons-material';
import DateFilterModal, { DateFilterOptions, matchesDateFilter } from '../accounting/DateFilterModal';

interface DateFilterProps {
  onFilterChange: (filter: DateFilterOptions | null) => void;
  currentFilter?: DateFilterOptions | null;
  disabled?: boolean;
  size?: 'small' | 'medium';
  showChip?: boolean;
  chipLabel?: string;
  tooltipTitle?: string;
}

export default function DateFilter({
  onFilterChange,
  currentFilter,
  disabled = false,
  size = 'small',
  showChip = true,
  chipLabel,
  tooltipTitle = 'فیلتر تاریخ'
}: DateFilterProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleFilterApply = (filter: DateFilterOptions) => {
    onFilterChange(filter.operator === 'clear' ? null : filter);
    setModalOpen(false);
  };

  const handleClearFilter = () => {
    onFilterChange(null);
  };

  const getFilterDisplayText = () => {
    if (!currentFilter || currentFilter.operator === 'clear') return '';
    
    if (currentFilter.operator === 'between') {
      return `بین ${currentFilter.startDate} تا ${currentFilter.endDate}`;
    }
    
    const operatorLabels = {
      'equals': 'برابر با',
      'not_equals': 'مخالف',
      'less_than': 'کمتر از',
      'greater_than': 'بیشتر از',
      'less_than_or_equals': 'کمتر یا مساوی',
      'greater_than_or_equals': 'بیشتر یا مساوی'
    };
    
    const label = operatorLabels[currentFilter.operator] || currentFilter.operator;
    return `${label} ${currentFilter.singleDate}`;
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title={tooltipTitle}>
        <IconButton
          size={size}
          onClick={() => setModalOpen(true)}
          disabled={disabled}
          sx={{
            p: size === 'small' ? 0.5 : 1,
            color: currentFilter ? 'primary.main' : 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <FilterList fontSize={size} />
        </IconButton>
      </Tooltip>
      
      {showChip && currentFilter && currentFilter.operator !== 'clear' && (
        <Chip
          label={chipLabel || getFilterDisplayText()}
          onDelete={handleClearFilter}
          color="primary"
          variant="outlined"
          size={size}
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontSize: size === 'small' ? '0.75rem' : '0.875rem'
          }}
        />
      )}

      <DateFilterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApply={handleFilterApply}
        currentFilter={currentFilter}
      />
    </Box>
  );
}

// Export the helper function for external use
export { matchesDateFilter, type DateFilterOptions };
