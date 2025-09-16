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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  InputAdornment,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AccountBalance,
  Add,
  Edit,
  Delete,
  Sync,
  Receipt,
  TrendingUp,
  TrendingDown,
  ExpandMore,
  Refresh
} from '@mui/icons-material';

interface Bank {
  id: string;
  name: string;
  branch?: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  isActive: boolean;
}

interface BankTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  reference?: string;
  date: string;
}

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface BankIntegrationProps {
  projectId: string;
}

export default function BankIntegration({ projectId }: BankIntegrationProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form state for bank transaction
  const [formData, setFormData] = useState({
    bankId: '',
    type: 'DEPOSIT',
    amount: 0,
    description: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    relatedAccountId: ''
  });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [banksRes, accountsRes] = await Promise.all([
        fetch(`/api/accounting/banks?projectId=${projectId}`),
        fetch(`/api/accounting/accounts?projectId=${projectId}`)
      ]);

      if (!banksRes.ok || !accountsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const banksData = await banksRes.json();
      const accountsData = await accountsRes.json();

      setBanks(banksData);
      setAccounts(accountsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankTransactions = async (bankId: string) => {
    try {
      const response = await fetch(`/api/accounting/banks/${bankId}/transactions`);
      if (response.ok) {
        const data = await response.json();
        setBankTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching bank transactions:', err);
    }
  };

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    if (bankId) {
      fetchBankTransactions(bankId);
    }
  };

  const handleCreateTransaction = () => {
    setFormData({
      bankId: selectedBank,
      type: 'DEPOSIT',
      amount: 0,
      description: '',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      relatedAccountId: ''
    });
    setOpenDialog(true);
  };

  const handleSaveTransaction = async () => {
    try {
      const response = await fetch('/api/accounting/bank-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      setOpenDialog(false);
      if (selectedBank) {
        fetchBankTransactions(selectedBank);
      }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSyncWithAccounting = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/accounting/bank-transactions/${transactionId}/sync`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to sync transaction');
      }

      if (selectedBank) {
        fetchBankTransactions(selectedBank);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels = {
      'DEPOSIT': 'واریز',
      'WITHDRAWAL': 'برداشت',
      'TRANSFER': 'انتقال',
      'RECONCILE': 'تطبیق'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors = {
      'DEPOSIT': 'success',
      'WITHDRAWAL': 'error',
      'TRANSFER': 'info',
      'RECONCILE': 'warning'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" component="h1">
              یکپارچه‌سازی بانکی
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchData}
                sx={{ ml: 1 }}
              >
                بروزرسانی
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateTransaction}
                disabled={!selectedBank}
              >
                ثبت تراکنش
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {banks.map((bank) => (
              <Grid size={{ xs: 12, md: 4 }} key={bank.id}>
                <Card 
                  variant={selectedBank === bank.id ? 'elevated' : 'outlined'}
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedBank === bank.id ? 2 : 1,
                    borderColor: selectedBank === bank.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => handleBankSelect(bank.id)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{bank.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bank.branch && `${bank.branch} - `}
                          {bank.accountNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bank.accountName}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h5" color="primary">
                          {bank.balance.toLocaleString('fa-IR')} ریال
                        </Typography>
                        <Chip
                          label={bank.isActive ? 'فعال' : 'غیرفعال'}
                          color={bank.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {selectedBank && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  تراکنش‌های بانکی - {banks.find(b => b.id === selectedBank)?.name}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>تاریخ</TableCell>
                        <TableCell>نوع</TableCell>
                        <TableCell>مبلغ</TableCell>
                        <TableCell>توضیحات</TableCell>
                        <TableCell>شماره مرجع</TableCell>
                        <TableCell>وضعیت همگام‌سازی</TableCell>
                        <TableCell>عملیات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bankTransactions
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {new Date(transaction.date).toLocaleDateString('fa-IR')}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getTransactionTypeLabel(transaction.type)}
                                color={getTransactionTypeColor(transaction.type) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                color={transaction.type === 'DEPOSIT' ? 'success.main' : 'error.main'}
                                fontWeight="bold"
                              >
                                {transaction.amount.toLocaleString('fa-IR')} ریال
                              </Typography>
                            </TableCell>
                            <TableCell>{transaction.description || '-'}</TableCell>
                            <TableCell>{transaction.reference || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label="همگام شده"
                                color="success"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleSyncWithAccounting(transaction.id)}
                                color="primary"
                              >
                                <Sync />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={bankTransactions.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                  labelRowsPerPage="تعداد ردیف در صفحه:"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} از ${count}`
                  }
                />
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>ثبت تراکنش بانکی</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>بانک</InputLabel>
                <Select
                  value={formData.bankId}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankId: e.target.value }))}
                >
                  {banks.map(bank => (
                    <MenuItem key={bank.id} value={bank.id}>
                      {bank.name} - {bank.accountNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>نوع تراکنش</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="DEPOSIT">واریز</MenuItem>
                  <MenuItem value="WITHDRAWAL">برداشت</MenuItem>
                  <MenuItem value="TRANSFER">انتقال</MenuItem>
                  <MenuItem value="RECONCILE">تطبیق</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="مبلغ"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="تاریخ"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="توضیحات"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="شماره مرجع"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>حساب مرتبط</InputLabel>
                <Select
                  value={formData.relatedAccountId}
                  onChange={(e) => setFormData(prev => ({ ...prev, relatedAccountId: e.target.value }))}
                >
                  {accounts.map(account => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            انصراف
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTransaction}
          >
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
