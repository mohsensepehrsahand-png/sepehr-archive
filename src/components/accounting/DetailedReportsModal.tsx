"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close,
  Download,
  Print,
  FilterList,
  Person,
  AccountTree,
  Timeline
} from '@mui/icons-material';

interface DetailedReportsModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  fiscalYearId?: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username: string;
}

interface Stage {
  id: string;
  title: string;
  order: number;
}

interface AccountDetail {
  id: string;
  code: string;
  name: string;
  user?: User;
  subClass: {
    code: string;
    name: string;
    class: {
      code: string;
      name: string;
      group: {
        code: string;
        name: string;
      };
    };
  };
}

interface ReportData {
  documents: any[];
  debts: number;
  credits: number;
  balance: number;
  transactions: any[];
}

export default function DetailedReportsModal({ 
  open, 
  onClose, 
  projectId, 
  fiscalYearId 
}: DetailedReportsModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [accountDetails, setAccountDetails] = useState<AccountDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Filter states
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Report data
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState<'documents' | 'financial' | 'summary'>('summary');

  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open, projectId, fiscalYearId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [usersRes, stagesRes, accountDetailsRes] = await Promise.all([
        fetch('/api/users'),
        fetch(`/api/projects/${projectId}/installment-definitions`),
        fetch(`/api/accounting/coding/details?projectId=${projectId}${fiscalYearId ? `&fiscalYearId=${fiscalYearId}` : ''}`)
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (stagesRes.ok) {
        const stagesData = await stagesRes.json();
        setStages(stagesData);
      }

      if (accountDetailsRes.ok) {
        const accountDetailsData = await accountDetailsRes.json();
        setAccountDetails(accountDetailsData);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('خطا در دریافت اطلاعات اولیه');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        projectId,
        reportType,
        ...(fiscalYearId && { fiscalYearId }),
        ...(selectedUser && { userId: selectedUser }),
        ...(selectedStage && { stageId: selectedStage }),
        ...(selectedAccountDetail && { accountDetailId: selectedAccountDetail }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`/api/accounting/reports/detailed?${params}`);
      if (!response.ok) {
        throw new Error('خطا در تولید گزارش');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'خطا در تولید گزارش');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const params = new URLSearchParams({
      projectId,
      reportType,
      format,
      ...(fiscalYearId && { fiscalYearId }),
      ...(selectedUser && { userId: selectedUser }),
      ...(selectedStage && { stageId: selectedStage }),
      ...(selectedAccountDetail && { accountDetailId: selectedAccountDetail }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });

    const url = `/api/accounting/reports/export?${params}`;
    window.open(url, '_blank');
  };

  const getFilterSummary = () => {
    const filters = [];
    if (selectedUser) {
      const user = users.find(u => u.id === selectedUser);
      filters.push(`کاربر: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}`);
    }
    if (selectedStage) {
      const stage = stages.find(s => s.id === selectedStage);
      filters.push(`مرحله: ${stage?.title}`);
    }
    if (selectedAccountDetail) {
      const detail = accountDetails.find(d => d.id === selectedAccountDetail);
      filters.push(`حساب تفصیلی: ${detail?.name}`);
    }
    if (startDate) filters.push(`از تاریخ: ${startDate}`);
    if (endDate) filters.push(`تا تاریخ: ${endDate}`);
    
    return filters.length > 0 ? filters.join(' | ') : 'بدون فیلتر';
  };

  const renderSummaryReport = () => {
    if (!reportData) return null;

    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  مجموع بدهی‌ها
                </Typography>
                <Typography variant="h4" color="error">
                  {reportData.debts.toLocaleString('fa-IR')} ریال
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  مجموع بستانکاری‌ها
                </Typography>
                <Typography variant="h4" color="success.main">
                  {reportData.credits.toLocaleString('fa-IR')} ریال
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  مانده حساب
                </Typography>
                <Typography 
                  variant="h4" 
                  color={reportData.balance >= 0 ? 'success.main' : 'error'}
                >
                  {reportData.balance.toLocaleString('fa-IR')} ریال
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {reportData.documents.length > 0 && (
          <Card>
            <CardHeader title="اسناد مرتبط" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>شماره سند</TableCell>
                      <TableCell>تاریخ</TableCell>
                      <TableCell>توضیحات</TableCell>
                      <TableCell>بدهکار</TableCell>
                      <TableCell>بستانکار</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.documents.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell>{doc.documentNumber}</TableCell>
                        <TableCell>{new Date(doc.documentDate).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell>{doc.description}</TableCell>
                        <TableCell>{doc.totalDebit?.toLocaleString('fa-IR') || 0}</TableCell>
                        <TableCell>{doc.totalCredit?.toLocaleString('fa-IR') || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  const renderDocumentsReport = () => {
    if (!reportData) return null;

    return (
      <Card>
        <CardHeader title="گزارش اسناد" />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>شماره سند</TableCell>
                  <TableCell>تاریخ</TableCell>
                  <TableCell>مرحله</TableCell>
                  <TableCell>حساب تفصیلی</TableCell>
                  <TableCell>کاربر</TableCell>
                  <TableCell>توضیحات</TableCell>
                  <TableCell>مبلغ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.documents.map((doc, index) => (
                  <TableRow key={index}>
                    <TableCell>{doc.documentNumber}</TableCell>
                    <TableCell>{new Date(doc.documentDate).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>{doc.stage?.title || '-'}</TableCell>
                    <TableCell>
                      {doc.accountDetail?.name || '-'}
                      {doc.user && (
                        <span style={{ color: '#666', fontSize: '0.8rem' }}>
                          {' '}({doc.user.firstName && doc.user.lastName 
                            ? `${doc.user.firstName} ${doc.user.lastName}`
                            : doc.user.username
                          })
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.user ? (
                        doc.user.firstName && doc.user.lastName 
                          ? `${doc.user.firstName} ${doc.user.lastName}`
                          : doc.user.username
                      ) : '-'}
                    </TableCell>
                    <TableCell>{doc.description}</TableCell>
                    <TableCell>{doc.amount?.toLocaleString('fa-IR') || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderFinancialReport = () => {
    if (!reportData) return null;

    return (
      <Card>
        <CardHeader title="گزارش مالی" />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>حساب تفصیلی</TableCell>
                  <TableCell>کاربر</TableCell>
                  <TableCell>مرحله</TableCell>
                  <TableCell>بدهکار</TableCell>
                  <TableCell>بستانکار</TableCell>
                  <TableCell>مانده</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.transactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {transaction.accountDetail?.name || '-'}
                      {transaction.user && (
                        <span style={{ color: '#666', fontSize: '0.8rem' }}>
                          {' '}({transaction.user.firstName && transaction.user.lastName 
                            ? `${transaction.user.firstName} ${transaction.user.lastName}`
                            : transaction.user.username
                          })
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.user ? (
                        transaction.user.firstName && transaction.user.lastName 
                          ? `${transaction.user.firstName} ${transaction.user.lastName}`
                          : transaction.user.username
                      ) : '-'}
                    </TableCell>
                    <TableCell>{transaction.stage?.title || '-'}</TableCell>
                    <TableCell>{transaction.debit?.toLocaleString('fa-IR') || 0}</TableCell>
                    <TableCell>{transaction.credit?.toLocaleString('fa-IR') || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.balance?.toLocaleString('fa-IR') || 0}
                        color={transaction.balance >= 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontFamily: 'Vazirmatn, Arial, sans-serif'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" />
          گزارش‌های تفصیلی
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filter Section */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="فیلترهای گزارش" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>نوع گزارش</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    label="نوع گزارش"
                  >
                    <MenuItem value="summary">خلاصه</MenuItem>
                    <MenuItem value="documents">اسناد</MenuItem>
                    <MenuItem value="financial">مالی</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>کاربر</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    label="کاربر"
                  >
                    <MenuItem value="">
                      <em>همه کاربران</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName} (${user.username})`
                          : user.username
                        }
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>مرحله</InputLabel>
                  <Select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    label="مرحله"
                  >
                    <MenuItem value="">
                      <em>همه مراحل</em>
                    </MenuItem>
                    {stages.map((stage) => (
                      <MenuItem key={stage.id} value={stage.id}>
                        {stage.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>حساب تفصیلی</InputLabel>
                  <Select
                    value={selectedAccountDetail}
                    onChange={(e) => setSelectedAccountDetail(e.target.value)}
                    label="حساب تفصیلی"
                  >
                    <MenuItem value="">
                      <em>همه حساب‌های تفصیلی</em>
                    </MenuItem>
                    {accountDetails.map((detail) => (
                      <MenuItem key={detail.id} value={detail.id}>
                        {detail.name}
                        {detail.user && (
                          <span style={{ color: '#666', fontSize: '0.8rem' }}>
                            {' '}({detail.user.firstName && detail.user.lastName 
                              ? `${detail.user.firstName} ${detail.user.lastName}`
                              : detail.user.username
                            })
                          </span>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="از تاریخ"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تا تاریخ"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <FilterList />}
              >
                تولید گزارش
              </Button>
              {reportData && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExport('pdf')}
                  >
                    دانلود PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExport('excel')}
                  >
                    دانلود Excel
                  </Button>
                </>
              )}
            </Box>

            {getFilterSummary() !== 'بدون فیلتر' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  فیلترهای اعمال شده: {getFilterSummary()}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Report Content */}
        {loading && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}

        {reportData && !loading && (
          <Box>
            {reportType === 'summary' && renderSummaryReport()}
            {reportType === 'documents' && renderDocumentsReport()}
            {reportType === 'financial' && renderFinancialReport()}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
