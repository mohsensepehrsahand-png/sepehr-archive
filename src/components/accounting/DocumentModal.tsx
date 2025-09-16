"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import {
  Add,
  Delete,
  Search
} from '@mui/icons-material';
import AccountSelectorModal from './AccountSelectorModal';

interface DocumentEntry {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
}

interface Document {
  id: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  entries: DocumentEntry[];
  totalDebit: number;
  totalCredit: number;
  status: 'TEMPORARY' | 'PERMANENT';
}

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (document: Omit<Document, 'id'>) => void;
  document?: Document | null;
  isEditMode: boolean;
  projectId: string;
}

export default function DocumentModal({
  open,
  onClose,
  onSave,
  document,
  isEditMode,
  projectId
}: DocumentModalProps) {
  const [formData, setFormData] = useState({
    documentNumber: '',
    documentDate: '',
    description: ''
  });
  const [entries, setEntries] = useState<DocumentEntry[]>([]);
  const [accountSelectorOpen, setAccountSelectorOpen] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [nextDocumentNumber, setNextDocumentNumber] = useState('');
  const [permanentConfirmOpen, setPermanentConfirmOpen] = useState(false);
  const [pendingDocumentData, setPendingDocumentData] = useState<Omit<Document, 'id'> | null>(null);

  useEffect(() => {
    if (open) {
      if (document && isEditMode) {
        // Check if document is permanent and prevent editing
        if (document.status === 'PERMANENT') {
          setError('اسناد دائم قابل ویرایش نیستند');
          return;
        }
        
        // Format date for input field (YYYY-MM-DD)
        const formattedDate = document.documentDate.includes('T') 
          ? document.documentDate.split('T')[0]
          : document.documentDate;
        
        setFormData({
          documentNumber: document.documentNumber,
          documentDate: formattedDate,
          description: document.description
        });
        setEntries(document.entries);
      } else {
        fetchNextDocumentNumber();
        setFormData({
          documentNumber: '',
          documentDate: new Date().toISOString().split('T')[0],
          description: ''
        });
        setEntries([]);
      }
      setError('');
    }
  }, [open, document, isEditMode]);

  const fetchNextDocumentNumber = async () => {
    try {
      const response = await fetch(`/api/accounting/documents/next-number?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setNextDocumentNumber(data.nextNumber);
        setFormData(prev => ({
          ...prev,
          documentNumber: data.nextNumber
        }));
      }
    } catch (error) {
      console.error('Error fetching next document number:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEntryChange = (index: number, field: string, value: string | number) => {
    setEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updatedEntry = { ...entry, [field]: value };
        
        // Validate account nature when changing debit/credit
        if (field === 'debit' || field === 'credit') {
          const accountNature = updatedEntry.accountNature;
          const debit = field === 'debit' ? value as number : updatedEntry.debit;
          const credit = field === 'credit' ? value as number : updatedEntry.credit;
          
          // Check if the entry violates account nature rules
          if (accountNature === 'DEBIT' && credit > 0) {
            setError('این حساب ماهیت بدهکار دارد و نمی‌توانید مبلغ بستانکار وارد کنید');
            return entry; // Don't update if validation fails
          }
          if (accountNature === 'CREDIT' && debit > 0) {
            setError('این حساب ماهیت بستانکار دارد و نمی‌توانید مبلغ بدهکار وارد کنید');
            return entry; // Don't update if validation fails
          }
        }
        
        return updatedEntry;
      }
      return entry;
    }));
  };

  const handleAddEntry = () => {
    const newEntry: DocumentEntry = {
      id: Date.now().toString(),
      accountCode: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const handleDeleteEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectAccount = (accountCode: string, accountName: string, accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT') => {
    if (selectedEntryIndex !== null) {
      handleEntryChange(selectedEntryIndex, 'accountCode', accountCode);
      handleEntryChange(selectedEntryIndex, 'accountName', accountName);
      handleEntryChange(selectedEntryIndex, 'accountNature', accountNature);
      // Clear debit and credit when selecting new account
      handleEntryChange(selectedEntryIndex, 'debit', 0);
      handleEntryChange(selectedEntryIndex, 'credit', 0);
    }
    setAccountSelectorOpen(false);
    setSelectedEntryIndex(null);
  };

  const openAccountSelector = (index: number) => {
    setSelectedEntryIndex(index);
    setAccountSelectorOpen(true);
  };

  const calculateTotals = () => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    return { totalDebit, totalCredit };
  };

  const handleSave = () => {
    if (!formData.documentNumber || !formData.documentDate) {
      setError('شماره سند و تاریخ سند الزامی است');
      return;
    }

    if (entries.length === 0) {
      setError('حداقل یک ردیف باید اضافه شود');
      return;
    }

    // Check if there are any valid entries before filtering
    const hasValidEntries = entries.some(entry => 
      entry.accountCode && entry.accountName && (entry.debit > 0 || entry.credit > 0)
    );

    if (!hasValidEntries) {
      setError('حداقل یک ردیف معتبر باید اضافه شود');
      return;
    }

    // Filter out empty entries
    const validEntries = entries.filter(entry => 
      entry.accountCode && entry.accountName && (entry.debit > 0 || entry.credit > 0)
    );

    // Recalculate totals for valid entries
    const validTotalDebit = validEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const validTotalCredit = validEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

    // Validate balance again for valid entries
    if (validTotalDebit !== validTotalCredit) {
      setError('جمع بدهکار باید برابر جمع بستانکار باشد');
      return;
    }

    // Clean entries to ensure no circular references
    const cleanEntries = validEntries.map(entry => ({
      id: entry.id,
      accountCode: entry.accountCode,
      accountName: entry.accountName,
      description: entry.description || '',
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      accountNature: entry.accountNature
    }));

    const documentData: Omit<Document, 'id'> = {
      documentNumber: formData.documentNumber,
      documentDate: formData.documentDate,
      description: formData.description || '',
      entries: cleanEntries,
      totalDebit: validTotalDebit,
      totalCredit: validTotalCredit,
      status: 'TEMPORARY' // Default to temporary
    };

    // Show confirmation dialog for permanent status
    setPendingDocumentData(documentData);
    setPermanentConfirmOpen(true);
  };

  const handleConfirmPermanent = () => {
    if (pendingDocumentData) {
      const permanentData = { ...pendingDocumentData, status: 'PERMANENT' as const };
      onSave(permanentData);
      setPermanentConfirmOpen(false);
      setPendingDocumentData(null);
    }
  };

  const handleConfirmTemporary = () => {
    if (pendingDocumentData) {
      onSave(pendingDocumentData);
      setPermanentConfirmOpen(false);
      setPendingDocumentData(null);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = totalDebit === totalCredit;
  const isPermanentDocument = document?.status === 'PERMANENT';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {isEditMode ? 'ویرایش سند' : 'افزودن سند جدید'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="شماره سند"
                value={formData.documentNumber}
                onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                required
                disabled={isPermanentDocument}
                helperText="شماره سند به صورت خودکار اختصاص می‌یابد"
                sx={{ '& .MuiInputBase-input': { textAlign: 'center' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="تاریخ سند"
                type="date"
                value={formData.documentDate}
                onChange={(e) => handleInputChange('documentDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                disabled={isPermanentDocument}
                helperText="تاریخ امروز به صورت خودکار تنظیم می‌شود"
                sx={{ '& .MuiInputBase-input': { textAlign: 'center' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="توضیحات سند"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={1}
                disabled={isPermanentDocument}
                sx={{ '& .MuiInputBase-input': { textAlign: 'center' } }}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
            ردیف‌های سند
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ textAlign: 'center' }}>کد حساب</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>نام حساب</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>ماهیت</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>بدهکار</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>بستانکار</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>شرح</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                        <TextField
                          size="small"
                          value={entry.accountCode}
                          onChange={(e) => handleEntryChange(index, 'accountCode', e.target.value)}
                          placeholder="کد حساب"
                          disabled={isPermanentDocument}
                          sx={{ minWidth: 120 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => openAccountSelector(index)}
                          color="primary"
                          disabled={isPermanentDocument}
                        >
                          <Search />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={entry.accountName}
                        onChange={(e) => handleEntryChange(index, 'accountName', e.target.value)}
                        placeholder="نام حساب"
                        disabled={isPermanentDocument}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={
                          entry.accountNature === 'DEBIT' ? 'بدهکار' :
                          entry.accountNature === 'CREDIT' ? 'بستانکار' :
                          entry.accountNature === 'DEBIT_CREDIT' ? 'بدهکار-بستانکار' : '-'
                        }
                        color={
                          entry.accountNature === 'DEBIT' ? 'error' :
                          entry.accountNature === 'CREDIT' ? 'success' :
                          entry.accountNature === 'DEBIT_CREDIT' ? 'warning' : 'default'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={entry.debit}
                        onChange={(e) => handleEntryChange(index, 'debit', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        sx={{ minWidth: 100 }}
                        disabled={isPermanentDocument || entry.accountNature === 'CREDIT'}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={entry.credit}
                        onChange={(e) => handleEntryChange(index, 'credit', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        sx={{ minWidth: 100 }}
                        disabled={isPermanentDocument || entry.accountNature === 'DEBIT'}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={entry.description}
                        onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                        placeholder="شرح"
                        disabled={isPermanentDocument}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEntry(index)}
                        color="error"
                        disabled={isPermanentDocument}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        هیچ ردیفی اضافه نشده است
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {/* Totals Row */}
                {entries.length > 0 && (
                  <TableRow sx={{ backgroundColor: 'grey.50', fontWeight: 'bold' }}>
                    <TableCell sx={{ textAlign: 'center' }} colSpan={3}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        جمع کل
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={totalDebit.toLocaleString('fa-IR')}
                        color="error"
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={totalCredit.toLocaleString('fa-IR')}
                        color="success"
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }} colSpan={2}>
                      <Chip
                        label={isBalanced ? 'تراز' : 'نامتعادل'}
                        color={isBalanced ? 'success' : 'error'}
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add Row Button - Centered below table */}
          {!isPermanentDocument && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddEntry}
                size="small"
              >
                افزودن ردیف
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            لغو
          </Button>
          {!isPermanentDocument && (
            <Button 
              onClick={handleSave} 
              variant="contained"
              disabled={!isBalanced || entries.length === 0}
            >
              {isEditMode ? 'به‌روزرسانی' : 'ذخیره'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <AccountSelectorModal
        open={accountSelectorOpen}
        onClose={() => setAccountSelectorOpen(false)}
        onSelect={handleSelectAccount}
        projectId={projectId}
      />

      <Dialog
        open={permanentConfirmOpen}
        onClose={() => setPermanentConfirmOpen(false)}
      >
        <DialogTitle>تأیید وضعیت سند</DialogTitle>
        <DialogContent>
          <Typography>
            آیا می‌خواهید این سند را به صورت دائم ثبت کنید؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            اسناد دائم قابل ویرایش نیستند و فقط می‌توانند حذف شوند.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermanentConfirmOpen(false)}>
            لغو
          </Button>
          <Button onClick={handleConfirmTemporary} color="warning">
            ثبت موقت
          </Button>
          <Button onClick={handleConfirmPermanent} color="success" variant="contained">
            ثبت دائم
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
