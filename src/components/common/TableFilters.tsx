"use client";
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Collapse
} from '@mui/material';
import {
  FilterList,
  ExpandMore,
  ExpandLess,
  ClearAll
} from '@mui/icons-material';
import SearchFilter from './SearchFilter';
import DateFilter from './DateFilter';
import StatusFilter, { StatusOption } from './StatusFilter';
import { DateFilterOptions } from './DateFilter';

interface TableFiltersProps {
  // Search filter
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Date filter
  dateFilter?: DateFilterOptions | null;
  onDateFilterChange: (filter: DateFilterOptions | null) => void;
  showDateFilter?: boolean;
  
  // Status filter
  statusValue?: string | null;
  onStatusChange?: (value: string | null) => void;
  statusOptions?: StatusOption[];
  statusLabel?: string;
  showStatusFilter?: boolean;
  
  // General
  disabled?: boolean;
  showExpandable?: boolean;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
  title?: string;
}

export default function TableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "جستجو...",
  
  dateFilter,
  onDateFilterChange,
  showDateFilter = true,
  
  statusValue,
  onStatusChange,
  statusOptions = [],
  statusLabel = "وضعیت",
  showStatusFilter = false,
  
  disabled = false,
  showExpandable = false,
  onClearAll,
  hasActiveFilters = false,
  title = "فیلترها"
}: TableFiltersProps) {
  const [expanded, setExpanded] = React.useState(!showExpandable);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterList color="primary" />
          <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {title}
          </Typography>
          {hasActiveFilters && (
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              (فعال)
            </Typography>
          )}
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {onClearAll && hasActiveFilters && (
            <Button
              size="small"
              startIcon={<ClearAll />}
              onClick={onClearAll}
              color="error"
              variant="outlined"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              پاک کردن همه
            </Button>
          )}
          
          {showExpandable && (
            <Button
              size="small"
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              onClick={handleToggleExpanded}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {expanded ? 'بستن' : 'نمایش فیلترها'}
            </Button>
          )}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Search Filter */}
          <SearchFilter
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            disabled={disabled}
            showChip={true}
          />

          {/* Date and Status Filters Row */}
          <Box display="flex" gap={2} alignItems="flex-start">
            {showDateFilter && (
              <Box flex={1}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1, 
                    fontFamily: 'Vazirmatn, Arial, sans-serif' 
                  }}
                >
                  فیلتر تاریخ:
                </Typography>
                <DateFilter
                  onFilterChange={onDateFilterChange}
                  currentFilter={dateFilter}
                  disabled={disabled}
                  showChip={true}
                />
              </Box>
            )}

            {showStatusFilter && onStatusChange && statusOptions.length > 0 && (
              <Box flex={1}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1, 
                    fontFamily: 'Vazirmatn, Arial, sans-serif' 
                  }}
                >
                  فیلتر وضعیت:
                </Typography>
                <StatusFilter
                  value={statusValue || null}
                  onChange={onStatusChange}
                  options={statusOptions}
                  label={statusLabel}
                  disabled={disabled}
                  showChip={true}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
