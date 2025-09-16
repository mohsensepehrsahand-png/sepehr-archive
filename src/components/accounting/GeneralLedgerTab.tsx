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
  Chip,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Collapse
} from '@mui/material';
import { Download, ExpandMore, ChevronRight } from '@mui/icons-material';

interface Ledger {
  id: string;
  balance: number;
  account: {
    id: string;
    name: string;
    code: string;
    type: string;
    level: number;
    parentId?: string;
    children?: Ledger[];
  };
}

interface GeneralLedgerTabProps {
  projectId: string;
}

export default function GeneralLedgerTab({ projectId }: GeneralLedgerTabProps) {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [hierarchicalLedgers, setHierarchicalLedgers] = useState<Ledger[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLedgers();
  }, [projectId]);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const [ledgersRes, accountsRes] = await Promise.all([
        fetch(`/api/accounting/ledgers?projectId=${projectId}`),
        fetch(`/api/accounting/accounts?projectId=${projectId}`)
      ]);
      
      if (!ledgersRes.ok || !accountsRes.ok) {
        throw new Error('خطا در دریافت اطلاعات');
      }
      
      const [ledgersData, accountsData] = await Promise.all([
        ledgersRes.json(),
        accountsRes.json()
      ]);
      
      setLedgers(ledgersData);
      setAccounts(accountsData);
      
      // Build hierarchical structure
      const hierarchical = buildHierarchicalLedgers(ledgersData);
      setHierarchicalLedgers(hierarchical);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      setError('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchicalLedgers = (ledgers: Ledger[]): Ledger[] => {
    const ledgerMap = new Map<string, Ledger>();
    const rootLedgers: Ledger[] = [];

    // Create a map of all ledgers
    ledgers.forEach(ledger => {
      ledgerMap.set(ledger.account.id, { ...ledger, account: { ...ledger.account, children: [] } });
    });

    // Build the tree structure
    ledgers.forEach(ledger => {
      const ledgerWithChildren = ledgerMap.get(ledger.account.id)!;
      if (ledger.account.parentId) {
        const parent = ledgerMap.get(ledger.account.parentId);
        if (parent) {
          parent.account.children!.push(ledgerWithChildren);
        }
      } else {
        rootLedgers.push(ledgerWithChildren);
      }
    });

    // Sort by account code
    const sortLedgers = (ledgers: Ledger[]) => {
      ledgers.sort((a, b) => a.account.code.localeCompare(b.account.code));
      ledgers.forEach(ledger => {
        if (ledger.account.children && ledger.account.children.length > 0) {
          sortLedgers(ledger.account.children);
        }
      });
    };

    sortLedgers(rootLedgers);
    return rootLedgers;
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

  const handleExport = () => {
    const url = `/api/accounting/export?projectId=${projectId}&type=ledgers`;
    window.open(url, '_blank');
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

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { label: 'بدهکار', color: 'error' as const };
    if (balance < 0) return { label: 'بستانکار', color: 'success' as const };
    return { label: 'صفر', color: 'default' as const };
  };

  const renderHierarchicalLedgers = (ledgers: Ledger[], level = 0) => {
    return ledgers.map((ledger) => {
      const hasChildren = ledger.account.children && ledger.account.children.length > 0;
      const isExpanded = expandedAccounts.has(ledger.account.id);
      const balanceStatus = getBalanceStatus(ledger.balance);

      return (
        <Box key={ledger.id}>
          <TableRow sx={{ 
            backgroundColor: level > 0 ? 'grey.50' : 'white',
            '&:hover': { backgroundColor: 'grey.100' }
          }}>
            <TableCell sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              paddingLeft: level * 2 + 2,
              fontWeight: hasChildren ? 'bold' : 'normal'
            }}>
              <Box display="flex" alignItems="center" gap={1}>
                {hasChildren && (
                  <IconButton 
                    size="small"
                    onClick={() => handleToggleExpand(ledger.account.id)}
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
                  <Box>
                    <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      {ledger.account.code}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.875rem' }}>
                      {ledger.account.name}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {getAccountTypeLabel(ledger.account.type)}
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {Math.abs(ledger.balance).toLocaleString('fa-IR')} تومان
            </TableCell>
            <TableCell>
              <Chip
                label={balanceStatus.label}
                color={balanceStatus.color}
                size="small"
              />
            </TableCell>
          </TableRow>
          {hasChildren && isExpanded && (
            <TableRow>
              <TableCell colSpan={4} sx={{ p: 0 }}>
                <Collapse in={isExpanded}>
                  <TableContainer component={Paper} variant="outlined" sx={{ ml: 2 }}>
                    <Table size="small">
                      <TableBody>
                        {renderHierarchicalLedgers(ledger.account.children!, level + 1)}
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

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              fontWeight: 'bold'
            }}>
              دفتر کل
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
            >
              خروجی Excel
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Account Selection */}
          <Box mb={3}>
            <FormControl fullWidth>
              <InputLabel>انتخاب حساب</InputLabel>
              <Select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                label="انتخاب حساب"
              >
                <MenuItem value="">همه حساب‌ها</MenuItem>
                {accounts.map(account => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedAccount && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      تاریخ
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      شماره سند
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      شرح
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      بدهکار
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      بستانکار
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      مانده حساب
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* This would be populated with actual transaction data for the selected account */}
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        لطفاً ابتدا یک حساب را انتخاب کنید
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!selectedAccount && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      کد و نام حساب
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      نوع حساب
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      مانده
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      وضعیت
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renderHierarchicalLedgers(hierarchicalLedgers)}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {ledgers.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}>
                هیچ مانده حسابی یافت نشد
              </Typography>
            </Box>
          )}

          {/* Summary */}
          {ledgers.length > 0 && (
            <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold'
              }}>
                خلاصه
              </Typography>
              <Box display="flex" gap={4}>
                <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  <strong>تعداد حساب‌ها:</strong> {ledgers.length}
                </Typography>
                <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  <strong>مجموع بدهکار:</strong> {ledgers
                    .filter(l => l.balance > 0)
                    .reduce((sum, l) => sum + l.balance, 0)
                    .toLocaleString('fa-IR')} تومان
                </Typography>
                <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  <strong>مجموع بستانکار:</strong> {Math.abs(ledgers
                    .filter(l => l.balance < 0)
                    .reduce((sum, l) => sum + l.balance, 0))
                    .toLocaleString('fa-IR')} تومان
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
