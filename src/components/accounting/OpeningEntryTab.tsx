"use client";
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
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
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import PersianDatePicker from '../common/PersianDatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import AccountSelectorModal from './AccountSelectorModal';
import {
  Add,
  Delete,
  Search,
  Send,
  ArrowDropDown,
  Check,
  Description
} from '@mui/icons-material';

interface DocumentEntry {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
}

interface OpeningEntryTabProps {
  projectId: string;
}

export default function OpeningEntryTab({ projectId }: OpeningEntryTabProps) {
  const [formData, setFormData] = useState({
    documentNumber: '',
    documentDate: '',
    description: ''
  });
  const [entries, setEntries] = useState<DocumentEntry[]>([]);
  const [error, setError] = useState('');
  const [nextDocumentNumber, setNextDocumentNumber] = useState('');
  const [customRowCount, setCustomRowCount] = useState<number>(1);
  const [addRowMenuAnchor, setAddRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsFlat, setAccountsFlat] = useState<any[]>([]);
  const [codingFlat, setCodingFlat] = useState<Array<{ fullCode: string; name: string; nature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT' }>>([]);
  const [accountSelectorOpen, setAccountSelectorOpen] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [openingEntryExists, setOpeningEntryExists] = useState(false);
  const [existingOpeningDocument, setExistingOpeningDocument] = useState<any>(null);

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

  const normalizeAccountCode = (code: string): string => {
    return String(code || '').trim();
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
    checkOpeningEntryExists();
    fetchNextDocumentNumber();
    fetchAccounts();
    fetchCodingFlat();
    
    // Always start with 2 empty rows
    setEntries([
      {
        id: '1',
        accountCode: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
        accountNature: 'DEBIT'
      },
      {
        id: '2',
        accountCode: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
        accountNature: 'CREDIT'
      }
    ]);
  }, [projectId]);

  const checkOpeningEntryExists = async () => {
    try {
      const response = await fetch(`/api/accounting/opening-entry?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setOpeningEntryExists(data.exists);
        setExistingOpeningDocument(data.document);
      }
    } catch (error) {
      console.error('Error checking opening entry:', error);
    }
  };

  const fetchNextDocumentNumber = async () => {
    try {
      const response = await fetch(`/api/accounting/documents/next-number?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setNextDocumentNumber(data.nextNumber);
        setFormData(prev => ({ ...prev, documentNumber: data.nextNumber }));
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
        setAccounts(data);
        setAccountsFlat(flattenAccounts(data));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const addEntry = () => {
    const newEntry: DocumentEntry = {
      id: Date.now().toString(),
      accountCode: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0,
      accountNature: 'DEBIT'
    };
    setEntries([...entries, newEntry]);
  };

  const handleAddMultipleEntries = (count: number) => {
    const newEntries: DocumentEntry[] = Array.from({ length: count }, (_, index) => ({
      id: `${Date.now()}-${index}`,
      accountCode: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0,
      accountNature: 'DEBIT'
    }));
    setEntries(prev => [...prev, ...newEntries]);
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

  const removeEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const updateEntry = (id: string, field: keyof DocumentEntry, value: any) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleAccountSelect = (entryId: string, account: any) => {
    if (account) {
      updateEntry(entryId, 'accountCode', account.code);
      updateEntry(entryId, 'accountName', account.name);
      updateEntry(entryId, 'accountNature', account.nature || 'DEBIT');
    }
  };

  const handleSelectAccount = (accountCode: string, accountName: string, accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT') => {
    if (selectedEntryIndex !== null) {
      const entry = entries[selectedEntryIndex];
      setEntries(prev => prev.map((e, index) => 
        index === selectedEntryIndex 
          ? {
              ...e,
              accountCode,
              accountName,
              accountNature: accountNature || 'DEBIT',
              debit: 0,
              credit: 0
            }
          : e
      ));
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
      const response = await fetch('/api/accounting/opening-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          documentNumber: formData.documentNumber,
          documentDate: formData.documentDate,
          description: formData.description,
          entries: entries.map(entry => ({
            accountCode: entry.accountCode,
            accountName: entry.accountName,
            description: entry.description,
            debit: entry.debit,
            credit: entry.credit,
            accountNature: entry.accountNature
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ثبت سند افتتاحیه');
      }

      setError('');
      // Reset form
      setFormData({
        documentNumber: nextDocumentNumber,
        documentDate: '',
        description: ''
      });
      setEntries([
        {
          id: '1',
          accountCode: '',
          accountName: '',
          description: '',
          debit: 0,
          credit: 0,
          accountNature: 'DEBIT'
        },
        {
          id: '2',
          accountCode: '',
          accountName: '',
          description: '',
          debit: 0,
          credit: 0,
          accountNature: 'CREDIT'
        }
      ]);
    } catch (error) {
      console.error('Error saving opening entry:', error);
      setError(error instanceof Error ? error.message : 'خطا در ثبت سند افتتاحیه');
    }
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        سند افتتاحیه
      </Typography>

      {openingEntryExists && (
        <Alert severity="info" sx={{ mb: 2 }}>
          سند افتتاحیه قبلاً برای این سال مالی ثبت شده است.
          {existingOpeningDocument && ` شماره سند: ${existingOpeningDocument.documentNumber}`}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box flex={1} minWidth={200}>
            <TextField
              label="شماره سند"
              value={formData.documentNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
              fullWidth
              disabled={openingEntryExists}
            />
          </Box>
          <Box flex={1} minWidth={200}>
            <PersianDatePicker
              label="تاریخ سند"
              value={formData.documentDate}
              onChange={(date) => setFormData(prev => ({ ...prev, documentDate: date }))}
              error={!formData.documentDate}
              helperText={!formData.documentDate ? 'تاریخ سند الزامی است' : ''}
              disabled={openingEntryExists}
            />
          </Box>
          <Box flex={1} minWidth={200}>
            <TextField
              label="توضیحات"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              disabled={openingEntryExists}
            />
          </Box>
        </Box>

        {/* Search and Add Button */}
        {!openingEntryExists && (
          <Box display="flex" gap={2} alignItems="center" mt={2}>
            <TextField
              size="small"
              placeholder="جستجو در حساب‌ها..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            
            {/* Add Row Button with Dropdown */}
            <Box display="flex" alignItems="center">
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addEntry}
                size="small"
                sx={{ 
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: 'none',
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

        {/* Table */}
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>کد حساب</TableCell>
                <TableCell>نام حساب</TableCell>
                <TableCell>ماهیت</TableCell>
                <TableCell align="right">بدهکار</TableCell>
                <TableCell align="right">بستانکار</TableCell>
                <TableCell>شرح</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TextField
                        value={entry.accountCode}
                        onChange={(e) => updateEntry(entry.id, 'accountCode', e.target.value)}
                        size="small"
                        placeholder="کد حساب"
                        sx={{ width: 120 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => openAccountSelector(index)}
                        sx={{ p: 0.5 }}
                      >
                        <Search />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      value={entry.accountName}
                      size="small"
                      placeholder="نام حساب"
                      disabled
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    {entry.accountCode ? (
                      <Chip
                        label={entry.accountNature === 'DEBIT' ? 'بدهکار' : 'بستانکار'}
                        color={entry.accountNature === 'DEBIT' ? 'error' : 'success'}
                        size="small"
                        sx={{ width: 100 }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={entry.debit || ''}
                      onChange={(e) => updateEntry(entry.id, 'debit', parseFloat(e.target.value) || 0)}
                      size="small"
                      sx={{ 
                        width: 120,
                        '& input[type=number]': {
                          '-moz-appearance': 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          '-webkit-appearance': 'none',
                          margin: 0,
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          '-webkit-appearance': 'none',
                          margin: 0,
                        },
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      disabled={!entry.accountCode || entry.accountNature === 'CREDIT'}
                      InputProps={{
                        endAdornment: <Typography variant="caption">ریال</Typography>
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={entry.credit || ''}
                      onChange={(e) => updateEntry(entry.id, 'credit', parseFloat(e.target.value) || 0)}
                      size="small"
                      sx={{ 
                        width: 120,
                        '& input[type=number]': {
                          '-moz-appearance': 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          '-webkit-appearance': 'none',
                          margin: 0,
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          '-webkit-appearance': 'none',
                          margin: 0,
                        },
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      disabled={!entry.accountCode || entry.accountNature === 'DEBIT'}
                      InputProps={{
                        endAdornment: <Typography variant="caption">ریال</Typography>
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={entry.description}
                      onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="شرح"
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals */}
        {entries.length > 0 && (
          <Box mt={2}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Box flex={1} minWidth={200}>
                <Box textAlign="center" p={2} sx={{ backgroundColor: 'success.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.main">
                    مجموع بدهکار
                  </Typography>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {totalDebit.toLocaleString('fa-IR')} ریال
                  </Typography>
                </Box>
              </Box>
              <Box flex={1} minWidth={200}>
                <Box textAlign="center" p={2} sx={{ backgroundColor: 'primary.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="primary.main">
                    مجموع بستانکار
                  </Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {totalCredit.toLocaleString('fa-IR')} ریال
                  </Typography>
                </Box>
              </Box>
              <Box flex={1} minWidth={200}>
                <Box textAlign="center" p={2} sx={{
                  backgroundColor: isBalanced ? 'success.50' : 'error.50',
                  borderRadius: 1
                }}>
                  <Typography variant="body2" color={isBalanced ? 'success.main' : 'error.main'}>
                    وضعیت تراز
                  </Typography>
                  <Chip
                    label={isBalanced ? 'تراز' : 'نامتعادل'}
                    color={isBalanced ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Save Button */}
        <Box display="flex" justifyContent="center" mt={3}>
          <Button 
            onClick={handleSave}
            variant="contained"
            disabled={!isBalanced || entries.length === 0 || openingEntryExists}
            startIcon={<Send />}
          >
            ذخیره سند افتتاحیه
          </Button>
        </Box>
      </Box>

      {/* Account Selector Modal */}
      <AccountSelectorModal
        open={accountSelectorOpen}
        onClose={() => setAccountSelectorOpen(false)}
        onSelect={handleSelectAccount}
        projectId={projectId}
      />
    </Box>
  );
}