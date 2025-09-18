"use client";
import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Divider } from '@mui/material';
import { useTableFilters, TableFilters, DateFilter, SearchFilter, StatusFilter } from './index';
import { StatusOption } from './StatusFilter';

// Example data
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'pending';
  role: 'admin' | 'user' | 'moderator';
}

const sampleUsers: User[] = [
  { id: '1', name: 'احمد محمدی', email: 'ahmad@example.com', createdAt: '2024-01-15', status: 'active', role: 'admin' },
  { id: '2', name: 'فاطمه احمدی', email: 'fateme@example.com', createdAt: '2024-01-20', status: 'inactive', role: 'user' },
  { id: '3', name: 'علی رضایی', email: 'ali@example.com', createdAt: '2024-02-10', status: 'pending', role: 'moderator' },
  { id: '4', name: 'زهرا کریمی', email: 'zahra@example.com', createdAt: '2024-02-15', status: 'active', role: 'user' },
];

const statusOptions: StatusOption[] = [
  { value: 'active', label: 'فعال', color: 'success' },
  { value: 'inactive', label: 'غیرفعال', color: 'error' },
  { value: 'pending', label: 'در انتظار', color: 'warning' },
];

const roleOptions: StatusOption[] = [
  { value: 'admin', label: 'مدیر', color: 'error' },
  { value: 'user', label: 'کاربر', color: 'primary' },
  { value: 'moderator', label: 'ناظر', color: 'warning' },
];

export default function FilterUsageGuide() {
  const [users] = useState<User[]>(sampleUsers);

  // Example 1: Complete TableFilters usage
  const {
    filteredData: filteredUsers1,
    filters: filters1,
    setSearchTerm: setSearchTerm1,
    setDateFilter: setDateFilter1,
    setCustomFilter: setCustomFilter1,
    clearAllFilters: clearAllFilters1,
    hasActiveFilters: hasActiveFilters1
  } = useTableFilters({
    data: users,
    searchFields: ['name', 'email'],
    dateField: 'createdAt',
    customFilterFields: {
      status: (user: User, value: string) => user.status === value,
      role: (user: User, value: string) => user.role === value,
    }
  });

  // Example 2: Individual filter components
  const {
    filteredData: filteredUsers2,
    filters: filters2,
    setSearchTerm: setSearchTerm2,
    setDateFilter: setDateFilter2,
    setCustomFilter: setCustomFilter2,
    clearAllFilters: clearAllFilters2,
    hasActiveFilters: hasActiveFilters2
  } = useTableFilters({
    data: users,
    searchFields: ['name', 'email'],
    dateField: 'createdAt',
    customFilterFields: {
      status: (user: User, value: string) => user.status === value,
    }
  });

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        راهنمای استفاده از کامپوننت‌های فیلتر
      </Typography>

      <Grid container spacing={3}>
        {/* Example 1: Complete TableFilters */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                مثال ۱: استفاده از کامپوننت کامل TableFilters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                این مثال نشان می‌دهد چگونه از کامپوننت TableFilters برای فیلتر کردن کامل استفاده کنید.
              </Typography>
              
              <TableFilters
                searchValue={filters1.searchTerm}
                onSearchChange={setSearchTerm1}
                searchPlaceholder="جستجو در نام و ایمیل کاربران..."
                dateFilter={filters1.dateFilter}
                onDateFilterChange={setDateFilter1}
                showDateFilter={true}
                statusValue={filters1.customFilters.status}
                onStatusChange={(value) => setCustomFilter1('status', value)}
                statusOptions={statusOptions}
                statusLabel="وضعیت"
                showStatusFilter={true}
                onClearAll={clearAllFilters1}
                hasActiveFilters={hasActiveFilters1}
                title="فیلترهای کاربران"
              />

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                نتایج ({filteredUsers1.length} کاربر):
              </Typography>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {JSON.stringify(filteredUsers1, null, 2)}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Example 2: Individual Components */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                مثال ۲: استفاده از کامپوننت‌های جداگانه
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                این مثال نشان می‌دهد چگونه از کامپوننت‌های فیلتر به صورت جداگانه استفاده کنید.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    فیلتر جستجو:
                  </Typography>
                  <SearchFilter
                    value={filters2.searchTerm}
                    onChange={setSearchTerm2}
                    placeholder="جستجو در نام و ایمیل..."
                    showChip={true}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    فیلتر تاریخ:
                  </Typography>
                  <DateFilter
                    onFilterChange={setDateFilter2}
                    currentFilter={filters2.dateFilter}
                    showChip={true}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    فیلتر وضعیت:
                  </Typography>
                  <StatusFilter
                    value={filters2.customFilters.status}
                    onChange={(value) => setCustomFilter2('status', value)}
                    options={statusOptions}
                    label="وضعیت"
                    showChip={true}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    فیلتر نقش:
                  </Typography>
                  <StatusFilter
                    value={filters2.customFilters.role}
                    onChange={(value) => setCustomFilter2('role', value)}
                    options={roleOptions}
                    label="نقش"
                    showChip={true}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                نتایج ({filteredUsers2.length} کاربر):
              </Typography>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {JSON.stringify(filteredUsers2, null, 2)}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Code Examples */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                نمونه کد
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                ۱. Import کردن کامپوننت‌ها:
              </Typography>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflow: 'auto',
                mb: 2
              }}>
{`import { 
  useTableFilters, 
  TableFilters, 
  DateFilter, 
  SearchFilter, 
  StatusFilter 
} from '@/components/common';`}
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                ۲. استفاده از هوک:
              </Typography>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflow: 'auto',
                mb: 2
              }}>
{`const {
  filteredData,
  filters,
  setSearchTerm,
  setDateFilter,
  setCustomFilter,
  clearAllFilters,
  hasActiveFilters
} = useTableFilters({
  data: yourData,
  searchFields: ['name', 'email'],
  dateField: 'createdAt',
  customFilterFields: {
    status: (item, value) => item.status === value
  }
});`}
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                ۳. استفاده در JSX:
              </Typography>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflow: 'auto'
              }}>
{`<TableFilters
  searchValue={filters.searchTerm}
  onSearchChange={setSearchTerm}
  dateFilter={filters.dateFilter}
  onDateFilterChange={setDateFilter}
  onClearAll={clearAllFilters}
  hasActiveFilters={hasActiveFilters}
/>

{filteredData.map(item => (
  <div key={item.id}>{item.name}</div>
))}`}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
