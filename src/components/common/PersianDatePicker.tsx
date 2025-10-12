"use client";
import React, { useState, useRef, useEffect } from 'react';
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
  const [internalValue, setInternalValue] = useState<DateObject | null>(null);
  
  // Update internal value when external value changes
  useEffect(() => {
    console.log('PersianDatePicker: useEffect triggered with value:', value);
    
    if (!value || value.trim() === '') {
      console.log('PersianDatePicker: Value is empty, setting to null');
      setInternalValue(null);
    } else {
      try {
        const date = new Date(value);
        console.log('PersianDatePicker: Parsed date:', date);
        
        if (!isNaN(date.getTime())) {
          const persianDate = new DateObject({ date, calendar: persian, locale: persian_fa });
          console.log('PersianDatePicker: Created Persian date:', persianDate);
          setInternalValue(persianDate);
        }
      } catch (error) {
        console.error('PersianDatePicker: Error parsing date:', error);
        setInternalValue(null);
      }
    }
  }, [value]);

  const handleDateChange = (date: DateObject | DateObject[] | null) => {
    console.log('PersianDatePicker: handleDateChange called with:', date);
    
    if (date === null || date === undefined) {
      console.log('PersianDatePicker: Date is null/undefined, clearing value');
      setInternalValue(null);
      onChange('');
      return;
    }
    
    if (Array.isArray(date)) {
      console.log('PersianDatePicker: Date is array, ignoring');
      return;
    }
    
    try {
      setInternalValue(date);
      
      // Convert to ISO string
      const isoDate = date.toDate().toISOString().split('T')[0];
      console.log('PersianDatePicker: Converted to ISO date:', isoDate);
      
      if (isoDate !== 'Invalid Date') {
        onChange(isoDate);
      }
    } catch (error) {
      console.error('PersianDatePicker: Error converting date:', error);
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <FormControl fullWidth={fullWidth} error={error}>
        <Box sx={{ position: 'relative' }}>
          <DatePicker
          value={internalValue}
          onChange={handleDateChange}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-right"
          disabled={disabled}
          hideOnSelect={true}
          autoSelect={false}
          format="YYYY/MM/DD"
          editable={true}
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
