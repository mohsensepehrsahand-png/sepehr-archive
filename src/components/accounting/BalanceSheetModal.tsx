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
  IconButton
} from '@mui/material';
import {
  Print,
  Close
} from '@mui/icons-material';

interface BalanceSheetData {
  assets: {
    current: Array<{
      code: string;
      name: string;
      balance: number;
    }>;
    nonCurrent: Array<{
      code: string;
      name: string;
      balance: number;
    }>;
  };
  liabilities: Array<{
    code: string;
    name: string;
    balance: number;
  }>;
  equity: Array<{
    code: string;
    name: string;
    balance: number;
  }>;
}

interface BalanceSheetModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function BalanceSheetModal({ open, onClose, projectId }: BalanceSheetModalProps) {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchBalanceSheetData();
    }
  }, [open, projectId]);

  const fetchBalanceSheetData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/accounting/balance-sheet?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات ترازنامه');
      }
      
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      setData(result);
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات ترازنامه');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fa-IR');
  };

  const calculateTotal = (items: Array<{ balance: number }>) => {
    return items.reduce((sum, item) => sum + item.balance, 0);
  };

  const totalCurrentAssets = data?.assets?.current ? calculateTotal(data.assets.current) : 0;
  const totalNonCurrentAssets = data?.assets?.nonCurrent ? calculateTotal(data.assets.nonCurrent) : 0;
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
  const totalLiabilities = data?.liabilities ? calculateTotal(data.liabilities) : 0;
  const totalEquity = data?.equity ? calculateTotal(data.equity) : 0;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
        ترازنامه
        <Box>
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
                      fontSize: '1.1rem',
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      width: '50%'
                    }}>
                      دارایی‌ها
                    </TableCell>
                    <TableCell sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      width: '50%'
                    }}>
                      بدهی‌ها و حقوق صاحبان سهام
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Assets Column */}
                  <TableRow>
                    <TableCell sx={{ 
                      border: '1px solid #ddd',
                      verticalAlign: 'top',
                      p: 0
                    }}>
                      <Table size="small">
                        <TableBody>
                          {/* Current Assets */}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #ddd'
                            }}>
                              دارایی‌های جاری
                            </TableCell>
                          </TableRow>
                          {data.assets.current?.map((asset, index) => (
                            <TableRow key={index}>
                              <TableCell sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                border: '1px solid #ddd',
                                pl: 2
                              }}>
                                <Box display="flex" justifyContent="space-between">
                                  <span>{asset.code} - {asset.name}</span>
                                  <span>{formatCurrency(asset.balance)}</span>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              backgroundColor: '#e0e0e0',
                              border: '1px solid #ddd'
                            }}>
                              <Box display="flex" justifyContent="space-between">
                                <span>جمع دارایی‌های جاری</span>
                                <span>{formatCurrency(totalCurrentAssets)}</span>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Non-Current Assets */}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #ddd'
                            }}>
                              دارایی‌های غیر جاری
                            </TableCell>
                          </TableRow>
                          {data.assets.nonCurrent?.map((asset, index) => (
                            <TableRow key={index}>
                              <TableCell sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                border: '1px solid #ddd',
                                pl: 2
                              }}>
                                <Box display="flex" justifyContent="space-between">
                                  <span>{asset.code} - {asset.name}</span>
                                  <span>{formatCurrency(asset.balance)}</span>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              backgroundColor: '#e0e0e0',
                              border: '1px solid #ddd'
                            }}>
                              <Box display="flex" justifyContent="space-between">
                                <span>جمع دارایی‌های غیر جاری</span>
                                <span>{formatCurrency(totalNonCurrentAssets)}</span>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Total Assets */}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              backgroundColor: '#d0d0d0',
                              border: '2px solid #000'
                            }}>
                              <Box display="flex" justifyContent="space-between">
                                <span>جمع کل دارایی‌ها</span>
                                <span>{formatCurrency(totalAssets)}</span>
                              </Box>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableCell>

                    {/* Liabilities and Equity Column */}
                    <TableCell sx={{ 
                      border: '1px solid #ddd',
                      verticalAlign: 'top',
                      p: 0
                    }}>
                      <Table size="small">
                        <TableBody>
                          {/* Liabilities */}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #ddd'
                            }}>
                              بدهی‌ها
                            </TableCell>
                          </TableRow>
                          {data.liabilities?.map((liability, index) => (
                            <TableRow key={index}>
                              <TableCell sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                border: '1px solid #ddd',
                                pl: 2
                              }}>
                                <Box display="flex" justifyContent="space-between">
                                  <span>{liability.code} - {liability.name}</span>
                                  <span>{formatCurrency(liability.balance)}</span>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              backgroundColor: '#e0e0e0',
                              border: '1px solid #ddd'
                            }}>
                              <Box display="flex" justifyContent="space-between">
                                <span>جمع بدهی‌ها</span>
                                <span>{formatCurrency(totalLiabilities)}</span>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Equity */}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #ddd'
                            }}>
                              حقوق صاحبان سهام
                            </TableCell>
                          </TableRow>
                          {data.equity?.map((equity, index) => (
                            <TableRow key={index}>
                              <TableCell sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                border: '1px solid #ddd',
                                pl: 2
                              }}>
                                <Box display="flex" justifyContent="space-between">
                                  <span>{equity.code} - {equity.name}</span>
                                  <span>{formatCurrency(equity.balance)}</span>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              backgroundColor: '#e0e0e0',
                              border: '1px solid #ddd'
                            }}>
                              <Box display="flex" justifyContent="space-between">
                                <span>جمع حقوق صاحبان سهام</span>
                                <span>{formatCurrency(totalEquity)}</span>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Total Liabilities and Equity */}
                          <TableRow>
                            <TableCell sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              backgroundColor: '#d0d0d0',
                              border: '2px solid #000'
                            }}>
                              <Box display="flex" justifyContent="space-between">
                                <span>جمع کل بدهی‌ها و حقوق صاحبان سهام</span>
                                <span>{formatCurrency(totalLiabilitiesAndEquity)}</span>
                              </Box>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
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
