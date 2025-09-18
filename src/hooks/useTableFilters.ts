"use client";
import { useState, useCallback, useMemo } from 'react';
import { DateFilterOptions, matchesDateFilter } from '@/components/common/DateFilter';

export interface TableFilterState {
  searchTerm: string;
  dateFilter: DateFilterOptions | null;
  customFilters: Record<string, any>;
}

export interface UseTableFiltersOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  dateField?: keyof T;
  customFilterFields?: Record<string, (item: T, value: any) => boolean>;
}

export function useTableFilters<T>({
  data,
  searchFields,
  dateField,
  customFilterFields = {}
}: UseTableFiltersOptions<T>) {
  const [filters, setFilters] = useState<TableFilterState>({
    searchTerm: '',
    dateFilter: null,
    customFilters: {}
  });

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (filters.searchTerm) {
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(filters.searchTerm.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(filters.searchTerm);
          }
          return false;
        })
      );
    }

    // Apply date filter
    if (filters.dateFilter && dateField) {
      result = result.filter(item => {
        const dateValue = item[dateField];
        if (typeof dateValue === 'string') {
          return matchesDateFilter(dateValue, filters.dateFilter);
        }
        return false;
      });
    }

    // Apply custom filters
    Object.entries(filters.customFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const filterFunction = customFilterFields[key];
        if (filterFunction) {
          result = result.filter(item => filterFunction(item, value));
        }
      }
    });

    return result;
  }, [data, filters, searchFields, dateField, customFilterFields]);

  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setDateFilter = useCallback((filter: DateFilterOptions | null) => {
    setFilters(prev => ({ ...prev, dateFilter: filter }));
  }, []);

  const setCustomFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      customFilters: { ...prev.customFilters, [key]: value }
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      dateFilter: null,
      customFilters: {}
    });
  }, []);

  const clearFilter = useCallback((filterType: 'search' | 'date' | 'custom', key?: string) => {
    setFilters(prev => {
      switch (filterType) {
        case 'search':
          return { ...prev, searchTerm: '' };
        case 'date':
          return { ...prev, dateFilter: null };
        case 'custom':
          if (key) {
            const newCustomFilters = { ...prev.customFilters };
            delete newCustomFilters[key];
            return { ...prev, customFilters: newCustomFilters };
          }
          return prev;
        default:
          return prev;
      }
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm !== '' ||
      (filters.dateFilter && filters.dateFilter.operator !== 'clear') ||
      Object.values(filters.customFilters).some(value => 
        value !== null && value !== undefined && value !== ''
      )
    );
  }, [filters]);

  return {
    filteredData,
    filters,
    setSearchTerm,
    setDateFilter,
    setCustomFilter,
    clearAllFilters,
    clearFilter,
    hasActiveFilters
  };
}
