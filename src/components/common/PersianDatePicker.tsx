"use client";
import React from 'react';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Box, Typography, FormControl } from '@mui/material';
import { DateObject } from 'react-multi-date-picker';

// Add custom styles for the date picker
const customStyles = `
  .persian-date-input {
    font-family: 'Vazirmatn', Arial, sans-serif !important;
    direction: rtl !important;
    text-align: right !important;
    height: 40px !important;
    padding: 8px 12px !important;
    font-size: 0.875rem !important;
    border: 1px solid rgba(0, 0, 0, 0.23) !important;
    border-radius: 4px !important;
    background-color: transparent !important;
    box-sizing: border-box !important;
  }
  
  .persian-date-input:hover {
    border-color: rgba(0, 0, 0, 0.87) !important;
  }
  
  .persian-date-input:focus {
    border-color: #1976d2 !important;
    border-width: 2px !important;
    outline: none !important;
  }
  
  .rmdp-container {
    font-family: 'Vazirmatn', Arial, sans-serif !important;
  }
  
  .rmdp-calendar {
    direction: rtl !important;
  }
  
  .rmdp-day {
    font-family: 'Vazirmatn', Arial, sans-serif !important;
  }
  
  /* Override any default border-radius from the library */
  .rmdp-input {
    border-radius: 4px !important;
  }
`;

interface PersianDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function PersianDatePicker({
  value,
  onChange,
  label = "تاریخ",
  error = false,
  helperText,
  disabled = false,
  fullWidth = true
}: PersianDatePickerProps) {
  
  const handleDateChange = (date: DateObject | DateObject[] | null) => {
    if (date && !Array.isArray(date)) {
      // Convert Persian date to ISO string for storage
      const isoDate = date.toDate().toISOString().split('T')[0];
      onChange(isoDate);
    } else if (date === null) {
      onChange('');
    }
  };

  const getDisplayValue = () => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return new DateObject({ date, calendar: persian, locale: persian_fa });
    } catch {
      return '';
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <FormControl fullWidth={fullWidth} error={error}>
        <Box sx={{ position: 'relative' }}>
          <DatePicker
          value={getDisplayValue()}
          onChange={handleDateChange}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-right"
          disabled={disabled}
          style={{
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            width: '100%',
            height: '40px',
            border: error ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '0.875rem',
            backgroundColor: disabled ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
            direction: 'rtl',
            textAlign: 'right'
          }}
          containerStyle={{
            width: '100%'
          }}
          inputClass="persian-date-input"
          placeholder={label}
        />
        
        {label && (
          <Typography
            variant="body2"
            sx={{
              position: 'absolute',
              top: '-8px',
              left: '14px',
              backgroundColor: 'white',
              padding: '0 4px',
              fontSize: '0.75rem',
              color: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.6)',
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              zIndex: 1
            }}
          >
            {label}
          </Typography>
        )}
      </Box>
      
      {helperText && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{
            mt: 0.5,
            ml: 1.75,
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontSize: '0.75rem'
          }}
        >
          {helperText}
        </Typography>
      )}
    </FormControl>
    </>
  );
}
