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
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Grid,
  MenuItem
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccountBalance,
  Receipt,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

interface Bank {
  id: string;
  name: string;
  branch?: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  isActive: boolean;
  transactions: BankTransaction[];
}

interface BankTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'RECONCILE';
  amount: number;
  description?: string;
  reference?: string;
  date: string;
}

interface BankManagementProps {
  projectId: string;
}

export default function BankManagement({ projectId }: BankManagementProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    accountNumber: '',
    accountName: '',
    balance: 0
  });
  const [transactionData, setTransactionData] = useState({
    type: 'DEPOSIT' as const,
    amount: 0,
    description: '',
    reference: ''
  });

  useEffect(() => {
    fetchBanks();
  }, [projectId]);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/banks?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات بانک‌ها');
      }
      const data = await response.json();
      setBanks(data);
    } catch (error) {
      console.error('Error fetching banks:', error);
      setError('خطا در دریافت اطلاعات بانک‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (bank?: Bank) => {
    if (bank) {
      setEditingBank(bank);
      setFormData({
        name: bank.name,
        branch: bank.branch || '',
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
        balance: bank.balance
      });
    } else {
      setEditingBank(null);
      setFormData({
        name: '',
        branch: '',
        accountNumber: '',
        accountName: '',
        balance: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBank(null);
    setFormData({
      name: '',
      branch: '',
      accountNumber: '',
      accountName: '',
      balance: 0
    });
  };

  const handleOpenTransactionDialog = (bank: Bank) => {
    setSelectedBank(bank);
    setTransactionData({
      type: 'DEPOSIT',
      amount: 0,
      description: '',
      reference: ''
    });
    setTransactionDialogOpen(true);
  };

  const handleCloseTransactionDialog = () => {
    setTransactionDialogOpen(false);
    setSelectedBank(null);
    setTransactionData({
      type: 'DEPOSIT',
      amount: 0,
      description: '',
      reference: ''
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/accounting/banks', {
        method: editingBank ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...formData,
          id: editingBank?.id
        }),
      });

      if (!response.ok) {
        throw new Error('خطا در ذخیره اطلاعات بانک');
      }

      handleCloseDialog();
      fetchBanks();
    } catch (error) {
      console.error('Error saving bank:', error);
      setError('خطا در ذخیره اطلاعات بانک');
    }
  };

  const handleTransactionSubmit = async () => {
    if (!selectedBank) return;

    try {
      const response = await fetch(`/api/accounting/banks/${selectedBank.id}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error('خطا در ثبت تراکنش بانکی');
      }

      handleCloseTransactionDialog();
      fetchBanks();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('خطا در ثبت تراکنش بانکی');
    }
  };

  const handleDelete = async (bankId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این حساب بانکی را حذف کنید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/accounting/banks/${bankId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('خطا در حذف حساب بانکی');
      }

      fetchBanks();
    } catch (error) {
      console.error('Error deleting bank:', error);
      setError('خطا در حذف حساب بانکی');
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'واریز';
      case 'WITHDRAWAL': return 'برداشت';
      case 'TRANSFER': return 'انتقال';
      case 'RECONCILE': return 'تطبیق';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'success';
      case 'WITHDRAWAL': return 'error';
      case 'TRANSFER': return 'info';
      case 'RECONCILE': return 'warning';
      default: return 'default';
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
              مدیریت حساب‌های بانکی
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              افزودن حساب بانکی
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {banks.map((bank) => (
              <Grid size={{ xs: 12, md: 6 }} key={bank.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {bank.name}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Tooltip title="تراکنش جدید">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenTransactionDialog(bank)}
                          >
                            <Receipt />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ویرایش">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(bank)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(bank.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      mb: 1
                    }}>
                      شعبه: {bank.branch || 'نامشخص'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      mb: 1
                    }}>
                      شماره حساب: {bank.accountNumber}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      mb: 2
                    }}>
                      صاحب حساب: {bank.accountName}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        موجودی:
                      </Typography>
                      <Typography 
                        variant="h6" 
                        color={bank.balance >= 0 ? 'success.main' : 'error.main'}
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      >
                        {bank.balance.toLocaleString('fa-IR')} تومان
                      </Typography>
                    </Box>

                    {bank.transactions && bank.transactions.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          mb: 1
                        }}>
                          تراکنش‌های اخیر:
                        </Typography>
                        {bank.transactions.slice(0, 3).map((transaction) => (
                          <Box key={transaction.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={getTransactionTypeLabel(transaction.type)}
                                color={getTransactionTypeColor(transaction.type) as any}
                                size="small"
                              />
                              <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                {transaction.description || 'بدون توضیح'}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="body2" 
                              color={transaction.type === 'DEPOSIT' ? 'success.main' : 'error.main'}
                              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                            >
                              {transaction.amount.toLocaleString('fa-IR')} تومان
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {banks.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}>
                هیچ حساب بانکی یافت نشد
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Bank Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {editingBank ? 'ویرایش حساب بانکی' : 'افزودن حساب بانکی جدید'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="نام بانک"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="شعبه"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              fullWidth
            />

            <TextField
              label="شماره حساب"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="نام صاحب حساب"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="موجودی اولیه"
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            انصراف
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.accountNumber || !formData.accountName}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            {editingBank ? 'ویرایش' : 'افزودن'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onClose={handleCloseTransactionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          ثبت تراکنش بانکی - {selectedBank?.name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="نوع تراکنش"
              select
              value={transactionData.type}
              onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value as any })}
              fullWidth
            >
              <MenuItem value="DEPOSIT">واریز</MenuItem>
              <MenuItem value="WITHDRAWAL">برداشت</MenuItem>
              <MenuItem value="TRANSFER">انتقال</MenuItem>
              <MenuItem value="RECONCILE">تطبیق</MenuItem>
            </TextField>

            <TextField
              label="مبلغ"
              type="number"
              value={transactionData.amount}
              onChange={(e) => setTransactionData({ ...transactionData, amount: Number(e.target.value) })}
              fullWidth
              required
            />

            <TextField
              label="توضیحات"
              value={transactionData.description}
              onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="شماره مرجع"
              value={transactionData.reference}
              onChange={(e) => setTransactionData({ ...transactionData, reference: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransactionDialog} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            انصراف
          </Button>
          <Button 
            onClick={handleTransactionSubmit} 
            variant="contained"
            disabled={!transactionData.amount}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ثبت تراکنش
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
