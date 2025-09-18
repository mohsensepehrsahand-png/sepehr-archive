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
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Download,
  DateRange
} from '@mui/icons-material';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import PersianDatePicker from '../common/PersianDatePicker';

interface FinancialData {
  balanceSheet: {
    assets: Array<{
      name: string;
      code: string;
      amount: number;
      totalAmount: number;
      type: string;
      level: number;
      hasChildren: boolean;
      transactionCount: number;
    }>;
    liabilities: Array<{
      name: string;
      code: string;
      amount: number;
      totalAmount: number;
      type: string;
      level: number;
      hasChildren: boolean;
      transactionCount: number;
    }>;
    equity: Array<{
      name: string;
      code: string;
      amount: number;
      totalAmount: number;
      type: string;
      level: number;
      hasChildren: boolean;
      transactionCount: number;
    }>;
  };
  incomeStatement: {
    revenue: number;
    expenses: number;
    netIncome: number;
    period: string;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    netCashFlow: number;
  };
  hierarchicalData?: {
    assets: any[];
    liabilities: any[];
    equity: any[];
  };
}

interface FinancialReportsProps {
  projectId: string;
}

export default function FinancialReports({ projectId }: FinancialReportsProps) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [reportType, setReportType] = useState('balanceSheet');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterId, setFilterId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchFinancialData();
    fetchAccounts();
    fetchProjects();
  }, [projectId, startDate, endDate, filterType, filterId]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        projectId,
        type: 'financial'
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterType !== 'all') params.append('filterType', filterType);
      if (filterId) params.append('filterId', filterId);

      const response = await fetch(`/api/accounting/reports?${params}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت گزارش‌های مالی');
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError('خطا در دریافت گزارش‌های مالی');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/accounting/accounts?projectId=${projectId}`);
      if (response.ok) {
        const accountsData = await response.json();
        setAccounts(accountsData);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleExport = (type: string) => {
    const params = new URLSearchParams({
      projectId,
      type: 'financial',
      reportType: type
    });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/api/accounting/export?${params}`;
    window.open(url, '_blank');
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'ASSET': return 'دارایی';
      case 'LIABILITY': return 'بدهی';
      case 'EQUITY': return 'سرمایه';
      case 'INCOME': return 'درآمد';
      case 'EXPENSE': return 'هزینه';
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
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <DateRange color="primary" />
            فیلتر تاریخ و نوع گزارش
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
            <Box sx={{ minWidth: 150 }}>
              <PersianDatePicker
                value={startDate}
                onChange={setStartDate}
                label="از تاریخ"
              />
            </Box>
            <Box sx={{ minWidth: 150 }}>
              <PersianDatePicker
                value={endDate}
                onChange={setEndDate}
                label="تا تاریخ"
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>نوع گزارش</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="نوع گزارش"
              >
                <MenuItem value="balanceSheet">ترازنامه</MenuItem>
                <MenuItem value="incomeStatement">صورت سود و زیان</MenuItem>
                <MenuItem value="cashFlow">صورت جریان وجوه نقد</MenuItem>
                <MenuItem value="hierarchical_chart">نمودار سلسله‌مراتبی</MenuItem>
                <MenuItem value="project_analysis">تحلیل پروژه‌ای</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>فیلتر</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterId('');
                }}
                label="فیلتر"
              >
                <MenuItem value="all">همه</MenuItem>
                <MenuItem value="customer">مشتری</MenuItem>
                <MenuItem value="supplier">تأمین‌کننده</MenuItem>
                <MenuItem value="project">پروژه</MenuItem>
              </Select>
            </FormControl>
            {filterType !== 'all' && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>
                  {filterType === 'customer' ? 'انتخاب مشتری' : 
                   filterType === 'supplier' ? 'انتخاب تأمین‌کننده' : 'انتخاب پروژه'}
                </InputLabel>
                <Select
                  value={filterId}
                  onChange={(e) => setFilterId(e.target.value)}
                  label={filterType === 'customer' ? 'انتخاب مشتری' : 
                         filterType === 'supplier' ? 'انتخاب تأمین‌کننده' : 'انتخاب پروژه'}
                >
                  {(filterType === 'customer' || filterType === 'supplier' 
                    ? accounts.filter(a => a.type === filterType.toUpperCase())
                    : projects
                  ).map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button
              variant="contained"
              onClick={fetchFinancialData}
            >
              اعمال فیلتر
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Grid container spacing={3}>
          {/* Balance Sheet */}
          {reportType === 'balanceSheet' && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <AccountBalance color="primary" />
                      ترازنامه
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleExport('balanceSheet')}
                    >
                      خروجی Excel
                    </Button>
                  </Box>

                  <Grid container spacing={3}>
                    {/* Assets */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="h6" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        fontWeight: 'bold',
                        mb: 2,
                        color: 'success.main'
                      }}>
                        دارایی‌ها
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                حساب
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                مبلغ
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                تراکنش‌ها
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.balanceSheet.assets.map((asset, index) => (
                              <TableRow key={index}>
                                <TableCell sx={{ 
                                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                                  paddingLeft: asset.level * 2 + 2,
                                  fontWeight: asset.hasChildren ? 'bold' : 'normal'
                                }}>
                                  {asset.code} - {asset.name}
                                  {asset.hasChildren && ' (گروه)'}
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                  {asset.totalAmount.toLocaleString('fa-IR')} تومان
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                  {asset.transactionCount} تراکنش
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                مجموع دارایی‌ها
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                {data.balanceSheet.assets.reduce((sum, asset) => sum + asset.totalAmount, 0).toLocaleString('fa-IR')} تومان
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>

                    {/* Liabilities & Equity */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="h6" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        fontWeight: 'bold',
                        mb: 2,
                        color: 'error.main'
                      }}>
                        بدهی‌ها و سرمایه
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                حساب
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                مبلغ
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                تراکنش‌ها
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.balanceSheet.liabilities.map((liability, index) => (
                              <TableRow key={index}>
                                <TableCell sx={{ 
                                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                                  paddingLeft: liability.level * 2 + 2,
                                  fontWeight: liability.hasChildren ? 'bold' : 'normal'
                                }}>
                                  {liability.code} - {liability.name}
                                  {liability.hasChildren && ' (گروه)'}
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                  {liability.totalAmount.toLocaleString('fa-IR')} تومان
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                  {liability.transactionCount} تراکنش
                                </TableCell>
                              </TableRow>
                            ))}
                            {data.balanceSheet.equity.map((equity, index) => (
                              <TableRow key={index}>
                                <TableCell sx={{ 
                                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                                  paddingLeft: equity.level * 2 + 2,
                                  fontWeight: equity.hasChildren ? 'bold' : 'normal'
                                }}>
                                  {equity.code} - {equity.name}
                                  {equity.hasChildren && ' (گروه)'}
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                  {equity.totalAmount.toLocaleString('fa-IR')} تومان
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                  {equity.transactionCount} تراکنش
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                مجموع بدهی‌ها و سرمایه
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                {(data.balanceSheet.liabilities.reduce((sum, liability) => sum + liability.totalAmount, 0) + 
                                  data.balanceSheet.equity.reduce((sum, equity) => sum + equity.totalAmount, 0)).toLocaleString('fa-IR')} تومان
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Income Statement */}
          {reportType === 'incomeStatement' && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <TrendingUp color="primary" />
                      صورت سود و زیان
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleExport('incomeStatement')}
                    >
                      خروجی Excel
                    </Button>
                  </Box>

                  <TableContainer component={Paper}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                            درآمد کل
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                            {data.incomeStatement.revenue.toLocaleString('fa-IR')} تومان
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            هزینه‌های کل
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {data.incomeStatement.expenses.toLocaleString('fa-IR')} تومان
                          </TableCell>
                        </TableRow>
                        <Divider />
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                            سود/زیان خالص
                          </TableCell>
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif', 
                            fontWeight: 'bold',
                            color: data.incomeStatement.netIncome >= 0 ? 'success.main' : 'error.main'
                          }}>
                            {data.incomeStatement.netIncome.toLocaleString('fa-IR')} تومان
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Cash Flow Statement */}
          {reportType === 'cashFlow' && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <TrendingDown color="primary" />
                      صورت جریان وجوه نقد
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleExport('cashFlow')}
                    >
                      خروجی Excel
                    </Button>
                  </Box>

                  <TableContainer component={Paper}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                            جریان نقدی عملیاتی
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {data.cashFlow.operating.toLocaleString('fa-IR')} تومان
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            جریان نقدی سرمایه‌گذاری
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {data.cashFlow.investing.toLocaleString('fa-IR')} تومان
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            جریان نقدی تأمین مالی
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {data.cashFlow.financing.toLocaleString('fa-IR')} تومان
                          </TableCell>
                        </TableRow>
                        <Divider />
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                            جریان نقدی خالص
                          </TableCell>
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif', 
                            fontWeight: 'bold',
                            color: data.cashFlow.netCashFlow >= 0 ? 'success.main' : 'error.main'
                          }}>
                            {data.cashFlow.netCashFlow.toLocaleString('fa-IR')} تومان
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
