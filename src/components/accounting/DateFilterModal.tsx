"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  FilterList,
  Clear,
  CalendarToday
} from '@mui/icons-material';
import PersianDatePicker from '../common/PersianDatePicker';

export interface DateFilterOptions {
  operator: 'equals' | 'not_equals' | 'less_than' | 'greater_than' | 'less_than_or_equals' | 'greater_than_or_equals' | 'between' | 'clear';
  singleDate?: string;
  startDate?: string;
  endDate?: string;
}

interface DateFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filter: DateFilterOptions) => void;
  currentFilter?: DateFilterOptions | null;
}

const operatorOptions = [
  { value: 'equals', label: 'برابر باشد با', icon: '=' },
  { value: 'not_equals', label: 'برابر نباشد با', icon: '≠' },
  { value: 'less_than', label: 'کوچکتر باشد از', icon: '<' },
  { value: 'greater_than', label: 'بزرگتر باشد از', icon: '>' },
  { value: 'less_than_or_equals', label: 'کوچکتر یا مساوی باشد با', icon: '≤' },
  { value: 'greater_than_or_equals', label: 'بزرگتر یا مساوی باشد با', icon: '≥' },
  { value: 'between', label: 'بین', icon: '—' }
];

export default function DateFilterModal({ open, onClose, onApply, currentFilter }: DateFilterModalProps) {
  const [operator, setOperator] = useState<DateFilterOptions['operator']>(
    currentFilter?.operator || 'equals'
  );
  const [singleDate, setSingleDate] = useState(currentFilter?.singleDate || '');
  const [startDate, setStartDate] = useState(currentFilter?.startDate || '');
  const [endDate, setEndDate] = useState(currentFilter?.endDate || '');

  const handleApply = () => {
    const filter: DateFilterOptions = {
      operator,
      ...(operator === 'between' ? { startDate, endDate } : { singleDate })
    };
    onApply(filter);
    onClose();
  };

  const handleClear = () => {
    setOperator('equals');
    setSingleDate('');
    setStartDate('');
    setEndDate('');
    onApply({ operator: 'clear' });
    onClose();
  };

  const isBetween = operator === 'between';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', textAlign: 'right' }}>
        فیلتر تاریخ سند
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              نوع فیلتر
            </InputLabel>
            <Select
              value={operator}
              onChange={(e) => setOperator(e.target.value as DateFilterOptions['operator'])}
              label="نوع فیلتر"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {operatorOptions.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ minWidth: '20px', textAlign: 'center' }}>
                      {option.icon}
                    </Typography>
                    <Typography>{option.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(
            <Box>
              {isBetween ? (
                <Box display="flex" gap={2} alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <PersianDatePicker
                      value={startDate}
                      onChange={setStartDate}
                      label="تاریخ شروع"
                    />
                  </Box>
                  <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    تا
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <PersianDatePicker
                      value={endDate}
                      onChange={setEndDate}
                      label="تاریخ پایان"
                    />
                  </Box>
                </Box>
              ) : (
                <PersianDatePicker
                  value={singleDate}
                  onChange={setSingleDate}
                  label="تاریخ"
                />
              )}
            </Box>
          )}

          {currentFilter && currentFilter.operator !== 'clear' && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                فیلتر فعلی:
              </Typography>
              <Chip
                label={
                  currentFilter.operator === 'between' 
                    ? `بین ${currentFilter.startDate} تا ${currentFilter.endDate}`
                    : `${operatorOptions.find(opt => opt.value === currentFilter.operator)?.label} ${currentFilter.singleDate}`
                }
                onDelete={() => handleClear()}
                color="primary"
                variant="outlined"
                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button
          onClick={handleClear}
          startIcon={<Clear />}
          color="error"
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          حذف فیلتر
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          startIcon={<FilterList />}
          disabled={(isBetween && (!startDate || !endDate)) || (!isBetween && !singleDate)}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          اعمال فیلتر
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Helper function to check if a date matches the filter criteria
export const matchesDateFilter = (dateString: string, filter: DateFilterOptions | null): boolean => {
  if (!filter || filter.operator === 'clear') return true;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  switch (filter.operator) {
    case 'equals':
      return filter.singleDate ? date.toISOString().split('T')[0] === filter.singleDate : true;
    
    case 'not_equals':
      return filter.singleDate ? date.toISOString().split('T')[0] !== filter.singleDate : true;
    
    case 'less_than':
      return filter.singleDate ? date < new Date(filter.singleDate) : true;
    
    case 'greater_than':
      return filter.singleDate ? date > new Date(filter.singleDate) : true;
    
    case 'less_than_or_equals':
      return filter.singleDate ? date <= new Date(filter.singleDate) : true;
    
    case 'greater_than_or_equals':
      return filter.singleDate ? date >= new Date(filter.singleDate) : true;
    
    case 'between':
      if (!filter.startDate || !filter.endDate) return true;
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      return date >= startDate && date <= endDate;
    
    default:
      return true;
  }
};
