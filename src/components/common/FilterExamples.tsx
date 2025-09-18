"use client";
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTableFilters } from '@/hooks/useTableFilters';
import TableFilters from './TableFilters';
import DateFilter from './DateFilter';
import SearchFilter from './SearchFilter';
import StatusFilter, { StatusOption } from './StatusFilter';

// Example data interface
interface ExampleData {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'inactive' | 'pending';
  amount: number;
}

// Example data
const exampleData: ExampleData[] = [
  { id: '1', name: 'آیتم ۱', date: '2024-01-15', status: 'active', amount: 1000 },
  { id: '2', name: 'آیتم ۲', date: '2024-01-20', status: 'inactive', amount: 2000 },
  { id: '3', name: 'آیتم ۳', date: '2024-02-10', status: 'pending', amount: 1500 },
];

// Status options
const statusOptions: StatusOption[] = [
  { value: 'active', label: 'فعال', color: 'success' },
  { value: 'inactive', label: 'غیرفعال', color: 'error' },
  { value: 'pending', label: 'در انتظار', color: 'warning' },
];

export default function FilterExamples() {
  // Using the filter hook
  const {
    filteredData,
    filters,
    setSearchTerm,
    setDateFilter,
    setCustomFilter,
    clearAllFilters,
    hasActiveFilters
  } = useTableFilters({
    data: exampleData,
    searchFields: ['name'],
    dateField: 'date',
    customFilterFields: {
      status: (item: ExampleData, value: string) => {
        if (value === 'all') return true;
        return item.status === value;
      }
    }
  });

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        نمونه‌های استفاده از کامپوننت‌های فیلتر
      </Typography>

      {/* Example 1: Complete TableFilters component */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          مثال ۱: استفاده از کامپوننت کامل TableFilters
        </Typography>
        <TableFilters
          searchValue={filters.searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="جستجو در نام آیتم‌ها..."
          dateFilter={filters.dateFilter}
          onDateFilterChange={setDateFilter}
          showDateFilter={true}
          statusValue={filters.customFilters.status}
          onStatusChange={(value) => setCustomFilter('status', value)}
          statusOptions={statusOptions}
          showStatusFilter={true}
          onClearAll={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          title="فیلترهای نمونه"
        />
      </Paper>

      {/* Example 2: Individual filter components */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          مثال ۲: استفاده از کامپوننت‌های جداگانه
        </Typography>
        
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Search Filter */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              فیلتر جستجو:
            </Typography>
            <SearchFilter
              value={filters.searchTerm}
              onChange={setSearchTerm}
              placeholder="جستجو در نام..."
              showChip={true}
            />
          </Box>

          {/* Date Filter */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              فیلتر تاریخ:
            </Typography>
            <DateFilter
              onFilterChange={setDateFilter}
              currentFilter={filters.dateFilter}
              showChip={true}
            />
          </Box>

          {/* Status Filter */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              فیلتر وضعیت:
            </Typography>
            <StatusFilter
              value={filters.customFilters.status}
              onChange={(value) => setCustomFilter('status', value)}
              options={statusOptions}
              label="وضعیت"
              showChip={true}
            />
          </Box>
        </Box>
      </Paper>

      {/* Example 3: Inline filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          مثال ۳: فیلترهای درون خطی (Inline)
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            فیلترها:
          </Typography>
          
          <DateFilter
            onFilterChange={setDateFilter}
            currentFilter={filters.dateFilter}
            showChip={true}
            size="small"
          />
          
          <StatusFilter
            value={filters.customFilters.status}
            onChange={(value) => setCustomFilter('status', value)}
            options={statusOptions}
            label="وضعیت"
            showChip={true}
            size="small"
            fullWidth={false}
          />
        </Box>
      </Paper>

      {/* Results */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          نتایج فیلتر شده ({filteredData.length} آیتم):
        </Typography>
        <Box component="pre" sx={{ 
          backgroundColor: 'grey.100', 
          p: 2, 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          overflow: 'auto'
        }}>
          {JSON.stringify(filteredData, null, 2)}
        </Box>
      </Paper>
    </Box>
  );
}
