"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Download,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Assessment,
  Description
} from '@mui/icons-material';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import FinancialReports from './FinancialReports';

interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  accountBalances: Array<{
    id: string;
    balance: number;
    account: {
      name: string;
      type: string;
    };
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    description?: string;
    account: {
      name: string;
      type: string;
    };
  }>;
}

interface InvoiceStats {
  total: number;
  paid: number;
  partial: number;
  unpaid: number;
  totalAmount: number;
  paidAmount: number;
}

interface ReportsTabProps {
  projectId: string;
}

export default function ReportsTab({ projectId }: ReportsTabProps) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats | null>(null);
  const [billStats, setBillStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFinancialReports, setShowFinancialReports] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [projectId, startDate, endDate]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        projectId,
        type: 'summary'
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/accounting/reports?${params}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت گزارش‌ها');
      }
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError('خطا در دریافت گزارش‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceStats = async () => {
    try {
      const params = new URLSearchParams({
        projectId,
        type: 'invoices'
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/accounting/reports?${params}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت آمار فاکتورها');
      }
      const data = await response.json();
      setInvoiceStats(data.stats);
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
    }
  };

  const fetchBillStats = async () => {
    try {
      const params = new URLSearchParams({
        projectId,
        type: 'bills'
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/accounting/reports?${params}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت آمار قبض‌ها');
      }
      const data = await response.json();
      setBillStats(data.stats);
    } catch (error) {
      console.error('Error fetching bill stats:', error);
    }
  };

  const handleDateFilter = () => {
    fetchSummary();
    fetchInvoiceStats();
    fetchBillStats();
  };

  const handleExport = (type: string) => {
    const params = new URLSearchParams({
      projectId,
      type
    });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/api/accounting/export?${params}`;
    window.open(url, '_blank');
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
      {/* Date Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold'
          }}>
            فیلتر تاریخ
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center" mb={2}>
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
              onClick={handleDateFilter}
            >
              اعمال فیلتر
            </Button>
            <Button
              variant="outlined"
              startIcon={<Description />}
              onClick={() => setShowFinancialReports(!showFinancialReports)}
            >
              {showFinancialReports ? 'مخفی کردن گزارش‌های مالی' : 'نمایش گزارش‌های مالی'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {summary && (
        <Grid container spacing={3}>
          {/* Financial Summary */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold'
                }}>
                  خلاصه مالی
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <TrendingUp color="success" />
                    <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      <strong>کل درآمد:</strong> {summary.totalIncome.toLocaleString('fa-IR')} تومان
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <TrendingDown color="error" />
                    <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      <strong>کل هزینه:</strong> {summary.totalExpense.toLocaleString('fa-IR')} تومان
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <AccountBalance color={summary.netIncome >= 0 ? 'success' : 'error'} />
                    <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      <strong>سود/زیان خالص:</strong> {summary.netIncome.toLocaleString('fa-IR')} تومان
                    </Typography>
                  </Box>
                </Box>

                <Box mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExport('transactions')}
                    fullWidth
                  >
                    خروجی Excel تراکنش‌ها
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Balances */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold'
                }}>
                  مانده حساب‌ها
                </Typography>
                
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                          حساب
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                          مانده
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.accountBalances.slice(0, 5).map((ledger) => (
                        <TableRow key={ledger.id}>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {ledger.account.name}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {ledger.balance.toLocaleString('fa-IR')} تومان
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExport('ledgers')}
                    fullWidth
                  >
                    خروجی Excel مانده حساب‌ها
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Transactions */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold'
                }}>
                  تراکنش‌های اخیر
                </Typography>
                
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                          تاریخ
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                          حساب
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                          مبلغ
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                          نوع
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                          توضیحات
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: faIR })}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {transaction.account.name}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {transaction.amount.toLocaleString('fa-IR')} تومان
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.type === 'DEBIT' ? 'بدهکار' : 'بستانکار'}
                              color={transaction.type === 'DEBIT' ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {transaction.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Financial Reports */}
      {showFinancialReports && (
        <Box mt={3}>
          <FinancialReports projectId={projectId} />
        </Box>
      )}
    </Box>
  );
}
