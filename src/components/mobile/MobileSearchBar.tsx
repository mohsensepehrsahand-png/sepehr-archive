"use client";
import { Box, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, useMediaQuery, useTheme } from "@mui/material";
import { Search, FilterList } from "@mui/icons-material";

interface MobileSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  placeholder?: string;
}

export default function MobileSearchBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  placeholder = "جستجو..."
}: MobileSearchBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {/* Search Field */}
        <TextField
          fullWidth
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ 
            '& .MuiInputBase-input': { 
              fontFamily: 'Vazirmatn, Arial, sans-serif' 
            } 
          }}
        />
        
        {/* Filters Row */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>وضعیت</InputLabel>
            <Select
              value={statusFilter}
              label="وضعیت"
              onChange={(e) => onStatusFilterChange(e.target.value)}
              sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
            >
              <MenuItem value="همه" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>همه</MenuItem>
              <MenuItem value="فعال" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>فعال</MenuItem>
              <MenuItem value="آرشیو" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>آرشیو</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1 }}>
            <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>مرتب‌سازی</InputLabel>
            <Select
              value={sortBy}
              label="مرتب‌سازی"
              onChange={(e) => onSortChange(e.target.value)}
              sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
            >
              <MenuItem value="name" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بر اساس نام</MenuItem>
              <MenuItem value="createdAt" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بر اساس تاریخ ایجاد</MenuItem>
              <MenuItem value="documents" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بر اساس تعداد اسناد</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    );
  }

  // Desktop version
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: 3, 
      mb: 4 
    }}>
      <Box sx={{ gridColumn: '1 / 5' }}>
        <TextField
          fullWidth
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
        />
      </Box>
      
      <Box sx={{ gridColumn: '5 / 9' }}>
        <FormControl fullWidth>
          <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>وضعیت</InputLabel>
          <Select
            value={statusFilter}
            label="وضعیت"
            onChange={(e) => onStatusFilterChange(e.target.value)}
            sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
          >
            <MenuItem value="همه" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>همه</MenuItem>
            <MenuItem value="فعال" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>فعال</MenuItem>
            <MenuItem value="آرشیو" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>آرشیو</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ gridColumn: '9 / -1' }}>
        <FormControl fullWidth>
          <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>مرتب‌سازی</InputLabel>
          <Select
            value={sortBy}
            label="مرتب‌سازی"
            onChange={(e) => onSortChange(e.target.value)}
            sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
          >
            <MenuItem value="name" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بر اساس نام</MenuItem>
            <MenuItem value="createdAt" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بر اساس تاریخ ایجاد</MenuItem>
            <MenuItem value="documents" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بر اساس تعداد اسناد</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

