"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PersianDatePicker from '../common/PersianDatePicker';

interface Account {
  id: string;
  name: string;
  type: string;
  level: number;
  parentId?: string;
  children?: Account[];
}

interface Document {
  id: string;
  name: string;
  filePath: string;
}

interface NewTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

const transactionSchema = z.object({
  accountId: z.string().min(1, 'انتخاب حساب الزامی است'),
  detailedAccountId: z.string().optional(),
  date: z.string().min(1, 'تاریخ الزامی است'),
  amount: z.string().min(1, 'مبلغ الزامی است').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'مبلغ باید عدد مثبت باشد'),
  type: z.enum(['DEBIT', 'CREDIT'], { required_error: 'نوع تراکنش الزامی است' }),
  journalType: z.enum(['DAYBOOK', 'GENERAL_LEDGER', 'SUBSIDIARY'], { required_error: 'نوع دفتر الزامی است' }),
  description: z.string().optional(),
  documentId: z.string().optional()
}).refine((data) => {
  // If account is a subsidiary account (CUSTOMER, CONTRACTOR, SUPPLIER), detailedAccountId must be provided
  const selectedAccount = accounts.find(acc => acc.id === data.accountId);
  const subsidiaryAccountTypes = ['CUSTOMER', 'CONTRACTOR', 'SUPPLIER'];
  if (selectedAccount && subsidiaryAccountTypes.includes(selectedAccount.type) && !data.detailedAccountId) {
    return false;
  }
  return true;
}, {
  message: 'برای حساب معین انتخاب شده، انتخاب حساب تفصیلی الزامی است',
  path: ['detailedAccountId']
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function NewTransactionDialog({ open, onClose, projectId, onSuccess }: NewTransactionDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [detailedAccounts, setDetailedAccounts] = useState<Account[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: '',
      detailedAccountId: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      type: 'DEBIT',
      journalType: 'DAYBOOK',
      description: '',
      documentId: ''
    }
  });

  const watchedAccountId = watch('accountId');

  useEffect(() => {
    if (open) {
      fetchAccounts();
      fetchDocuments();
    }
  }, [open, projectId]);

  useEffect(() => {
    if (watchedAccountId) {
      const selectedAccount = accounts.find(acc => acc.id === watchedAccountId);
      const subsidiaryAccountTypes = ['CUSTOMER', 'CONTRACTOR', 'SUPPLIER'];
      if (selectedAccount && subsidiaryAccountTypes.includes(selectedAccount.type)) {
        fetchDetailedAccounts(selectedAccount.type);
      } else {
        setDetailedAccounts([]);
        setValue('detailedAccountId', '');
      }
    } else {
      setDetailedAccounts([]);
      setValue('detailedAccountId', '');
    }
  }, [watchedAccountId, accounts, setValue]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/accounting/accounts?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت حساب‌ها');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchDetailedAccounts = async (accountType: string) => {
    try {
      // For now, we'll use the same accounts API but filter by type
      // In a real implementation, you might want to create specific detailed accounts
      const response = await fetch(`/api/accounting/accounts?projectId=${projectId}&type=${accountType}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت حساب‌های تفصیلی');
      }
      const data = await response.json();
      setDetailedAccounts(data);
    } catch (error) {
      console.error('Error fetching detailed accounts:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت اسناد');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/accounting/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...data,
          amount: parseFloat(data.amount)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ثبت تراکنش');
      }

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError(error instanceof Error ? error.message : 'خطا در ثبت تراکنش');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    onClose();
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        ثبت تراکنش جدید
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            {/* Account Selection */}
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.accountId}>
                  <InputLabel>حساب</InputLabel>
                  <Select
                    {...field}
                    label="حساب"
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        <Box display="flex" alignItems="center" gap={1} width="100%">
                          <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {account.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            mr: 'auto'
                          }}>
                            {getAccountTypeLabel(account.type)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />



            {/* Test - Always show for testing */}
            {watchedAccountId && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  تست: حساب انتخاب شده - {watchedAccountId}
                </Alert>
                <Alert severity="info" sx={{ mb: 2 }}>
                  برای حساب معین انتخاب شده، انتخاب حساب تفصیلی الزامی است
                </Alert>
                <Controller
                  name="detailedAccountId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.detailedAccountId}>
                      <InputLabel>حساب تفصیلی *</InputLabel>
                      <Select
                        {...field}
                        label="حساب تفصیلی *"
                      >
                        {detailedAccounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                              {account.name}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.detailedAccountId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {errors.detailedAccountId.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Box>
            )}

            {/* Date and Amount */}
            <Box display="flex" gap={2}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <PersianDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    label="تاریخ سند"
                    error={!!errors.date}
                    helperText={errors.date?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="مبلغ (تومان)"
                    type="number"
                    fullWidth
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                  />
                )}
              />
            </Box>

            {/* Transaction Type and Journal Type */}
            <Box display="flex" gap={2}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>نوع تراکنش</InputLabel>
                    <Select
                      {...field}
                      label="نوع تراکنش"
                    >
                      <MenuItem value="DEBIT">بدهکار</MenuItem>
                      <MenuItem value="CREDIT">بستانکار</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="journalType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.journalType}>
                    <InputLabel>نوع دفتر</InputLabel>
                    <Select
                      {...field}
                      label="نوع دفتر"
                    >
                      <MenuItem value="DAYBOOK">روزنامه</MenuItem>
                      <MenuItem value="GENERAL_LEDGER">کل</MenuItem>
                      <MenuItem value="SUBSIDIARY">معین</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="توضیحات"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            {/* Document Selection */}
            <Controller
              name="documentId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>سند مرتبط (اختیاری)</InputLabel>
                  <Select
                    {...field}
                    label="سند مرتبط (اختیاری)"
                  >
                    <MenuItem value="">
                      <Typography color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        بدون سند
                      </Typography>
                    </MenuItem>
                    {documents.map((document) => (
                      <MenuItem key={document.id} value={document.id}>
                        <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {document.name}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={isSubmitting}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            انصراف
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isSubmitting}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'ثبت تراکنش'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
