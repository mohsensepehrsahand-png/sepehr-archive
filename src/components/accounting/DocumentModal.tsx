"use client";
import { useState, useEffect, useMemo } from 'react';
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
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import PersianDatePicker from '../common/PersianDatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Add,
  Delete,
  Search,
  Send,
  ArrowDropDown,
  Check,
  Description
} from '@mui/icons-material';
import AccountSelectorModal from './AccountSelectorModal';
import CommonDescriptionsModal from './CommonDescriptionsModal';

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
  const [customRowCount, setCustomRowCount] = useState<number>(1);
  const [addRowMenuAnchor, setAddRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsFlat, setAccountsFlat] = useState<any[]>([]);
  const [codingFlat, setCodingFlat] = useState<Array<{ fullCode: string; name: string; nature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT' }>>([]);
  const [commonDescriptionsOpen, setCommonDescriptionsOpen] = useState(false);

  const codeOptions = useMemo(() => {
    return (codingFlat || []).map(o => ({
      code: o.fullCode,
      name: o.name,
      nature: o.nature
    }));
  }, [codingFlat]);

  const flattenAccounts = (list: any[]): any[] => {
    const result: any[] = [];
    if (!Array.isArray(list)) return result;

    // stack items as { node, parentFull }
    const stack: Array<{ node: any; parentFull: string }> = [...list.map((n) => ({ node: n, parentFull: '' }))];

    while (stack.length) {
      const { node, parentFull } = stack.shift()!;
      if (!node) continue;

      const thisCode = normalizeAccountCode(node.code ?? (node as any)?.accountCode ?? (node as any)?.displayCode ?? '');
      const full = `${parentFull}${thisCode}`;
      const nodeWithFull = { ...node, __fullCode: full };
      result.push(nodeWithFull);

      const childrenKeys = ['children', 'items', 'nodes'];
      for (const key of childrenKeys) {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            stack.push({ node: child, parentFull: full });
          }
        }
      }
    }
    return result;
  };

  const fetchCodingFlat = async () => {
    try {
      const resp = await fetch(`/api/accounting/coding/groups?projectId=${projectId}`);
      if (!resp.ok) return setCodingFlat([]);
      const groups = await resp.json();
      const out: Array<{ fullCode: string; name: string; nature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT' }> = [];
      if (Array.isArray(groups)) {
        for (const g of groups) {
          const gFull = String(g.code || '');
          if (gFull) out.push({ fullCode: gFull, name: g.name });
          const classes = (g.classes || []) as any[];
          for (const c of classes) {
            const cFull = gFull + String(c.code || '');
            if (cFull) out.push({ fullCode: cFull, name: c.name, nature: c.nature });
            const subs = (c.subClasses || []) as any[];
            for (const s of subs) {
              const sFull = cFull + String(s.code || '');
              if (sFull) out.push({ fullCode: sFull, name: s.name, nature: c.nature });
              const details = (s.details || []) as any[];
              for (const d of details) {
                const dFull = sFull + String(d.code || '');
                if (dFull) out.push({ fullCode: dFull, name: d.name, nature: c.nature });
              }
            }
          }
        }
      }
      setCodingFlat(out);
      return out;
    } catch (e) {
      setCodingFlat([]);
      return [] as Array<{ fullCode: string; name: string; nature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT' }>;
    }
  };

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
        // Add 2 empty rows by default
        const defaultEntries: DocumentEntry[] = [
          {
            id: Date.now().toString(),
            accountCode: '',
            accountName: '',
            description: '',
            debit: 0,
            credit: 0
          },
          {
            id: (Date.now() + 1).toString(),
            accountCode: '',
            accountName: '',
            description: '',
            debit: 0,
            credit: 0
          }
        ];
        setEntries(defaultEntries);
      }
      setError('');
      fetchAccounts();
      fetchCodingFlat();
    }
  }, [open, document, isEditMode, projectId]);

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

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/accounting/accounts?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        const flat = flattenAccounts(data);
        setAccounts(data);
        setAccountsFlat(flat);
        return flat as any[];
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
    return [] as any[];
  };

  const validateAccountCode = (accountCode: string, list?: any[]) => {
    console.log('Validating account code:', accountCode);

    // 1) Try codingFlat first
    const normalizedInput = normalizeAccountCode(accountCode);
    const codingSource = codingFlat && codingFlat.length ? codingFlat : [];
    const codingHit = codingSource.find(cf => normalizeAccountCode(cf.fullCode) === normalizedInput);
    if (codingHit) {
      console.log('Found in codingFlat:', codingHit);
      return { name: codingHit.name, nature: codingHit.nature } as any;
    }

    // 2) Fallback to accounts lists
    const source = (list && list.length ? list : (accountsFlat && accountsFlat.length ? accountsFlat : flattenAccounts(accounts)));

    const account = source.find(acc => {
      const candidates = [
        acc.code,
        (acc as any)?.accountCode,
        (acc as any)?.fullCode,
        (acc as any)?.displayCode,
        (acc as any)?.__fullCode
      ];
      return candidates.some(c => normalizeAccountCode(c) === normalizedInput);
    });

    if (!account) {
      console.log('Sample codes:', codingSource.slice(0, 10));
    }

    console.log('Found account:', account);
    return account;
  };

  const handleAccountCodeKeyPress = (index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const entry = entries[index];
      const accountCode = entry.accountCode.trim();

      if (accountCode) {
        const apply = (hit: any) => {
          if (hit) {
            const name = (hit as any).name ?? (hit as any)?.name;
            const nature = (hit as any).nature as any;
            handleEntryChange(index, 'accountName', name || '');
            handleEntryChange(index, 'accountNature', nature);
            handleEntryChange(index, 'debit', 0);
            handleEntryChange(index, 'credit', 0);
            setError('');
            return true;
          }
          return false;
        };

        // Ensure codingFlat is ready
        const ensureData = async () => {
          if (!codingFlat.length) await fetchCodingFlat();
          let hit = validateAccountCode(accountCode);
          if (apply(hit)) return;

          // Ensure accounts also ready as fallback
          if (!accountsFlat.length) await fetchAccounts();
          hit = validateAccountCode(accountCode);
          if (!apply(hit)) {
            setError(`کد حساب ${accountCode} یافت نشد. لطفاً از آیکن جستجو استفاده کنید.`);
          }
        };

        ensureData();
      }
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

  const handleAddMultipleEntries = (count: number) => {
    const newEntries: DocumentEntry[] = Array.from({ length: count }, (_, index) => ({
      id: `${Date.now()}-${index}`,
      accountCode: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0
    }));
    setEntries(prev => [...prev, ...newEntries]);
  };

  const handleTransferDescription = () => {
    if (formData.description.trim()) {
      setEntries(prev => prev.map(entry => ({
        ...entry,
        description: formData.description
      })));
    }
  };

  const handleSelectCommonDescription = (description: string) => {
    setFormData(prev => ({
      ...prev,
      description: description
    }));
  };

  const handleAddRowMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAddRowMenuAnchor(event.currentTarget);
  };

  const handleAddRowMenuClose = () => {
    setAddRowMenuAnchor(null);
    setShowCustomInput(false);
    setCustomInputValue('');
  };

  const handleAddRows = (count: number) => {
    handleAddMultipleEntries(count);
    handleAddRowMenuClose();
  };

  const handleCustomRowSubmit = () => {
    const count = parseInt(customInputValue);
    if (count > 0 && count <= 20) {
      handleAddRows(count);
    }
  };

  const handleMainButtonClick = () => {
    handleAddEntry();
  };

  const getInputValue = (entryId: string, field: 'debit' | 'credit') => {
    const key = `${entryId}-${field}`;
    return inputValues[key] || '';
  };

  const setInputValue = (entryId: string, field: 'debit' | 'credit', value: string) => {
    const key = `${entryId}-${field}`;
    setInputValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const convertToEnglishDigits = (str: string) => {
    if (!str) return '';
    const persianZeroCharCode = '۰'.charCodeAt(0);
    const arabicIndicZeroCharCode = '۰'.charCodeAt(0); // fallback
    const arabicZeroCharCode = '٠'.charCodeAt(0);
    return str.replace(/[۰-۹٠-٩]/g, (d) => {
      const code = d.charCodeAt(0);
      let en = '';
      if (code >= '۰'.charCodeAt(0) && code <= '۹'.charCodeAt(0)) {
        en = String(code - '۰'.charCodeAt(0));
      } else if (code >= '٠'.charCodeAt(0) && code <= '٩'.charCodeAt(0)) {
        en = String(code - '٠'.charCodeAt(0));
      }
      return en;
    });
  };

  const handleNumberInputChange = (index: number, field: 'debit' | 'credit', value: string) => {
    const entry = entries[index];
    const key = `${entry.id}-${field}`;

    // Normalize Persian/Arabic digits to English first
    const normalized = convertToEnglishDigits(value);
    // Keep only digits and optional decimal point, remove separators like , و ، و ٬
    const cleanValue = normalized.replace(/[٬،,]/g, '').replace(/[^\d.]/g, '');

    // Format with 3-digit separators for display (then convert to Persian digits)
    const formattedValue = formatNumberWithSeparators(cleanValue);

    // Update input value (store formatted for display)
    setInputValues(prev => ({
      ...prev,
      [key]: formattedValue
    }));

    // Update the actual entry value (store clean number)
    const numValue = parseFloat(cleanValue) || 0;
    handleEntryChange(index, field, numValue);
  };

  const formatNumberWithSeparators = (value: string) => {
    if (!value) return '';

    // Split by decimal point
    const parts = value.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Convert to Persian digits
    const persianInteger = convertToPersianDigits(formattedInteger);
    const persianDecimal = decimalPart ? convertToPersianDigits(decimalPart) : '';

    // Combine with decimal part if exists
    return persianDecimal ? `${persianInteger}.${persianDecimal}` : persianInteger;
  };

  const convertToPersianDigits = (str: string) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  };

  const normalizeAccountCode = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    const s = String(val);
    // convert Persian/Arabic digits to English and strip ALL non-digits
    const en = convertToEnglishDigits(s);
    return en.replace(/\D/g, '');
  };

  const handleDeleteEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectAccount = (accountCode: string, accountName: string, accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT') => {
    if (selectedEntryIndex !== null) {
      handleEntryChange(selectedEntryIndex, 'accountCode', accountCode);
      handleEntryChange(selectedEntryIndex, 'accountName', accountName);
      handleEntryChange(selectedEntryIndex, 'accountNature', (accountNature ?? '') as any);
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
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle>
          {isEditMode ? 'ویرایش سند' : 'افزودن سند جدید'}
        </DialogTitle>
        <DialogContent sx={{ minHeight: '70vh', p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box sx={{ 
            p: 2, 
            mb: 3, 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: 2, 
            backgroundColor: 'grey.50' 
          }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="شماره سند"
                  value={formData.documentNumber}
                  onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  required
                  disabled={isPermanentDocument}
                  sx={{ 
                    '& .MuiInputBase-input': { textAlign: 'center', fontSize: '0.875rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <PersianDatePicker
                  value={formData.documentDate}
                  onChange={(date) => handleInputChange('documentDate', date)}
                  label="تاریخ سند"
                  disabled={isPermanentDocument}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="شرح کل سند (برای همه ردیف‌ها)"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={isPermanentDocument}
                    placeholder="شرح وارد شده برای همه ردیف‌ها اعمال می‌شود"
                    sx={{ 
                      '& .MuiInputBase-input': { textAlign: 'right', fontSize: '0.75rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                    }}
                  />
                  <IconButton
                    onClick={() => setCommonDescriptionsOpen(true)}
                    color="info"
                    disabled={isPermanentDocument}
                    title="شرح‌های پر استفاده"
                    size="small"
                  >
                    <Description fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={handleTransferDescription}
                    color="primary"
                    disabled={isPermanentDocument || !formData.description.trim()}
                    title="انتقال به سند"
                    size="small"
                  >
                    <Send fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="h6" sx={{ textAlign: 'center', mb: 3, mt: 2 }}>
            ردیف‌های سند
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ textAlign: 'center', width: '15%', py: 1 }}>کد حساب</TableCell>
                  <TableCell sx={{ textAlign: 'center', width: '20%', py: 1 }}>نام حساب</TableCell>
                  <TableCell sx={{ textAlign: 'center', width: '10%', py: 1 }}>ماهیت</TableCell>
                  <TableCell sx={{ textAlign: 'center', width: '15%', py: 1 }}>بدهکار</TableCell>
                  <TableCell sx={{ textAlign: 'center', width: '15%', py: 1 }}>بستانکار</TableCell>
                  <TableCell sx={{ textAlign: 'center', width: '15%', py: 1 }}>شرح</TableCell>
                  <TableCell sx={{ textAlign: 'center', width: '5%', py: 1 }}>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={entry.id} sx={{ '& .MuiTableCell-root': { py: 0.5 } }}>
                    <TableCell sx={{ textAlign: 'center', width: '15%' }}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Autocomplete
                          disablePortal
                          options={codeOptions}
                          freeSolo
                          inputValue={entry.accountCode || ''}
                          onInputChange={(_, newInput) => {
                            handleEntryChange(index, 'accountCode', newInput);
                            if (!newInput) {
                              handleEntryChange(index, 'accountName', '');
                              handleEntryChange(index, 'accountNature', '' as any);
                              handleEntryChange(index, 'debit', 0);
                              handleEntryChange(index, 'credit', 0);
                            }
                          }}
                          getOptionLabel={(opt: any) => (opt && typeof opt === 'object' ? opt.code : String(opt || ''))}
                          renderOption={(props, option: any) => (
                            <li {...props} key={`${option.code}-${option.name}`}>
                              <Box display="flex" justifyContent="space-between" width="100%">
                                <Typography sx={{ fontFamily: 'monospace' }}>{option.code}</Typography>
                                <Typography>{option.name}</Typography>
                              </Box>
                            </li>
                          )}
                          filterOptions={(opts, state) => {
                            const q = normalizeAccountCode(convertToEnglishDigits(state.inputValue || ''));
                            if (!q) return opts.slice(0, 10);
                            return opts.filter(o => normalizeAccountCode(o.code).startsWith(q)).slice(0, 20);
                          }}
                          onChange={(_, val) => {
                            if (val) {
                              handleEntryChange(index, 'accountCode', val.code);
                              handleEntryChange(index, 'accountName', val.name);
                              if (val.nature) {
                                handleEntryChange(index, 'accountNature', val.nature as any);
                              } else {
                                handleEntryChange(index, 'accountNature', '' as any);
                              }
                              handleEntryChange(index, 'debit', 0);
                              handleEntryChange(index, 'credit', 0);
                              setError('');
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                              placeholder="کد حساب"
                              disabled={isPermanentDocument}
                              sx={{ minWidth: 0 }}
                            />
                          )}
                          sx={{ flexGrow: 1, minWidth: 0 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => openAccountSelector(index)}
                          color="primary"
                          disabled={isPermanentDocument}
                          sx={{ p: 0.5 }}
                        >
                          <Search fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', width: '20%' }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={entry.accountName}
                        placeholder="نام حساب"
                        disabled={true}
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            color: 'text.primary',
                            cursor: 'default'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', width: '10%' }}>
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
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', width: '15%' }}>
                      <TextField
                        size="small"
                        type="text"
                        value={getInputValue(entry.id, 'debit')}
                        onChange={(e) => handleNumberInputChange(index, 'debit', e.target.value)}
                        placeholder="0"
                        sx={{ 
                          width: '100%', 
                          textAlign: 'left'
                        }}
                        disabled={isPermanentDocument || entry.accountNature === 'CREDIT'}
                        inputProps={{ 
                          style: { textAlign: 'left' }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', width: '15%' }}>
                      <TextField
                        size="small"
                        type="text"
                        value={getInputValue(entry.id, 'credit')}
                        onChange={(e) => handleNumberInputChange(index, 'credit', e.target.value)}
                        placeholder="0"
                        sx={{ 
                          width: '100%', 
                          textAlign: 'left'
                        }}
                        disabled={isPermanentDocument || entry.accountNature === 'DEBIT'}
                        inputProps={{ 
                          style: { textAlign: 'left' }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', width: '15%' }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={entry.description}
                        onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                        placeholder="شرح"
                        disabled={isPermanentDocument}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', width: '5%' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEntry(index)}
                        color="error"
                        disabled={isPermanentDocument}
                        sx={{ p: 0.5 }}
                      >
                        <Delete fontSize="small" />
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

          {/* Add Row Button with Dropdown - Centered below table */}
          {!isPermanentDocument && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Box 
                display="flex" 
                alignItems="center"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&:focus-within': {
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                  }
                }}
              >
                {/* Main Button Area */}
                <Button
                  variant="text"
                  startIcon={<Add />}
                  onClick={handleMainButtonClick}
                  size="small"
                  sx={{ 
                    borderRadius: 0,
                    borderTopLeftRadius: 1,
                    borderBottomLeftRadius: 1,
                    borderRight: '1px solid',
                    borderRightColor: 'divider',
                    minWidth: 'auto',
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    }
                  }}
                >
                  افزودن ردیف
                </Button>
                
                {/* Dropdown Arrow Area */}
                <Button
                  variant="text"
                  onClick={handleAddRowMenuOpen}
                  size="small"
                  sx={{ 
                    minWidth: 'auto',
                    px: 1,
                    borderRadius: 0,
                    borderTopRightRadius: 1,
                    borderBottomRightRadius: 1,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    }
                  }}
                >
                  <ArrowDropDown />
                </Button>
              </Box>
              
              <Menu
                anchorEl={addRowMenuAnchor}
                open={Boolean(addRowMenuAnchor)}
                onClose={handleAddRowMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                <MenuItem onClick={() => handleAddRows(2)}>
                  <ListItemIcon>
                    <Add fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>افزودن 2 ردیف</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAddRows(4)}>
                  <ListItemIcon>
                    <Add fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>افزودن 4 ردیف</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => setShowCustomInput(true)}>
                  <ListItemIcon>
                    <Add fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>تعداد دلخواه</ListItemText>
                </MenuItem>
                
                {/* Custom Input inside Menu */}
                {showCustomInput && (
                  <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TextField
                        size="small"
                        type="number"
                        value={customInputValue}
                        onChange={(e) => setCustomInputValue(e.target.value)}
                        placeholder="تعداد ردیف"
                        inputProps={{ min: 1, max: 20 }}
                        sx={{ width: 120 }}
                        autoFocus
                      />
                      <IconButton
                        size="small"
                        onClick={handleCustomRowSubmit}
                        disabled={!customInputValue || parseInt(customInputValue) < 1 || parseInt(customInputValue) > 20}
                        color="primary"
                      >
                        <Check fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Menu>
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

      <CommonDescriptionsModal
        open={commonDescriptionsOpen}
        onClose={() => setCommonDescriptionsOpen(false)}
        onSelect={handleSelectCommonDescription}
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
