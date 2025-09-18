"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider
} from '@mui/material';
import {
  Print,
  Close,
  Assessment
} from '@mui/icons-material';

interface TrialBalanceData {
  accounts: Array<{
    code: string;
    name: string;
    debitBalance: number;
    creditBalance: number;
    openingDebitBalance: number;
    openingCreditBalance: number;
    closingDebitBalance: number;
    closingCreditBalance: number;
  }>;
  totals: {
    totalDebit: number;
    totalCredit: number;
    totalOpeningDebit: number;
    totalOpeningCredit: number;
    totalClosingDebit: number;
    totalClosingCredit: number;
  };
}

interface TrialBalanceModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function TrialBalanceModal({ open, onClose, projectId }: TrialBalanceModalProps) {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [columnType, setColumnType] = useState<'two' | 'four'>('two');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if (open && showTable) {
      fetchTrialBalanceData();
    }
  }, [open, projectId, showTable]);

  const fetchTrialBalanceData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/accounting/trial-balance?projectId=${projectId}&type=${columnType}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات تراز آزمایشی');
      }
      
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      setData(result);
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات تراز آزمایشی');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    setShowTable(true);
    fetchTrialBalanceData();
  };

  const handleBackToSettings = () => {
    setShowTable(false);
    setData(null);
    setError('');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '0';
    return amount.toLocaleString('fa-IR');
  };

  const formatBalance = (amount: number) => {
    if (amount === 0) return '';
    if (amount < 0) return `(${formatCurrency(Math.abs(amount))})`;
    return formatCurrency(amount);
  };

  if (!showTable) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            '@media print': {
              margin: 0,
              maxHeight: 'none',
              height: 'auto'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          fontWeight: 'bold',
          fontSize: '1.5rem'
        }}>
          تراز آزمایشی
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Assessment color="primary" sx={{ fontSize: '2rem' }} />
            <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              انتخاب نوع تراز آزمایشی
            </Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>تعداد ستون‌های تراز آزمایشی</InputLabel>
            <Select
              value={columnType}
              onChange={(e) => setColumnType(e.target.value as 'two' | 'four')}
              label="تعداد ستون‌های تراز آزمایشی"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              <MenuItem value="two">دو ستونه (بدهکار و بستانکار)</MenuItem>
              <MenuItem value="four">چهار ستونه (اول دوره و آخر دوره)</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {columnType === 'two' 
              ? 'تراز آزمایشی دو ستونه شامل ستون‌های بدهکار و بستانکار خواهد بود.'
              : 'تراز آزمایشی چهار ستونه شامل ستون‌های بدهکار اول دوره، بستانکار اول دوره، بدهکار آخر دوره و بستانکار آخر دوره خواهد بود.'
            }
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            لغو
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            تأیید
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          '@media print': {
            margin: 0,
            maxHeight: 'none',
            height: 'auto'
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontFamily: 'Vazirmatn, Arial, sans-serif',
        fontWeight: 'bold',
        fontSize: '1.5rem'
      }}>
        تراز آزمایشی {columnType === 'two' ? '(دو ستونه)' : '(چهار ستونه)'}
        <Box>
          <IconButton onClick={handleBackToSettings} sx={{ mr: 1 }}>
            <Assessment />
          </IconButton>
          <IconButton onClick={handlePrint} sx={{ mr: 1 }}>
            <Print />
          </IconButton>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {data && (
          <Box sx={{ p: 2 }}>
            <TableContainer component={Paper} sx={{ 
              border: '1px solid #ddd',
              '@media print': {
                border: '2px solid #000'
              }
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      width: '20%'
                    }}>
                      کد حساب
                    </TableCell>
                    <TableCell sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      width: '30%'
                    }}>
                      نام حساب
                    </TableCell>
                    {columnType === 'two' ? (
                      <>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          width: '25%'
                        }}>
                          بدهکار
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          width: '25%'
                        }}>
                          بستانکار
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          width: '12.5%'
                        }}>
                          بدهکار اول دوره
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          width: '12.5%'
                        }}>
                          بستانکار اول دوره
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          width: '12.5%'
                        }}>
                          بدهکار آخر دوره
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          width: '12.5%'
                        }}>
                          بستانکار آخر دوره
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.accounts.map((account, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        border: '1px solid #ddd',
                        textAlign: 'center'
                      }}>
                        {account.code}
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        border: '1px solid #ddd'
                      }}>
                        {account.name}
                      </TableCell>
                      {columnType === 'two' ? (
                        <>
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            border: '1px solid #ddd',
                            textAlign: 'left'
                          }}>
                            {formatBalance(account.debitBalance)}
                          </TableCell>
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            border: '1px solid #ddd',
                            textAlign: 'left'
                          }}>
                            {formatBalance(account.creditBalance)}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            border: '1px solid #ddd',
                            textAlign: 'left'
                          }}>
                            {formatBalance(account.openingDebitBalance)}
                          </TableCell>
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            border: '1px solid #ddd',
                            textAlign: 'left'
                          }}>
                            {formatBalance(account.openingCreditBalance)}
                          </TableCell>
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            border: '1px solid #ddd',
                            textAlign: 'left'
                          }}>
                            {formatBalance(account.closingDebitBalance)}
                          </TableCell>
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            border: '1px solid #ddd',
                            textAlign: 'left'
                          }}>
                            {formatBalance(account.closingCreditBalance)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={columnType === 'two' ? 2 : 2} sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      backgroundColor: '#d0d0d0',
                      border: '2px solid #000',
                      textAlign: 'center'
                    }}>
                      جمع کل
                    </TableCell>
                    {columnType === 'two' ? (
                      <>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          backgroundColor: '#d0d0d0',
                          border: '2px solid #000',
                          textAlign: 'left'
                        }}>
                          {formatCurrency(data.totals.totalDebit)}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          backgroundColor: '#d0d0d0',
                          border: '2px solid #000',
                          textAlign: 'left'
                        }}>
                          {formatCurrency(data.totals.totalCredit)}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          backgroundColor: '#d0d0d0',
                          border: '2px solid #000',
                          textAlign: 'left'
                        }}>
                          {formatCurrency(data.totals.totalOpeningDebit)}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          backgroundColor: '#d0d0d0',
                          border: '2px solid #000',
                          textAlign: 'left'
                        }}>
                          {formatCurrency(data.totals.totalOpeningCredit)}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          backgroundColor: '#d0d0d0',
                          border: '2px solid #000',
                          textAlign: 'left'
                        }}>
                          {formatCurrency(data.totals.totalClosingDebit)}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: 'bold',
                          backgroundColor: '#d0d0d0',
                          border: '2px solid #000',
                          textAlign: 'left'
                        }}>
                          {formatCurrency(data.totals.totalClosingCredit)}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Balance Validation */}
            <Box mt={2}>
              {columnType === 'two' ? (
                <Alert 
                  severity={data.totals.totalDebit === data.totals.totalCredit ? 'success' : 'error'}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  {data.totals.totalDebit === data.totals.totalCredit 
                    ? `تراز صحیح است - جمع بدهکار: ${formatCurrency(data.totals.totalDebit)} = جمع بستانکار: ${formatCurrency(data.totals.totalCredit)}`
                    : `تراز نادرست است - تفاوت: ${formatCurrency(Math.abs(data.totals.totalDebit - data.totals.totalCredit))}`
                  }
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Alert 
                      severity={data.totals.totalOpeningDebit === data.totals.totalOpeningCredit ? 'success' : 'error'}
                      sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                    >
                      اول دوره: {data.totals.totalOpeningDebit === data.totals.totalOpeningCredit ? 'تراز صحیح' : 'تراز نادرست'}
                    </Alert>
                  </Grid>
                  <Grid item xs={6}>
                    <Alert 
                      severity={data.totals.totalClosingDebit === data.totals.totalClosingCredit ? 'success' : 'error'}
                      sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                    >
                      آخر دوره: {data.totals.totalClosingDebit === data.totals.totalClosingCredit ? 'تراز صحیح' : 'تراز نادرست'}
                    </Alert>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleBackToSettings}
          variant="outlined"
          startIcon={<Assessment />}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          تغییر تنظیمات
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<Print />}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          چاپ
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}

