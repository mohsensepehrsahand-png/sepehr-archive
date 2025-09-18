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
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Save,
  Print,
  Refresh,
  Edit,
  Check,
  Close,
  Help,
  Delete
} from '@mui/icons-material';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
}

interface OpeningEntryItem {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  description: string;
}

interface OpeningEntryTabProps {
  projectId: string;
}

export default function OpeningEntryTab({ projectId }: OpeningEntryTabProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entryItems, setEntryItems] = useState<OpeningEntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentDescription, setDocumentDescription] = useState('سند افتتاحیه - مانده اول دوره');
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [projectId]);

  useEffect(() => {
    calculateTotals();
  }, [entryItems]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
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

  const calculateTotals = () => {
    let totalDebitAmount = 0;
    let totalCreditAmount = 0;

    entryItems.forEach(item => {
      totalDebitAmount += item.debit;
      totalCreditAmount += item.credit;
    });

    setTotalDebit(totalDebitAmount);
    setTotalCredit(totalCreditAmount);
    setIsBalanced(Math.abs(totalDebitAmount - totalCreditAmount) < 0.01);
  };

  const addEntryItem = () => {
    const newItem: OpeningEntryItem = {
      id: Date.now().toString(),
      accountId: '',
      accountCode: '',
      accountName: '',
      accountType: '',
      debit: 0,
      credit: 0,
      description: ''
    };
    setEntryItems([...entryItems, newItem]);
  };

  const removeEntryItem = (id: string) => {
    setEntryItems(entryItems.filter(item => item.id !== id));
  };

  const updateEntryItem = (id: string, field: keyof OpeningEntryItem, value: any) => {
    setEntryItems(entryItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If account is selected, update account details
        if (field === 'accountId' && value) {
          const selectedAccount = accounts.find(acc => acc.id === value);
          if (selectedAccount) {
            updatedItem.accountCode = selectedAccount.code;
            updatedItem.accountName = selectedAccount.name;
            updatedItem.accountType = selectedAccount.type;
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!isBalanced) {
      setError('سند تراز نیست. جمع بدهکار باید برابر جمع بستانکار باشد.');
      return;
    }

    if (entryItems.length === 0) {
      setError('حداقل یک ردیف سند باید اضافه شود.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const entryData = {
        projectId,
        documentDate,
        documentDescription,
        accounts: entryItems.map(item => ({
          accountId: item.accountId,
          debit: item.debit,
          credit: item.credit,
          description: item.description
        }))
      };

      const response = await fetch('/api/accounting/opening-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ثبت سند افتتاحیه');
      }

      setSuccess('سند افتتاحیه با موفقیت ثبت شد');
      setEntryItems([]);
      setDocumentDescription('سند افتتاحیه - مانده اول دوره');
    } catch (error) {
      console.error('Error saving opening entry:', error);
      setError(error instanceof Error ? error.message : 'خطا در ثبت سند افتتاحیه');
    } finally {
      setSaving(false);
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET':
        return 'success';
      case 'LIABILITY':
        return 'warning';
      case 'EQUITY':
        return 'info';
      case 'INCOME':
        return 'primary';
      case 'EXPENSE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'ASSET':
        return 'دارایی';
      case 'LIABILITY':
        return 'بدهی';
      case 'EQUITY':
        return 'حقوق صاحبان سهام';
      case 'INCOME':
        return 'درآمد';
      case 'EXPENSE':
        return 'هزینه';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // If no accounts exist, show setup message
  if (accounts.length === 0) {
    return (
      <Box>
        <Typography variant="h5" component="h2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 3 }}>
          سند افتتاحیه
        </Typography>

        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                ابتدا باید حساب‌های حسابداری ایجاد کنید
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                برای ثبت سند افتتاحیه، ابتدا باید کدینگ حسابداری پروژه را راه‌اندازی کنید.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => window.location.href = `/accounting/${projectId}?tab=0`}
                sx={{
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontSize: '1.1rem',
                  padding: '12px 32px'
                }}
              >
                رفتن به کدینگ حسابداری
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          سند افتتاحیه
        </Typography>
        <Box>
          <Tooltip title="راهنما">
            <IconButton onClick={() => window.open('/accounting-guide.html', '_blank')}>
              <Help />
            </IconButton>
          </Tooltip>
          <Tooltip title="بروزرسانی">
            <IconButton onClick={fetchAccounts}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="چاپ">
            <IconButton onClick={() => window.print()}>
              <Print />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          <strong>راهنما:</strong> برای ثبت سند افتتاحیه، ابتدا حساب‌ها را انتخاب کرده و مانده اول دوره را وارد کنید.
          <br />
          <strong>نکته:</strong> سند باید تراز باشد (جمع بدهکار = جمع بستانکار)
        </Typography>
      </Alert>

      <Card>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="تاریخ سند"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="شرح سند"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              ردیف‌های سند افتتاحیه
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addEntryItem}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              افزودن ردیف
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>حساب</TableCell>
                  <TableCell>نوع</TableCell>
                  <TableCell align="right">بدهکار</TableCell>
                  <TableCell align="right">بستانکار</TableCell>
                  <TableCell>شرح</TableCell>
                  <TableCell align="center">عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        هیچ ردیفی اضافه نشده است. روی "افزودن ردیف" کلیک کنید.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  entryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <InputLabel>انتخاب حساب</InputLabel>
                          <Select
                            value={item.accountId}
                            onChange={(e) => updateEntryItem(item.id, 'accountId', e.target.value)}
                            label="انتخاب حساب"
                          >
                            {accounts.map((account) => (
                              <MenuItem key={account.id} value={account.id}>
                                <Box sx={{ paddingLeft: `${account.level * 1}rem` }}>
                                  {account.code} - {account.name}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {item.accountType && (
                          <Chip
                            label={getAccountTypeLabel(item.accountType)}
                            color={getAccountTypeColor(item.accountType) as any}
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.debit}
                          onChange={(e) => updateEntryItem(item.id, 'debit', parseFloat(e.target.value) || 0)}
                          size="small"
                          sx={{ width: 120 }}
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.credit}
                          onChange={(e) => updateEntryItem(item.id, 'credit', parseFloat(e.target.value) || 0)}
                          size="small"
                          sx={{ width: 120 }}
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={item.description}
                          onChange={(e) => updateEntryItem(item.id, 'description', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="شرح ردیف"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => removeEntryItem(item.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2} justifyContent="space-between" alignItems="center">
            <Grid item>
              <Box display="flex" gap={2}>
                <Typography variant="h6">
                  جمع بدهکار: {totalDebit.toLocaleString('fa-IR')}
                </Typography>
                <Typography variant="h6">
                  جمع بستانکار: {totalCredit.toLocaleString('fa-IR')}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Chip
                label={isBalanced ? 'سند تراز است' : 'سند تراز نیست'}
                color={isBalanced ? 'success' : 'error'}
                variant="outlined"
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="center" mt={3}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={!isBalanced || saving || entryItems.length === 0}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              sx={{
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontSize: '1.1rem',
                padding: '12px 32px'
              }}
            >
              {saving ? 'در حال ثبت...' : 'ثبت سند افتتاحیه'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}