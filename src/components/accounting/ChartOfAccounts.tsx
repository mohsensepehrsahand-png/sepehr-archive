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
  Tooltip,
  Collapse,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  ChevronRight,
  AccountBalance,
  AccountTree,
  DragIndicator,
  AddBox
} from '@mui/icons-material';

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  level: number;
  parentId?: string;
  parent?: Account;
  children?: Account[];
  contact?: string;
  description?: string;
  isActive: boolean;
  _count: {
    transactions: number;
    invoices: number;
    bills: number;
  };
}

interface ChartOfAccountsProps {
  projectId: string;
}

export default function ChartOfAccounts({ projectId }: ChartOfAccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [draggedAccount, setDraggedAccount] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    level: 1,
    parentId: '',
    contact: '',
    description: '',
    isActive: true
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

  const generateAccountCode = (parentCode: string, level: number, existingCodes: string[]): string => {
    if (level === 1) {
      // Level 1: 1000, 2000, 3000, etc.
      const baseCodes = ['1000', '2000', '3000', '4000', '5000', '6000', '7000', '8000', '9000'];
      for (const code of baseCodes) {
        if (!existingCodes.includes(code)) {
          return code;
        }
      }
      return '1000';
    } else if (level === 2) {
      // Level 2: 1100, 1200, 1300, etc.
      const parentBase = parentCode.substring(0, 1);
      let counter = 1;
      while (counter < 10) {
        const newCode = `${parentBase}${counter}00`;
        if (!existingCodes.includes(newCode)) {
          return newCode;
        }
        counter++;
      }
      return `${parentBase}100`;
    } else if (level === 3) {
      // Level 3: 1110, 1120, 1130, etc.
      const parentBase = parentCode.substring(0, 2);
      let counter = 1;
      while (counter < 10) {
        const newCode = `${parentBase}${counter}0`;
        if (!existingCodes.includes(newCode)) {
          return newCode;
        }
        counter++;
      }
      return `${parentBase}10`;
    } else {
      // Level 4: 1111, 1112, 1113, etc.
      const parentBase = parentCode.substring(0, 3);
      let counter = 1;
      while (counter < 10) {
        const newCode = `${parentBase}${counter}`;
        if (!existingCodes.includes(newCode)) {
          return newCode;
        }
        counter++;
      }
      return `${parentBase}1`;
    }
  };

  const handleOpenDialog = (account?: Account, parentAccount?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        code: account.code,
        type: account.type,
        level: account.level,
        parentId: account.parentId || '',
        contact: account.contact || '',
        description: account.description || '',
        isActive: account.isActive
      });
    } else {
      setEditingAccount(null);
      const existingCodes = accounts.map(a => a.code);
      const newCode = parentAccount 
        ? generateAccountCode(parentAccount.code, (parentAccount.level || 1) + 1, existingCodes)
        : generateAccountCode('', 1, existingCodes);
      
      setFormData({
        name: '',
        code: newCode,
        type: '',
        level: parentAccount ? (parentAccount.level || 1) + 1 : 1,
        parentId: parentAccount?.id || '',
        contact: '',
        description: '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      code: '',
      type: '',
      level: 1,
      parentId: '',
      contact: '',
      description: '',
      isActive: true
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/accounting/accounts', {
        method: editingAccount ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...formData,
          id: editingAccount?.id
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

  const handleToggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const handleDragStart = (accountId: string) => {
    setDraggedAccount(accountId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetAccountId: string) => {
    e.preventDefault();
    
    if (!draggedAccount || draggedAccount === targetAccountId) {
      setDraggedAccount(null);
      return;
    }

    try {
      const response = await fetch(`/api/accounting/accounts/${draggedAccount}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newParentId: targetAccountId
        }),
      });

      if (!response.ok) {
        throw new Error('خطا در جابجایی حساب');
      }

      fetchAccounts();
    } catch (error) {
      console.error('Error moving account:', error);
      setError('خطا در جابجایی حساب');
    } finally {
      setDraggedAccount(null);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'ASSET': return 'دارایی';
      case 'LIABILITY': return 'بدهی';
      case 'EQUITY': return 'سرمایه';
      case 'INCOME': return 'درآمد';
      case 'EXPENSE': return 'هزینه';
      case 'CUSTOMER': return 'مشتری';
      case 'CONTRACTOR': return 'پیمانکار';
      case 'SUPPLIER': return 'تأمین‌کننده';
      default: return type;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET': return 'success';
      case 'LIABILITY': return 'error';
      case 'EQUITY': return 'primary';
      case 'INCOME': return 'info';
      case 'EXPENSE': return 'warning';
      default: return 'default';
    }
  };

  const buildAccountTree = (accounts: Account[]): Account[] => {
    const accountMap = new Map<string, Account>();
    const rootAccounts: Account[] = [];

    // Create a map of all accounts
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build the tree structure
    accounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children!.push(accountWithChildren);
        }
      } else {
        rootAccounts.push(accountWithChildren);
      }
    });

    // Sort children by code
    const sortAccounts = (accounts: Account[]) => {
      accounts.sort((a, b) => a.code.localeCompare(b.code));
      accounts.forEach(account => {
        if (account.children && account.children.length > 0) {
          sortAccounts(account.children);
        }
      });
    };

    sortAccounts(rootAccounts);
    return rootAccounts;
  };

  const renderAccountTree = (accounts: Account[], level = 0) => {
    return accounts.map((account) => {
      const hasChildren = account.children && account.children.length > 0;
      const isExpanded = expandedAccounts.has(account.id);
      const isDragged = draggedAccount === account.id;

      return (
        <Box key={account.id}>
          <TableRow 
            sx={{ 
              backgroundColor: level > 0 ? 'grey.50' : 'white',
              opacity: isDragged ? 0.5 : 1,
              '&:hover': { backgroundColor: 'grey.100' }
            }}
            draggable
            onDragStart={() => handleDragStart(account.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, account.id)}
          >
            <TableCell sx={{ paddingLeft: level * 4 + 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <DragIndicator sx={{ color: 'grey.400', cursor: 'grab' }} />
                {hasChildren && (
                  <IconButton 
                    size="small"
                    onClick={() => handleToggleExpand(account.id)}
                  >
                    {isExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                )}
                {!hasChildren && <Box width={24} />}
                <Box display="flex" alignItems="center" gap={1}>
                  {hasChildren && (
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: '#1976d2',
                        flexShrink: 0,
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: '#fff'
                        }}
                      />
                    </Box>
                  )}
                  <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {account.name}
                  </Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {account.code}
            </TableCell>
            <TableCell>
              <Chip
                label={getAccountTypeLabel(account.type)}
                color={getAccountTypeColor(account.type) as any}
                size="small"
              />
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {account.level}
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {account._count.transactions}
            </TableCell>
            <TableCell>
              <Box display="flex" gap={1}>
                <Tooltip title="افزودن زیرحساب">
                  <IconButton 
                    size="small" 
                    color="success"
                    onClick={() => handleOpenDialog(undefined, account)}
                  >
                    <AddBox />
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
          {hasChildren && isExpanded && (
            <TableRow>
              <TableCell colSpan={6} sx={{ p: 0 }}>
                <Collapse in={isExpanded}>
                  <TableContainer component={Paper} variant="outlined" sx={{ ml: 2 }}>
                    <Table size="small">
                      <TableBody>
                        {renderAccountTree(account.children!, level + 1)}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </TableCell>
            </TableRow>
          )}
        </Box>
      );
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const accountTree = buildAccountTree(accounts);

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
              <AccountTree color="primary" />
              نمودار حساب‌ها (کدینگ سلسله‌مراتبی)
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
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
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
                    کد حساب
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    نوع حساب
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    سطح
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    تراکنش‌ها
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    عملیات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderAccountTree(accountTree)}
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {editingAccount ? 'ویرایش حساب' : 'افزودن حساب جدید'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
              <TextField
                label="نام حساب"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="کد حساب"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                fullWidth
                required
                placeholder="مثل 1001, 2001, 3001"
              />
            </Box>
            
            <Box display="flex" gap={2}>
              <FormControl fullWidth required>
                <InputLabel>نوع حساب</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="نوع حساب"
                >
                  <MenuItem value="ASSET">دارایی</MenuItem>
                  <MenuItem value="LIABILITY">بدهی</MenuItem>
                  <MenuItem value="EQUITY">سرمایه</MenuItem>
                  <MenuItem value="INCOME">درآمد</MenuItem>
                  <MenuItem value="EXPENSE">هزینه</MenuItem>
                  <MenuItem value="CUSTOMER">مشتری</MenuItem>
                  <MenuItem value="CONTRACTOR">پیمانکار</MenuItem>
                  <MenuItem value="SUPPLIER">تأمین‌کننده</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>سطح حساب</InputLabel>
                <Select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                  label="سطح حساب"
                >
                  <MenuItem value={1}>سطح 1 - گروه اصلی</MenuItem>
                  <MenuItem value={2}>سطح 2 - زیرگروه</MenuItem>
                  <MenuItem value={3}>سطح 3 - حساب مشخص</MenuItem>
                  <MenuItem value={4}>سطح 4 - حساب معین</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth>
              <InputLabel>حساب والد (اختیاری)</InputLabel>
              <Select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                label="حساب والد (اختیاری)"
              >
                <MenuItem value="">
                  <Typography color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    بدون حساب والد
                  </Typography>
                </MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {account.code} - {account.name}
                    </Typography>
                  </MenuItem>
                ))}
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

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="حساب فعال"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
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
            disabled={!formData.name || !formData.code || !formData.type}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            {editingAccount ? 'ویرایش' : 'افزودن'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
