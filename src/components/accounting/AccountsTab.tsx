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
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Receipt,
  AccountBalance
} from '@mui/icons-material';

interface Account {
  id: string;
  name: string;
  type: string;
  contact?: string;
  description?: string;
  _count: {
    transactions: number;
    invoices: number;
    bills: number;
  };
}

interface AccountsTabProps {
  projectId: string;
}

export default function AccountsTab({ projectId }: AccountsTabProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    contact: '',
    description: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, [projectId]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/accounts?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت حساب‌ها');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('خطا در دریافت حساب‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        contact: account.contact || '',
        description: account.description || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        type: '',
        contact: '',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      type: '',
      contact: '',
      description: ''
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...formData
        }),
      });

      if (!response.ok) {
        throw new Error('خطا در ذخیره حساب');
      }

      handleCloseDialog();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      setError('خطا در ذخیره حساب');
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این حساب را حذف کنید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('خطا در حذف حساب');
      }

      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('خطا در حذف حساب');
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

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'CUSTOMER': return 'primary';
      case 'CONTRACTOR': return 'secondary';
      case 'SUPPLIER': return 'info';
      case 'EXPENSE': return 'error';
      case 'INCOME': return 'success';
      case 'ASSET': return 'warning';
      case 'LIABILITY': return 'error';
      case 'EQUITY': return 'success';
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
              fontWeight: 'bold'
            }}>
              طرف حساب‌ها
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              افزودن حساب جدید
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    نام حساب
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    نوع حساب
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    اطلاعات تماس
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    تراکنش‌ها
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    فاکتورها
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    قبض‌ها
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    عملیات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {account.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getAccountTypeLabel(account.type)}
                        color={getAccountTypeColor(account.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {account.contact || '-'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {account._count.transactions}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {account._count.invoices}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {account._count.bills}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="مشاهده تراکنش‌ها">
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="مشاهده فاکتورها">
                          <IconButton size="small" color="info">
                            <Receipt />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="مشاهده مانده">
                          <IconButton size="small" color="secondary">
                            <AccountBalance />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ویرایش">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(account)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {accounts.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}>
                هیچ حسابی یافت نشد
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Account Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {editingAccount ? 'ویرایش حساب' : 'افزودن حساب جدید'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="نام حساب"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>نوع حساب</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="نوع حساب"
              >
                <MenuItem value="CUSTOMER">مشتری</MenuItem>
                <MenuItem value="CONTRACTOR">پیمانکار</MenuItem>
                <MenuItem value="SUPPLIER">تأمین‌کننده</MenuItem>
                <MenuItem value="EXPENSE">هزینه</MenuItem>
                <MenuItem value="INCOME">درآمد</MenuItem>
                <MenuItem value="ASSET">دارایی</MenuItem>
                <MenuItem value="LIABILITY">بدهی</MenuItem>
                <MenuItem value="EQUITY">سرمایه</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="اطلاعات تماس"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="توضیحات"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
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
            disabled={!formData.name || !formData.type}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            {editingAccount ? 'ویرایش' : 'افزودن'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
