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

interface SubsidiaryTable {
  accountCode: string;
  accountName: string;
  rows: LedgerRow[];
}

interface Props { projectId: string; }

export default function SubsidiaryLedger({ projectId }: Props) {
  const [groups, setGroups] = useState<CodingGroup[]>([]);
  const [selectedSubsidiaries, setSelectedSubsidiaries] = useState<Record<string, boolean>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [subsidiaryTables, setSubsidiaryTables] = useState<SubsidiaryTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showPrint, setShowPrint] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAllSubsidiaries, setShowAllSubsidiaries] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, [projectId]);

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

  useEffect(() => {
    buildRows();
  }, [selectedSubsidiaries, dateFrom, dateTo, showAllSubsidiaries]);

  const selectedCodes = useMemo(() => {
    return Object.keys(selectedSubsidiaries).filter(k => selectedSubsidiaries[k]);
  }, [selectedSubsidiaries]);

  const buildRows = async () => {
    try {
      if (showAllSubsidiaries) {
        // Show all subsidiary accounts that have transactions
        await buildAllSubsidiaryRows();
        return;
      }

      if (selectedCodes.length === 0) {
        setSubsidiaryTables([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams({ projectId, status: 'PERMANENT' });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const res = await fetch(`/api/accounting/documents?${params}`);
      if (!res.ok) throw new Error('خطا در دریافت اسناد');
      const documents: any[] = await res.json();

      // Create separate tables for each selected subsidiary
      const tables: SubsidiaryTable[] = [];
      
      for (const selectedCode of selectedCodes) {
        // Find account name for this code
        let accountName = selectedCode;
        groups.forEach(group => {
          group.classes?.forEach(cls => {
            cls.subClasses?.forEach(sub => {
              const fullCode = `${group.code}${cls.code}${sub.code}`;
              if (fullCode === selectedCode) {
                accountName = sub.name;
              }
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
        
        // Sort by date asc
        accountRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (accountRows.length > 0) {
          tables.push({
            accountCode: selectedCode,
            accountName,
            rows: accountRows
          });
        }
      }
      
      setSubsidiaryTables(tables);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
      setSubsidiaryTables([]);
    } finally {
      setLoading(false);
    }
  };

  const buildAllSubsidiaryRows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ projectId, status: 'PERMANENT' });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const res = await fetch(`/api/accounting/documents?${params}`);
      if (!res.ok) throw new Error('خطا در دریافت اسناد');
      const documents: any[] = await res.json();

      // Get all subsidiary codes from groups
      const allSubsidiaryCodes: { code: string; name: string }[] = [];
      groups.forEach(group => {
        group.classes?.forEach(cls => {
          cls.subClasses?.forEach(sub => {
            allSubsidiaryCodes.push({
              code: `${group.code}${cls.code}${sub.code}`,
              name: sub.name
            });
          });
        });
      });

      const tables: SubsidiaryTable[] = [];
      
      for (const { code: subsidiaryCode, name: accountName } of allSubsidiaryCodes) {
        const accountRows: LedgerRow[] = [];
        
        for (const doc of documents) {
          const entries = (doc.entries || []).filter((e: any) => {
            const code = String(e.accountCode || '');
            return code.startsWith(subsidiaryCode);
          });
          if (entries.length === 0) continue;
          
          const sums = entries.reduce((acc: { debit: number; credit: number }, e: any) => {
            acc.debit += Number(e.debit || 0);
            acc.credit += Number(e.credit || 0);
            return acc;
          }, { debit: 0, credit: 0 });
          
          accountRows.push({
            id: `${doc.id}-${subsidiaryCode}`,
            documentNumber: doc.documentNumber,
            date: doc.documentDate,
            description: doc.description || '',
            debit: sums.debit,
            credit: sums.credit
          });
        }
        
        // Sort by date asc
        accountRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (accountRows.length > 0) {
          tables.push({
            accountCode: subsidiaryCode,
            accountName,
            rows: accountRows
          });
        }
      }
      
      setSubsidiaryTables(tables);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
      setSubsidiaryTables([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  const toggleSub = (fullCode: string) => {
    setSelectedSubsidiaries(prev => ({ ...prev, [fullCode]: !prev[fullCode] }));
  };

  const handleCheckboxChange = (fullCode: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleSub(fullCode);
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

  const printHtml = () => {
    const w = window.open('', '_blank');
    
    const currentDate = new Date().toLocaleDateString('fa-IR');
    const totalPages = subsidiaryTables.length;
    
    let allTablesHTML = '';
    
    subsidiaryTables.forEach((table, tableIndex) => {
      const runningBalances = calculateRunningBalances(table.rows);
      const { totalDebit, totalCredit } = calculateTotals(table.rows);
      const pageNumber = tableIndex + 1;
      
      let tableHTML = `
        <div class="page-break" style="page-break-before: always;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="text-align: right; font-family: 'Vazirmatn', Arial, sans-serif;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                حساب: ${table.accountName}
              </div>
              <div style="font-size: 14px;">
                کد: ${table.accountCode}
              </div>
            </div>
            <div style="text-align: center; flex: 1;">
              <h3 style="margin: 0; font-size: 18px; font-weight: bold; font-family: 'Vazirmatn', Arial, sans-serif;">دفتر معین</h3>
            </div>
            <div style="text-align: left; font-family: 'Vazirmatn', Arial, sans-serif;">
              <div style="font-size: 14px; margin-bottom: 5px;">تاریخ تنظیم گزارش: ${currentDate}</div>
              <div style="font-size: 12px;">صفحه ${pageNumber} از ${totalPages}</div>
            </div>
          </div>
          
          <table class="print-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #757575; color: white;">
                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">ردیف</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">شماره سند</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">تاریخ سند</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">شرح</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">بدهکار</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">بستانکار</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">باقیمانده</th>
              </tr>
            </thead>
            <tbody>
      `;

      table.rows.forEach((entry, index) => {
        const rowNumber = index + 1;
        const runningBalance = runningBalances[index];
        tableHTML += `
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${rowNumber}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.documentNumber || '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${formatDate(entry.date)}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.description}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${runningBalance.toLocaleString('fa-IR')}</td>
          </tr>
        `;
      });

      tableHTML += `
            <tr style="background-color: #f5f5f5; font-weight: bold;">
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">جمع کل</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${totalDebit.toLocaleString('fa-IR')}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${totalCredit.toLocaleString('fa-IR')}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${(totalDebit - totalCredit).toLocaleString('fa-IR')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      `;
      
      allTablesHTML += tableHTML;
    });

    w?.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>دفتر معین</title>
        <style>
          @page {
            margin: 20mm;
          }
          body {
            font-family: 'Vazirmatn', Arial, sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
          }
          .page-break {
            page-break-before: always;
          }
          .page-break:first-child {
            page-break-before: auto;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-family: 'Vazirmatn', Arial, sans-serif;
          }
          .print-table th {
            background-color: #757575;
            color: white;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${allTablesHTML}
      </body>
      </html>
    `);
    
    w?.document.close();
    w?.print();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getDisplayRange = () => {
    if (subsidiaryTables.length === 0) {
      return 'هیچ رکوردی یافت نشد';
    }

    let range = showAllSubsidiaries ? 'همه حساب‌های معین' : `حساب‌های انتخابی: ${selectedCodes.length}`;
    
    if (dateFrom || dateTo) {
      range += ' - ';
      if (dateFrom && dateTo) {
        range += `از ${formatDate(dateFrom)} تا ${formatDate(dateTo)}`;
      } else if (dateFrom) {
        range += `از ${formatDate(dateFrom)}`;
      } else if (dateTo) {
        range += `تا ${formatDate(dateTo)}`;
      }
    }

    return range;
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
              {/* Dropdown selector with sticky subheaders */}
              <Box sx={{ minWidth: 240 }}>
                <Button
                  variant="outlined"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
                >
                  {selectedCodes.length > 0 ? `انتخاب شده: ${selectedCodes.length}` : 'انتخاب حساب‌های معین'}
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
                                {cls.subClasses?.map(sub => {
                                  const full = `${group.code}${cls.code}${sub.code}`;
                                  const checked = !!selectedSubsidiaries[full];
                                  return (
                                    <Box key={sub.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #f0f0f0', py: 0.5 }}>
                                      <Checkbox checked={checked} onChange={(e) => handleCheckboxChange(full, e)} />
                                      <Typography variant="body2" sx={{ flex: 1 }}>{sub.name}</Typography>
                                      <Chip label={full} size="small" />
                                    </Box>
                                  );
                                })}
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
                تنظیم دفتر معین
              </Button>
            </Box>
            <Button variant="outlined" startIcon={<Print />} onClick={() => setShowPrint(true)}>چاپ</Button>
          </Box>

          {/* Settings Panel */}
          <Collapse in={showSettings}>
            <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}>
                تنظیمات دفتر معین
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
                      checked={showAllSubsidiaries}
                      onChange={(e) => setShowAllSubsidiaries(e.target.checked)}
                    />
                  }
                  label="نمایش همه حساب‌های معین"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
              </Box>
            </Box>
          </Collapse>
                </CardContent>
              </Card>

      {/* Tables for each selected subsidiary */}
      {subsidiaryTables.map((table, tableIndex) => {
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

      {/* No data message */}
      {subsidiaryTables.length === 0 && !loading && (
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
          پیش‌نمایش چاپ - دفتر معین
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            '@media print': {
              '& .no-print': { display: 'none !important' }
            }
          }}>
            {/* Print Header */}
            <Box className="print-header" sx={{ 
              textAlign: 'center', 
              mb: 2, 
              fontSize: '18px', 
              fontWeight: 'bold',
              borderBottom: '2px solid #333',
              pb: 1,
              fontFamily: 'Vazirmatn, Arial, sans-serif'
            }}>
              دفتر معین
                    </Box>
            
            {/* Print Range */}
            <Box className="print-range" sx={{ 
              textAlign: 'center', 
              mb: 2, 
              fontSize: '14px', 
              color: '#666',
              fontFamily: 'Vazirmatn, Arial, sans-serif'
            }}>
              {getDisplayRange()}
                  </Box>

            {/* Print Tables for each subsidiary */}
            {subsidiaryTables.map((table, tableIndex) => {
              const runningBalances = calculateRunningBalances(table.rows);
              const { totalDebit, totalCredit } = calculateTotals(table.rows);
              const pageNumber = tableIndex + 1;
              const totalPages = subsidiaryTables.length;
              const currentDate = new Date().toLocaleDateString('fa-IR');
              
              return (
                <Box key={table.accountCode} sx={{ mb: 4, pageBreakBefore: 'always' }}>
                  {/* Header with account info and page numbers */}
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
                        دفتر معین
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
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>{entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}</TableCell>
                            <TableCell>{entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}</TableCell>
                            <TableCell>{run.toLocaleString('fa-IR')}</TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Total Row for Print Preview */}
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
            onClick={printHtml}
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
