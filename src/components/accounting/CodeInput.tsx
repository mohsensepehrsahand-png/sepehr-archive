"use client";
import { useState, useEffect } from "react";
import { TextField, Box, Typography, Chip, Alert } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

interface CodeInputProps {
  prefix?: string[];
  onCodeChange?: (fullCode: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
  validateCode?: (code: string) => boolean;
  formatCode?: (code: string) => string;
}

const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Vazirmatn, Arial, sans-serif',
  },
});

export default function CodeInput({ 
  prefix = [], 
  onCodeChange,
  placeholder = "___",
  maxLength = 3,
  disabled = false,
  error = false,
  helperText,
  label,
  required = false,
  validateCode,
  formatCode
}: CodeInputProps) {
  const [code, setCode] = useState("");
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    const fullCode = [...prefix, code].join('');
    onCodeChange?.(fullCode);
  }, [code, prefix, onCodeChange]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Only allow numbers and limit length
    if (/^\d*$/.test(value) && value.length <= maxLength) {
      setCode(value);
      
      // Apply formatting if provided
      if (formatCode) {
        value = formatCode(value);
      }
      
      // Validate code if validator provided
      if (validateCode) {
        const isValid = validateCode(value);
        setValidationError(!isValid);
      }
    }
  };


  const handleBlur = () => {
    // Apply zero padding only on blur for 2-digit inputs
    if (maxLength === 2 && code.length === 1) {
      setCode(code.padStart(2, '0'));
    }
  };

  const getFullCode = () => {
    const fullCode = [...prefix, code].join('');
    return fullCode;
  };

  return (
    <ThemeProvider theme={theme}>
      <Box>
        {label && (
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            {label}
            {required && <span style={{ color: '#d32f2f', marginLeft: 4 }}>*</span>}
          </Typography>
        )}
        
        <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap" dir="ltr">
          {prefix.map((part, idx) => (
            <Box key={idx} display="flex" alignItems="center">
              <Chip
                label={part}
                size="small"
                sx={{
                  backgroundColor: "#f5f5f5",
                  color: "#666",
                  fontWeight: 500,
                  minWidth: 32,
                  height: 32,
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
              />
            </Box>
          ))}
          
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: "#ffffff",
              border: `1px solid ${(error || validationError) ? '#d32f2f' : '#c4c4c4'}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled ? 'default' : 'text',
              position: 'relative',
              '&:hover': {
                borderColor: (error || validationError) ? '#d32f2f' : '#1976d2',
              },
              '&:focus-within': {
                borderColor: (error || validationError) ? '#d32f2f' : '#1976d2',
                borderWidth: 2,
              }
            }}
          >
            <input
              value={code}
              onChange={handleCodeChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                textAlign: 'center',
                direction: 'ltr',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 500,
                color: '#666',
                width: '28px',
                height: '28px',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}
            />
          </Box>
        </Box>
        
        {(error || validationError) && helperText && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ 
              mt: 0.5, 
              display: 'block',
              fontSize: '12px'
            }}
          >
            {validationError ? 'کد وارد شده معتبر نیست' : helperText}
          </Typography>
        )}
        
        {getFullCode() && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              mt: 1, 
              display: 'block',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 'bold',
              direction: 'ltr',
              textAlign: 'right'
            }}
          >
            کد کامل: {getFullCode()}
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );
}
