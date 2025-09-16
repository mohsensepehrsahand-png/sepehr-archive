"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Refresh
} from '@mui/icons-material';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Document {
  id: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  entries: DocumentEntry[];
  totalDebit: number;
  totalCredit: number;
  status: 'TEMPORARY' | 'PERMANENT';
}

interface DocumentEntry {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
}

interface DaybookTabProps {
  projectId: string;
}

export default function DaybookTab({ projectId }: DaybookTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDocuments();
  }, [projectId, searchTerm, startDate, endDate, page]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDocuments();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [projectId, searchTerm, startDate, endDate, page]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        projectId,
        page: page.toString(),
        limit: '20'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/accounting/documents?${params}&status=PERMANENT`);
      if (!response.ok) {
        throw new Error('خطا در دریافت اسناد');
      }
      const data = await response.json();
      setDocuments(data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('خطا در دریافت اسناد');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchDocuments();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    fetchDocuments();
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      projectId,
      type: 'documents',
      status: 'PERMANENT'
    });
    if (searchTerm) params.append('search', searchTerm);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/api/accounting/export?${params}`;
    window.open(url, '_blank');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getJournalTypeLabel = (type: string) => {
    switch (type) {
      case 'DAYBOOK': return 'روزنامه';
      case 'GENERAL_LEDGER': return 'کل';
      case 'SUBSIDIARY': return 'معین';
      default: return type;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'CUSTOMER': return 'مشتری';
      case 'CONTRACTOR': return 'پیمانکار';
      case 'SUPPLIER': return 'تأمین‌کننده';
      case 'EXPENSE': return 'هزینه';
      case 'INCOME': return 'درآمد';
      case 'ASSET': return 'دارایی';
      case 'LIABILITY': return 'بدهی';
      case 'EQUITY': return 'سرمایه';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold'
          }}>
            فیلترها و جستجو
          </Typography>
          
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
            <TextField
              label="جستجو در شماره سند و توضیحات"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
            />

            <TextField
              label="از تاریخ"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="تا تاریخ"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
            >
              جستجو
            </Button>

            <Button
              variant="outlined"
              onClick={handleClearFilters}
            >
              پاک کردن
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              خروجی Excel
            </Button>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchDocuments}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              بروزرسانی
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold'
          }}>
            دفتر روزنامه - نمایش خودکار اسناد ثبت شده
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            mb: 2
          }}>
            این دفتر به صورت خودکار از اسناد ثبت شده در تب "اسناد حسابداری" تشکیل می‌شود.
            هر ردیف از هر سند دائم به صورت جداگانه نمایش داده می‌شود.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              <strong>نکته:</strong> این دفتر به صورت خودکار بروزرسانی می‌شود. 
              برای ثبت سند جدید، از تب "اسناد حسابداری" استفاده کنید.
            </Typography>
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    تاریخ سند
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    شماره سند
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    شرح عملیات
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    کد حساب
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    نام حساب
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    بدهکار
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    بستانکار
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => 
                  document.entries.map((entry, entryIndex) => (
                    <TableRow key={`${document.id}-${entry.id}`}>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {formatDate(document.documentDate)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {document.documentNumber}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {document.description}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {entry.accountCode}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {entry.accountName}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {documents.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}>
                هیچ سند دایمی یافت نشد
              </Typography>
            </Box>
          )}

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
