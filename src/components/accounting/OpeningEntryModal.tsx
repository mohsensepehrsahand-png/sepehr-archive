"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Autocomplete,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  AttachMoney,
  AccountBalance,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import PersianDatePicker from '../common/PersianDatePicker';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
  fullName: string;
  nature: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
  groupCode?: string;
  groupName?: string;
}

interface AccountEntry {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  nature: 'DEBIT' | 'CREDIT';
}

interface OpeningEntryModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  fiscalYearId: string;
  onSuccess: () => void;
  existingDocument?: {
    id: string;
    documentNumber: string;
    documentDate: string;
    description: string;
    entries: AccountEntry[];
  } | null;
}

export default function OpeningEntryModal({
  open,
  onClose,
  projectId,
  fiscalYearId,
  onSuccess,
  existingDocument
}: OpeningEntryModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    documentNumber: '',
    documentDate: '',
    description: ''
  });

  // Load accounts and existing data when modal opens
  useEffect(() => {
    if (open) {
      loadAccounts();
      if (existingDocument) {
        setFormData({
          documentNumber: existingDocument.documentNumber,
          documentDate: existingDocument.documentDate.split('T')[0],
          description: existingDocument.description
        });
        setEntries(existingDocument.entries);
      } else {
        // Set default values for new document
        setFormData({
          documentNumber: '',
          documentDate: new Date().toISOString().split('T')[0],
          description: 'سند افتتاحیه - مانده اول دوره'
        });
        setEntries([]);
      }
    }
  }, [open, existingDocument]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/opening-entry/usable-accounts?projectId=${projectId}&fiscalYearId=${fiscalYearId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت حساب‌ها');
      }
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('خطا در دریافت حساب‌ها');
    } finally {
      setLoading(false);
    }
  };

  const addEntry = () => {
    const newEntry: AccountEntry = {
      id: Date.now().toString(),
      accountId: '',
      accountCode: '',
      accountName: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
      nature: 'DEBIT'
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const updateEntry = (id: string, field: keyof AccountEntry, value: any) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleAccountSelect = (entryId: string, account: Account | null) => {
    if (account) {
      updateEntry(entryId, 'accountId', account.id);
      updateEntry(entryId, 'accountCode', account.code);
      updateEntry(entryId, 'accountName', account.fullName || account.name);
      updateEntry(entryId, 'nature', account.nature);
      updateEntry(entryId, 'description', `مانده اول دوره - ${account.fullName || account.name}`);
    }
  };

  const calculateTotals = () => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    return { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  };

  const handleSave = async () => {
    const { totalDebit, totalCredit, isBalanced } = calculateTotals();
    
    if (!isBalanced) {
      setError('معادله حسابداری تراز نیست. مجموع بدهکار باید برابر مجموع بستانکار باشد.');
      return;
    }

    if (entries.length === 0) {
      setError('حداقل یک ردیف سند باید اضافه شود.');
      return;
    }

    if (!formData.documentDate) {
      setError('تاریخ سند الزامی است.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const apiEntries = entries.map(entry => ({
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        description: entry.description,
        debit: entry.debitAmount || 0,
        credit: entry.creditAmount || 0,
        amount: entry.nature === 'DEBIT' ? (entry.debitAmount || 0) : (entry.creditAmount || 0),
        accountNature: entry.nature
      }));

      const requestBody = {
        projectId,
        fiscalYearId,
        documentDate: formData.documentDate,
        documentDescription: formData.description,
        entries: apiEntries
      };

      const method = existingDocument ? 'PUT' : 'POST';
      const url = existingDocument 
        ? `/api/accounting/opening-entry?documentId=${existingDocument.id}`
        : '/api/accounting/opening-entry';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ثبت سند افتتاحیه');
      }

      setSuccess('سند افتتاحیه با موفقیت ثبت شد');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error saving opening entry:', error);
      setError(error instanceof Error ? error.message : 'خطا در ثبت سند افتتاحیه');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setEntries([]);
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ 
        sx: { 
          minHeight: '80vh',
          maxHeight: '95vh'
        } 
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: 'Vazirmatn, Arial, sans-serif',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        textAlign: 'center',
        pb: 2
      }}>
        {existingDocument ? 'ویرایش سند افتتاحیه' : 'ایجاد سند افتتاحیه'}
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Document Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}>
              اطلاعات سند
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="شماره سند"
                  fullWidth
                  value={formData.documentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  disabled={existingDocument?.documentNumber}
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                    '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' },
                    '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <PersianDatePicker
                  label="تاریخ سند"
                  value={formData.documentDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, documentDate: date }))}
                  error={!formData.documentDate}
                  helperText={!formData.documentDate ? 'تاریخ سند الزامی است' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="توضیحات"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                    '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' },
                    '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' }
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Entries Section */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                ردیف‌های سند
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addEntry}
                disabled={loading}
                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              >
                افزودن ردیف
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>ردیف</TableCell>
                      <TableCell>حساب</TableCell>
                      <TableCell>توضیحات</TableCell>
                      <TableCell align="right">بدهکار</TableCell>
                      <TableCell align="right">بستانکار</TableCell>
                      <TableCell align="center">عملیات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>
                            هیچ ردیفی اضافه نشده است
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry, index) => (
                        <TableRow key={entry.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <Autocomplete
                              options={accounts}
                              getOptionLabel={(option) => `${option.code} - ${option.name}`}
                              value={accounts.find(acc => acc.id === entry.accountId) || null}
                              onChange={(_, newValue) => handleAccountSelect(entry.id, newValue)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  placeholder="انتخاب حساب"
                                  sx={{ 
                                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                                    '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' }
                                  }}
                                />
                              )}
                              renderOption={(props, option) => (
                                <Box component="li" {...props}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                      {option.code} - {option.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.fullName}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={entry.description}
                              onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                              size="small"
                              fullWidth
                              placeholder="توضیحات"
                              sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' }
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={entry.debitAmount || ''}
                              onChange={(e) => updateEntry(entry.id, 'debitAmount', parseFloat(e.target.value) || 0)}
                              size="small"
                              sx={{ width: 120 }}
                              inputProps={{ min: 0, step: 0.01 }}
                              InputProps={{
                                endAdornment: <Typography variant="caption">ریال</Typography>
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={entry.creditAmount || ''}
                              onChange={(e) => updateEntry(entry.id, 'creditAmount', parseFloat(e.target.value) || 0)}
                              size="small"
                              sx={{ width: 120 }}
                              inputProps={{ min: 0, step: 0.01 }}
                              InputProps={{
                                endAdornment: <Typography variant="caption">ریال</Typography>
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => removeEntry(entry.id)}
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
            )}

            {/* Totals */}
            {entries.length > 0 && (
              <Box mt={2}>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2} sx={{ backgroundColor: 'success.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        مجموع بدهکار
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                        {totalDebit.toLocaleString('fa-IR')} ریال
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2} sx={{ backgroundColor: 'primary.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="primary.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        مجموع بستانکار
                      </Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                        {totalCredit.toLocaleString('fa-IR')} ریال
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2} sx={{ 
                      backgroundColor: isBalanced ? 'success.50' : 'error.50', 
                      borderRadius: 1 
                    }}>
                      <Typography variant="body2" color={isBalanced ? 'success.main' : 'error.main'} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        وضعیت تراز
                      </Typography>
                      <Chip
                        label={isBalanced ? 'تراز' : 'نامتعادل'}
                        color={isBalanced ? 'success' : 'error'}
                        size="small"
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          disabled={saving}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          انصراف
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={saving || !isBalanced || entries.length === 0}
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          {saving ? 'در حال ذخیره...' : 'ذخیره سند'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

