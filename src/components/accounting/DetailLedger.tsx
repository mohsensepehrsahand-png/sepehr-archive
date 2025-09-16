"use client";
import { useEffect, useMemo, useState } from 'react';
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
  Alert,
  CircularProgress,
  Checkbox,
  Collapse,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  TextField,
  FormControlLabel
} from '@mui/material';
import { Print, ExpandMore, ExpandLess, Settings } from '@mui/icons-material';

interface CodingGroup {
  id: string;
  name: string;
  code: string;
  classes?: {
    id: string;
    name: string;
    code: string;
    subClasses?: {
      id: string;
      name: string;
      code: string;
      details?: {
        id: string;
        name: string;
        code: string;
      }[];
    }[];
  }[];
}

interface LedgerRow {
  id: string;
  documentNumber?: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
}

interface DetailTable {
  accountCode: string;
  accountName: string;
  rows: LedgerRow[];
}

interface Props { projectId: string; }

export default function DetailLedger({ projectId }: Props) {
  const [groups, setGroups] = useState<CodingGroup[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<Record<string, boolean>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedSubClasses, setExpandedSubClasses] = useState<Record<string, boolean>>({});
  const [detailTables, setDetailTables] = useState<DetailTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showPrint, setShowPrint] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAllDetails, setShowAllDetails] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, [projectId]);

  useEffect(() => {
    buildRows();
  }, [selectedDetails, dateFrom, dateTo, showAllDetails]);

  const selectedCodes = useMemo(() => {
    return Object.keys(selectedDetails).filter(k => selectedDetails[k]);
  }, [selectedDetails]);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/accounting/coding/groups?projectId=${projectId}`);
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات کدینگ');
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const buildRows = async () => {
    try {
      if (showAllDetails) {
        await buildAllDetailRows();
        return;
      }

      if (selectedCodes.length === 0) {
        setDetailTables([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams({ projectId, status: 'PERMANENT' });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const res = await fetch(`/api/accounting/documents?${params}`);
      if (!res.ok) throw new Error('خطا در دریافت اسناد');
      const documents: any[] = await res.json();

      const tables: DetailTable[] = [];
      
      for (const selectedCode of selectedCodes) {
        let accountName = selectedCode;
        groups.forEach(group => {
          group.classes?.forEach(cls => {
            cls.subClasses?.forEach(sub => {
              sub.details?.forEach(detail => {
                const fullCode = `${group.code}${cls.code}${sub.code}${detail.code}`;
                if (fullCode === selectedCode) {
                  accountName = detail.name;
                }
              });
            });
          });
        });

        const accountRows: LedgerRow[] = [];
        
        for (const doc of documents) {
          const entries = (doc.entries || []).filter((e: any) => {
            const code = String(e.accountCode || '');
            return code.startsWith(selectedCode);
          });
          if (entries.length === 0) continue;
          
          const sums = entries.reduce((acc: { debit: number; credit: number }, e: any) => {
            acc.debit += Number(e.debit || 0);
            acc.credit += Number(e.credit || 0);
            return acc;
          }, { debit: 0, credit: 0 });
          
          accountRows.push({
            id: `${doc.id}-${selectedCode}`,
            documentNumber: doc.documentNumber,
            date: doc.documentDate,
            description: doc.description || '',
            debit: sums.debit,
            credit: sums.credit
          });
        }
        
        accountRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (accountRows.length > 0) {
          tables.push({
            accountCode: selectedCode,
            accountName,
            rows: accountRows
          });
        }
      }
      
      setDetailTables(tables);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
      setDetailTables([]);
    } finally {
      setLoading(false);
    }
  };

  const buildAllDetailRows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ projectId, status: 'PERMANENT' });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const res = await fetch(`/api/accounting/documents?${params}`);
      if (!res.ok) throw new Error('خطا در دریافت اسناد');
      const documents: any[] = await res.json();

      const allDetailCodes: { code: string; name: string }[] = [];
      groups.forEach(group => {
        group.classes?.forEach(cls => {
          cls.subClasses?.forEach(sub => {
            sub.details?.forEach(detail => {
              allDetailCodes.push({
                code: `${group.code}${cls.code}${sub.code}${detail.code}`,
                name: detail.name
              });
            });
          });
        });
      });

      const tables: DetailTable[] = [];
      
      for (const { code: detailCode, name: accountName } of allDetailCodes) {
        const accountRows: LedgerRow[] = [];
        
        for (const doc of documents) {
          const entries = (doc.entries || []).filter((e: any) => {
            const code = String(e.accountCode || '');
            return code.startsWith(detailCode);
          });
          if (entries.length === 0) continue;
          
          const sums = entries.reduce((acc: { debit: number; credit: number }, e: any) => {
            acc.debit += Number(e.debit || 0);
            acc.credit += Number(e.credit || 0);
            return acc;
          }, { debit: 0, credit: 0 });
          
          accountRows.push({
            id: `${doc.id}-${detailCode}`,
            documentNumber: doc.documentNumber,
            date: doc.documentDate,
            description: doc.description || '',
            debit: sums.debit,
            credit: sums.credit
          });
        }
        
        accountRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (accountRows.length > 0) {
          tables.push({
            accountCode: detailCode,
            accountName,
            rows: accountRows
          });
        }
      }
      
      setDetailTables(tables);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
      setDetailTables([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  const toggleSubClass = (subClassId: string) => {
    setExpandedSubClasses(prev => ({ ...prev, [subClassId]: !prev[subClassId] }));
  };

  const toggleDetail = (fullCode: string) => {
    setSelectedDetails(prev => ({ ...prev, [fullCode]: !prev[fullCode] }));
  };

  const handleCheckboxChange = (fullCode: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleDetail(fullCode);
  };

  const calculateRunningBalances = (rows: LedgerRow[]) => {
    let sum = 0;
    return rows.map(r => {
      sum += r.debit - r.credit;
      return sum;
    });
  };

  const calculateTotals = (rows: LedgerRow[]) => {
    return {
      totalDebit: rows.reduce((s, r) => s + r.debit, 0),
      totalCredit: rows.reduce((s, r) => s + r.credit, 0)
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" gap={1} alignItems="center">
              <Box sx={{ minWidth: 240 }}>
                <Button
                  variant="outlined"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
                >
                  {selectedCodes.length > 0 ? `انتخاب شده: ${selectedCodes.length}` : 'انتخاب حساب‌های تفصیلی'}
                </Button>
                <Popover
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{ sx: { width: '25%', minWidth: 300 } }}
                >
                  <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
                    {groups.map(group => (
                      <Box key={group.id}>
                        {group.classes?.map(cls => (
                          <Box key={cls.id}>
                            <Box sx={{ position: 'sticky', top: 0, zIndex: 1, background: '#fafafa', borderBottom: '1px solid #eee', px: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Button size="small" onClick={() => toggleClass(cls.id)} startIcon={expandedClasses[cls.id] ? <ExpandLess /> : <ExpandMore />}>{cls.name} <Chip label={group.code + cls.code} size="small" sx={{ ml: 1 }} /></Button>
                            </Box>
                            <Collapse in={expandedClasses[cls.id] ?? true}>
                              <Box sx={{ px: 2, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {cls.subClasses?.map(sub => (
                                  <Box key={sub.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #f0f0f0', py: 0.5 }}>
                                      <Button size="small" onClick={() => toggleSubClass(sub.id)} startIcon={expandedSubClasses[sub.id] ? <ExpandLess /> : <ExpandMore />}>{sub.name} <Chip label={group.code + cls.code + sub.code} size="small" sx={{ ml: 1 }} /></Button>
                                    </Box>
                                    <Collapse in={expandedSubClasses[sub.id] ?? false}>
                                      <Box sx={{ px: 2, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {sub.details?.map(detail => {
                                          const full = `${group.code}${cls.code}${sub.code}${detail.code}`;
                                          const checked = !!selectedDetails[full];
                                          return (
                                            <Box key={detail.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #f0f0f0', py: 0.5 }}>
                                              <Checkbox checked={checked} onChange={(e) => handleCheckboxChange(full, e)} />
                                              <Typography variant="body2" sx={{ flex: 1 }}>{detail.name}</Typography>
                                              <Chip label={full} size="small" />
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    </Collapse>
                                  </Box>
                                ))}
                              </Box>
                            </Collapse>
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </Popover>
              </Box>
              
              <Button 
                variant="outlined" 
                startIcon={showSettings ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setShowSettings(!showSettings)}
              >
                تنظیم دفتر تفصیلی
              </Button>
            </Box>
            <Button variant="outlined" startIcon={<Print />} onClick={() => setShowPrint(true)}>چاپ</Button>
          </Box>

          <Collapse in={showSettings}>
            <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}>
                تنظیمات دفتر تفصیلی
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    type="date"
                    label="از تاریخ"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: 200 }}
                  />
                  <TextField
                    type="date"
                    label="تا تاریخ"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: 200 }}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showAllDetails}
                      onChange={(e) => setShowAllDetails(e.target.checked)}
                    />
                  }
                  label="نمایش همه حساب‌های تفصیلی"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {detailTables.map((table, tableIndex) => {
        const runningBalances = calculateRunningBalances(table.rows);
        const { totalDebit, totalCredit } = calculateTotals(table.rows);
        
        return (
          <Card key={table.accountCode} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                mb: 2,
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {table.accountName} ({table.accountCode})
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#757575' }}>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}>
                        شماره سند
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}>
                        تاریخ
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}>
                        شرح
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}>
                        بدهکار
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}>
                        بستانکار
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}>
                        باقیمانده
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {table.rows.map((r, idx) => (
                      <TableRow key={r.id}>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {r.documentNumber || '-'}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {new Date(r.date).toLocaleDateString('fa-IR')}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {r.description}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {r.debit ? r.debit.toLocaleString('fa-IR') : '-'}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {r.credit ? r.credit.toLocaleString('fa-IR') : '-'}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {runningBalances[idx]?.toLocaleString('fa-IR')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {table.rows.length > 0 && (
                      <TableRow sx={{ 
                        backgroundColor: '#f5f5f5',
                        '& .MuiTableCell-root': {
                          borderTop: '2px solid #333',
                          borderBottom: '2px solid #333',
                          borderLeft: 'none',
                          borderRight: 'none',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        },
                        '& .MuiTableCell-root:first-of-type': {
                          borderLeft: '2px solid #333'
                        },
                        '& .MuiTableCell-root:last-of-type': {
                          borderRight: '2px solid #333'
                        }
                      }}>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          جمع کل
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: '#1976d2'
                        }}>
                          {totalDebit.toLocaleString('fa-IR')}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: '#1976d2'
                        }}>
                          {totalCredit.toLocaleString('fa-IR')}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: '#1976d2'
                        }}>
                          {(totalDebit - totalCredit).toLocaleString('fa-IR')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        );
      })}

      {detailTables.length === 0 && !loading && (
        <Card>
          <CardContent>
            <Typography sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              textAlign: 'center',
              py: 4
            }}>
              {loading ? 'در حال بارگذاری...' : 'حسابی انتخاب نشده است'}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPrint} onClose={() => setShowPrint(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          پیش‌نمایش چاپ - دفتر تفصیلی
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            '@media print': {
              '& .no-print': { display: 'none !important' }
            }
          }}>
            <Box className="print-header" sx={{ 
              textAlign: 'center', 
              mb: 2, 
              fontSize: '18px', 
              fontWeight: 'bold',
              borderBottom: '2px solid #333',
              pb: 1,
              fontFamily: 'Vazirmatn, Arial, sans-serif'
            }}>
              دفتر تفصیلی
            </Box>
            
            {detailTables.map((table, tableIndex) => {
              const runningBalances = calculateRunningBalances(table.rows);
              const { totalDebit, totalCredit } = calculateTotals(table.rows);
              const pageNumber = tableIndex + 1;
              const totalPages = detailTables.length;
              const currentDate = new Date().toLocaleDateString('fa-IR');
              
              return (
                <Box key={table.accountCode} sx={{ mb: 4, pageBreakBefore: 'always' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2,
                    fontFamily: 'Vazirmatn, Arial, sans-serif'
                  }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        mb: 0.5
                      }}>
                        حساب: {table.accountName}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        fontSize: '14px'
                      }}>
                        کد: {table.accountCode}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h5" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        m: 0
                      }}>
                        دفتر تفصیلی
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        fontSize: '14px',
                        mb: 0.5
                      }}>
                        تاریخ تنظیم گزارش: {currentDate}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        fontSize: '12px'
                      }}>
                        صفحه {pageNumber} از {totalPages}
                      </Typography>
                    </Box>
                  </Box>

                  <Table sx={{ 
                    width: '100%',
                    '& .MuiTableCell-root': {
                      border: '1px solid #000',
                      fontSize: '12px',
                      padding: '8px',
                      textAlign: 'center',
                      fontFamily: 'Vazirmatn, Arial, sans-serif'
                    },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      backgroundColor: '#757575',
                      color: 'white',
                      fontWeight: 'bold',
                      fontFamily: 'Vazirmatn, Arial, sans-serif'
                    }
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>ردیف</TableCell>
                        <TableCell>شماره سند</TableCell>
                        <TableCell>تاریخ سند</TableCell>
                        <TableCell>شرح</TableCell>
                        <TableCell>بدهکار</TableCell>
                        <TableCell>بستانکار</TableCell>
                        <TableCell>باقیمانده</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {table.rows.map((entry, index) => {
                        const run = runningBalances[index] || 0;
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{entry.documentNumber || '-'}</TableCell>
                            <TableCell>{new Date(entry.date).toLocaleDateString('fa-IR')}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>{entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}</TableCell>
                            <TableCell>{entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}</TableCell>
                            <TableCell>{run.toLocaleString('fa-IR')}</TableCell>
                          </TableRow>
                        );
                      })}
                      {table.rows.length > 0 && (
                        <TableRow sx={{ 
                          backgroundColor: '#f5f5f5',
                          '& .MuiTableCell-root': {
                            borderTop: '2px solid #333',
                            borderBottom: '2px solid #333',
                            borderLeft: 'none',
                            borderRight: 'none',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          },
                          '& .MuiTableCell-root:first-of-type': {
                            borderLeft: '2px solid #333'
                          },
                          '& .MuiTableCell-root:last-of-type': {
                            borderRight: '2px solid #333'
                          }
                        }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>جمع کل</TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                            {totalDebit.toLocaleString('fa-IR')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                            {totalCredit.toLocaleString('fa-IR')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                            {(totalDebit - totalCredit).toLocaleString('fa-IR')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPrint(false)}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            انصراف
          </Button>
          <Button
            onClick={() => {
              const w = window.open('', '_blank');
              w?.document.write(`
                <!DOCTYPE html>
                <html dir="rtl" lang="fa">
                <head>
                  <meta charset="UTF-8">
                  <title>دفتر تفصیلی</title>
                  <style>
                    @page { margin: 20mm; }
                    body { font-family: 'Vazirmatn', Arial, sans-serif; direction: rtl; margin: 0; padding: 20px; }
                    .page-break { page-break-before: always; }
                    .page-break:first-child { page-break-before: auto; }
                    .print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    .print-table th, .print-table td { border: 1px solid #000; padding: 8px; text-align: center; font-family: 'Vazirmatn', Arial, sans-serif; }
                    .print-table th { background-color: #757575; color: white; font-weight: bold; }
                  </style>
                </head>
                <body>
                  <div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px;">دفتر تفصیلی</div>
                  ${detailTables.map((table, tableIndex) => {
                    const runningBalances = calculateRunningBalances(table.rows);
                    const { totalDebit, totalCredit } = calculateTotals(table.rows);
                    return `
                      <div class="page-break" style="page-break-before: always;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                          <div style="text-align: right; font-family: 'Vazirmatn', Arial, sans-serif;">
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">حساب: ${table.accountName}</div>
                            <div style="font-size: 14px;">کد: ${table.accountCode}</div>
                          </div>
                          <div style="text-align: center; flex: 1;">
                            <h3 style="margin: 0; font-size: 18px; font-weight: bold; font-family: 'Vazirmatn', Arial, sans-serif;">دفتر تفصیلی</h3>
                          </div>
                          <div style="text-align: left; font-family: 'Vazirmatn', Arial, sans-serif;">
                            <div style="font-size: 14px; margin-bottom: 5px;">تاریخ تنظیم گزارش: ${new Date().toLocaleDateString('fa-IR')}</div>
                            <div style="font-size: 12px;">صفحه ${tableIndex + 1} از ${detailTables.length}</div>
                          </div>
                        </div>
                        <table class="print-table">
                          <thead>
                            <tr style="background-color: #757575; color: white;">
                              <th>ردیف</th>
                              <th>شماره سند</th>
                              <th>تاریخ سند</th>
                              <th>شرح</th>
                              <th>بدهکار</th>
                              <th>بستانکار</th>
                              <th>باقیمانده</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${table.rows.map((entry, index) => {
                              const run = runningBalances[index] || 0;
                              return `
                                <tr>
                                  <td>${index + 1}</td>
                                  <td>${entry.documentNumber || '-'}</td>
                                  <td>${new Date(entry.date).toLocaleDateString('fa-IR')}</td>
                                  <td>${entry.description}</td>
                                  <td>${entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}</td>
                                  <td>${entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}</td>
                                  <td>${run.toLocaleString('fa-IR')}</td>
                                </tr>
                              `;
                            }).join('')}
                            <tr style="background-color: #f5f5f5; font-weight: bold;">
                              <td>جمع کل</td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td>${totalDebit.toLocaleString('fa-IR')}</td>
                              <td>${totalCredit.toLocaleString('fa-IR')}</td>
                              <td>${(totalDebit - totalCredit).toLocaleString('fa-IR')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    `;
                  }).join('')}
                </body>
                </html>
              `);
              w?.document.close();
              w?.print();
            }}
            variant="contained"
            startIcon={<Print />}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            تایید و چاپ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
