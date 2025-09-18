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
  Save,
  Print,
  Refresh,
  Edit,
  Check,
  Close,
  Warning,
  CheckCircle,
  Help
} from '@mui/icons-material';
import AccountingSetupGuide from './AccountingSetupGuide';

interface AccountBalance {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
  debitBalance: number;
  creditBalance: number;
  isEditable: boolean;
  willBeClosed: boolean;
  transferredToNextYear: boolean;
}

interface ClosingEntryTabProps {
  projectId: string;
}

export default function ClosingEntryTab({ projectId }: ClosingEntryTabProps) {
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedBalances, setEditedBalances] = useState<{ [key: string]: { debit: number; credit: number } }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialCapital, setInitialCapital] = useState(0);

  useEffect(() => {
    fetchAccountBalances();
  }, [projectId]);

  useEffect(() => {
    calculateTotals();
  }, [accounts, editedBalances]);

  const fetchAccountBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/accounting/closing-entry/balances?projectId=${projectId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در دریافت مانده حساب‌ها');
      }
      
      const data = await response.json();
      setAccounts(data.accounts);
      setIsNewCompany(data.isNewCompany);
      setInitialCapital(data.initialCapital || 0);
    } catch (error) {
      console.error('Error fetching account balances:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت مانده حساب‌ها');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let totalDebitAmount = 0;
    let totalCreditAmount = 0;

    accounts.forEach(account => {
      const edited = editedBalances[account.id];
      const debit = edited ? edited.debit : account.debitBalance;
      const credit = edited ? edited.credit : account.creditBalance;
      
      totalDebitAmount += debit;
      totalCreditAmount += credit;
    });

    setTotalDebit(totalDebitAmount);
    setTotalCredit(totalCreditAmount);
    setIsBalanced(Math.abs(totalDebitAmount - totalCreditAmount) < 0.01);
  };

  const handleEdit = (accountId: string) => {
    setEditingId(accountId);
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setEditedBalances(prev => ({
        ...prev,
        [accountId]: {
          debit: account.debitBalance,
          credit: account.creditBalance
        }
      }));
    }
  };

  const handleSaveEdit = (accountId: string) => {
    setEditingId(null);
  };

  const handleCancelEdit = (accountId: string) => {
    setEditingId(null);
    setEditedBalances(prev => {
      const newBalances = { ...prev };
      delete newBalances[accountId];
      return newBalances;
    });
  };

  const handleBalanceChange = (accountId: string, field: 'debit' | 'credit', value: number) => {
    setEditedBalances(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [field]: value
      }
    }));
  };

  const handleSaveClosingEntry = async () => {
    if (!isBalanced) {
      setError('سند تراز نیست. جمع بدهکار باید برابر جمع بستانکار باشد.');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmClosingEntry = async () => {
    try {
      setSaving(true);
      setError(null);
      setShowConfirmDialog(false);

      const entryData = {
        projectId,
        closingDate,
        initialCapital: isNewCompany ? initialCapital : undefined,
        accounts: accounts.map(account => {
          const edited = editedBalances[account.id];
          return {
            accountId: account.id,
            debit: edited ? edited.debit : account.debitBalance,
            credit: edited ? edited.credit : account.creditBalance,
            willBeClosed: account.willBeClosed,
            transferredToNextYear: account.transferredToNextYear
          };
        })
      };

      const response = await fetch('/api/accounting/closing-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ثبت سند اختتامیه');
      }

      setSuccess('سند اختتامیه با موفقیت ثبت شد و مانده‌ها به سال بعد منتقل شدند');
      setEditedBalances({});
      fetchAccountBalances();
    } catch (error) {
      console.error('Error saving closing entry:', error);
      setError(error instanceof Error ? error.message : 'خطا در ثبت سند اختتامیه');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const getAccountStatus = (account: AccountBalance) => {
    if (account.willBeClosed) {
      return <Chip label="بسته می‌شود" color="error" size="small" />;
    }
    if (account.transferredToNextYear) {
      return <Chip label="منتقل می‌شود" color="success" size="small" />;
    }
    return <Chip label="بدون تغییر" color="default" size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // If no accounts exist, show setup guide
  if (accounts.length === 0) {
    return <AccountingSetupGuide projectId={projectId} currentStep="closing" />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          سند اختتامیه و بستن حساب‌ها
        </Typography>
        <Box>
          <Tooltip title="راهنما">
            <IconButton onClick={() => window.open('/accounting-guide.html', '_blank')}>
              <Help />
            </IconButton>
          </Tooltip>
          <Tooltip title="بروزرسانی">
            <IconButton onClick={fetchAccountBalances}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="چاپ">
            <IconButton onClick={handlePrint}>
              <Print />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isNewCompany && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<CheckCircle />}>
          شرکت تازه‌تأسیس است، سند اختتامیه بدون مانده سال قبل ثبت می‌شود
        </Alert>
      )}

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

      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center" mb={3}>
            <Grid item>
              <TextField
                label="تاریخ سند اختتامیه"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
            </Grid>
            {isNewCompany && (
              <Grid item>
                <TextField
                  label="سرمایه اولیه"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
                  sx={{ minWidth: 200 }}
                />
              </Grid>
            )}
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            مانده حساب‌ها و وضعیت بستن
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>کد حساب</TableCell>
                  <TableCell>نام حساب</TableCell>
                  <TableCell>نوع</TableCell>
                  <TableCell align="center">سطح</TableCell>
                  <TableCell align="right">مانده بدهکار</TableCell>
                  <TableCell align="right">مانده بستانکار</TableCell>
                  <TableCell align="center">وضعیت</TableCell>
                  <TableCell align="center">عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => {
                  const edited = editedBalances[account.id];
                  const currentDebit = edited ? edited.debit : account.debitBalance;
                  const currentCredit = edited ? edited.credit : account.creditBalance;
                  const isEditing = editingId === account.id;

                  return (
                    <TableRow key={account.id}>
                      <TableCell>{account.code}</TableCell>
                      <TableCell>
                        <Box sx={{ paddingLeft: `${account.level * 2}rem` }}>
                          {account.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getAccountTypeLabel(account.type)}
                          color={getAccountTypeColor(account.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{account.level}</TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            type="number"
                            value={currentDebit}
                            onChange={(e) => handleBalanceChange(account.id, 'debit', parseFloat(e.target.value) || 0)}
                            size="small"
                            sx={{ width: 120 }}
                          />
                        ) : (
                          currentDebit.toLocaleString('fa-IR')
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            type="number"
                            value={currentCredit}
                            onChange={(e) => handleBalanceChange(account.id, 'credit', parseFloat(e.target.value) || 0)}
                            size="small"
                            sx={{ width: 120 }}
                          />
                        ) : (
                          currentCredit.toLocaleString('fa-IR')
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {getAccountStatus(account)}
                      </TableCell>
                      <TableCell align="center">
                        {isEditing ? (
                          <Box>
                            <Tooltip title="ذخیره">
                              <IconButton
                                size="small"
                                onClick={() => handleSaveEdit(account.id)}
                                color="primary"
                              >
                                <Check />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="لغو">
                              <IconButton
                                size="small"
                                onClick={() => handleCancelEdit(account.id)}
                                color="error"
                              >
                                <Close />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Tooltip title="ویرایش">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(account.id)}
                              disabled={!account.isEditable}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
              onClick={handleSaveClosingEntry}
              disabled={!isBalanced || saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              sx={{
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontSize: '1.1rem',
                padding: '12px 32px'
              }}
            >
              {saving ? 'در حال ثبت...' : 'ثبت سند اختتامیه'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            تأیید ثبت سند اختتامیه
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            آیا مطمئن هستید که می‌خواهید سند اختتامیه را ثبت کنید؟ این عمل باعث بستن حساب‌های درآمد و هزینه و انتقال مانده‌ها به سال بعد می‌شود.
          </Typography>
          {isNewCompany && (
            <Alert severity="info" sx={{ mt: 2 }}>
              شرکت تازه‌تأسیس است، سرمایه اولیه {initialCapital.toLocaleString('fa-IR')} ریال ثبت خواهد شد.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            لغو
          </Button>
          <Button onClick={confirmClosingEntry} variant="contained" color="primary">
            تأیید و ثبت
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
