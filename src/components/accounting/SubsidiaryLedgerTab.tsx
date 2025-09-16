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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  journalType: 'DAYBOOK' | 'GENERAL_LEDGER' | 'SUBSIDIARY';
  description?: string;
  account: {
    name: string;
    type: string;
  };
  document?: {
    name: string;
    filePath: string;
  };
}

interface SubsidiaryLedgerTabProps {
  projectId: string;
}

export default function SubsidiaryLedgerTab({ projectId }: SubsidiaryLedgerTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Array<{id: string, name: string, type: string}>>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
  }, [projectId]);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [projectId, selectedAccount]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
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
      setLoadingAccounts(false);
    }
  };

  const fetchTransactions = async () => {
    if (!selectedAccount) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/accounting/transactions?projectId=${projectId}&accountId=${selectedAccount}&journalType=SUBSIDIARY`);
      if (!response.ok) {
        throw new Error('خطا در دریافت تراکنش‌ها');
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('خطا در دریافت تراکنش‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      projectId,
      type: 'transactions',
      accountId: selectedAccount
    });
    const url = `/api/accounting/export?${params}`;
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

  const calculateAccountBalance = () => {
    return transactions.reduce((balance, transaction) => {
      return transaction.type === 'DEBIT' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
    }, 0);
  };

  if (loadingAccounts) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold'
          }}>
            انتخاب حساب برای دفتر معین
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center">
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>انتخاب حساب</InputLabel>
              <Select
                value={selectedAccount}
                onChange={(e) => handleAccountChange(e.target.value)}
                label="انتخاب حساب"
                disabled={loadingAccounts}
              >
                {loadingAccounts ? (
                  <MenuItem disabled>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={16} />
                      <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        در حال بارگذاری...
                      </Typography>
                    </Box>
                  </MenuItem>
                ) : accounts.length === 0 ? (
                  <MenuItem disabled>
                    <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      هیچ حسابی یافت نشد
                    </Typography>
                  </MenuItem>
                ) : (
                  accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      <Box display="flex" alignItems="center" gap={1} width="100%">
                        <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {account.name}
                        </Typography>
                        <Chip 
                          label={getAccountTypeLabel(account.type)} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {selectedAccount && (
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
              >
                خروجی Excel
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {selectedAccount && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold'
              }}>
                دفتر معین - {accounts.find(a => a.id === selectedAccount)?.name}
              </Typography>
              
              <Box display="flex" gap={2} alignItems="center">
                <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  <strong>مانده حساب:</strong>
                </Typography>
                <Chip
                  label={`${Math.abs(calculateAccountBalance()).toLocaleString('fa-IR')} تومان`}
                  color={calculateAccountBalance() > 0 ? 'error' : calculateAccountBalance() < 0 ? 'success' : 'default'}
                  variant="outlined"
                />
                <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  {calculateAccountBalance() > 0 ? 'بدهکار' : calculateAccountBalance() < 0 ? 'بستانکار' : 'صفر'}
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
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
                        کد حساب معین
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                        نام حساب معین
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                        بدهکار
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                        بستانکار
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                        مانده
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: faIR })}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {transaction.id.substring(0, 8)}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {transaction.description || '-'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {transaction.account.name.split(' - ')[0] || transaction.account.name}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {transaction.account.name}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {transaction.type === 'DEBIT' ? transaction.amount.toLocaleString('fa-IR') : '-'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {transaction.type === 'CREDIT' ? transaction.amount.toLocaleString('fa-IR') : '-'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {calculateAccountBalance().toLocaleString('fa-IR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {transactions.length === 0 && !loading && (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary" sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif'
                }}>
                  هیچ تراکنشی برای این حساب یافت نشد
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedAccount && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}>
                لطفاً یک حساب را انتخاب کنید تا جزئیات آن را مشاهده کنید
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

