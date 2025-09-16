"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Chip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Print,
  Settings,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  level: number;
  parentId?: string;
  isActive: boolean;
  children?: Account[];
}

interface LedgerEntry {
  id: string;
  documentNumber?: string;
  reference?: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance?: number;
  journalType?: string;
  subsidiaryDescription?: string;
  detailDescription?: string;
}

interface AccountSummary {
  account: Account;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  entries: LedgerEntry[];
}

interface GeneralLedgerProps {
  projectId: string;
}

export default function GeneralLedger({ projectId }: GeneralLedgerProps) {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  
  // Debug: Log ledger entries when they change
  useEffect(() => {
    console.log('Ledger entries updated:', ledgerEntries);
  }, [ledgerEntries]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mainAccounts, setMainAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [showSubsidiaryDescription, setShowSubsidiaryDescription] = useState(false);
  const [showDetailDescription, setShowDetailDescription] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Maps: full codes -> names for subclass (معین) and detail (تفصیلی)
  const [subClassNameByFullCode, setSubClassNameByFullCode] = useState<Record<string, string>>({});
  const [detailNameByFullCode, setDetailNameByFullCode] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (selectedAccount) {
      fetchLedgerEntries();
    }
  }, [selectedAccount]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from the same API as the coding tab
      const response = await fetch(`/api/accounting/coding/groups?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات کدینگ');
      }
      const groupsData = await response.json();
      
      // Transform the data to match our interface
      const transformedGroups = groupsData.map((group: any) => ({
        id: group.id,
        name: group.name,
        code: group.code,
        type: 'GROUP',
        level: 1,
        parentId: undefined,
        isActive: true,
        children: group.classes?.map((accountClass: any) => ({
          id: accountClass.id,
          name: accountClass.name,
          code: group.code + accountClass.code, // ترکیب کد گروه + کد کل
          type: 'CLASS',
          level: 2,
          parentId: group.id,
          isActive: true
        })) || []
      }));

      console.log('Transformed groups:', transformedGroups);
      setAccounts(transformedGroups);
      setMainAccounts(transformedGroups);

      // Build code maps for subclass (level 3) and detail (level 4)
      const subMap: Record<string, string> = {};
      const detMap: Record<string, string> = {};
      for (const g of groupsData) {
        const groupCode: string = g.code;
        for (const c of (g.classes || [])) {
          const classCode: string = c.code;
          const classFull = `${groupCode}${classCode}`;
          for (const s of (c.subClasses || [])) {
            const subFull = `${classFull}${s.code}`;
            subMap[subFull] = s.name;
            for (const d of (s.details || [])) {
              const detFull = `${subFull}${d.code}`;
              detMap[detFull] = d.name;
            }
          }
        }
      }
      setSubClassNameByFullCode(subMap);
      setDetailNameByFullCode(detMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  const fetchLedgerEntries = async () => {
    if (!selectedAccount) return;
    try {
      setLoading(true);

      // Resolve selected account (group or main heading)
      let selectedAcc = mainAccounts.find(acc => acc.id === selectedAccount);
      if (!selectedAcc) {
        for (const group of mainAccounts) {
          const found = group.children?.find(child => child.id === selectedAccount);
          if (found) {
            selectedAcc = found;
            break;
          }
        }
      }
      if (!selectedAcc) {
        setError('حساب انتخاب شده یافت نشد');
        setLedgerEntries([]);
        return;
      }

      // Require main heading (level 2) to aggregate descendant accounts
      if (selectedAcc.level !== 2) {
        setLedgerEntries([]);
        return;
      }

      const mainHeadingCode = selectedAcc.code;

      const params = new URLSearchParams({
        projectId,
        status: 'PERMANENT'
      });

      const response = await fetch(`/api/accounting/documents?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch documents');
      }

      const documents: any[] = await response.json();

      // Build ledger rows: one row per document aggregating entries under the selected main heading
      const rows: LedgerEntry[] = documents
        .map((doc: any) => {
          const matchingEntries = (doc.entries || []).filter((entry: any) => 
            entry.accountCode && String(entry.accountCode).startsWith(String(mainHeadingCode))
          );

          if (matchingEntries.length === 0) return null;

          const sums = matchingEntries.reduce(
            (acc: { debit: number; credit: number }, entry: any) => {
              acc.debit += Number(entry.debit || 0);
              acc.credit += Number(entry.credit || 0);
              return acc;
            },
            { debit: 0, credit: 0 }
          );

          // Build names for subsidiary and detail based on code prefix maps
          const subNames = new Set<string>();
          const detNames = new Set<string>();
          for (const e of matchingEntries) {
            const code: string = String(e.accountCode || '');
            // Match detail by longest prefix
            for (const detFull in detailNameByFullCode) {
              if (code.startsWith(detFull)) {
                detNames.add(detailNameByFullCode[detFull]);
              }
            }
            // Match subclass by prefix
            for (const subFull in subClassNameByFullCode) {
              if (code.startsWith(subFull)) {
                subNames.add(subClassNameByFullCode[subFull]);
              }
            }
          }
          const subsidiaryDescription = Array.from(subNames).join('، ');
          const detailDescription = Array.from(detNames).join('، ');

          return {
            id: `${doc.id}-${mainHeadingCode}`,
            documentNumber: doc.documentNumber,
            date: doc.documentDate,
            description: doc.description || '',
            debit: sums.debit,
            credit: sums.credit,
            subsidiaryDescription,
            detailDescription,
          } as LedgerEntry;
        })
        .filter(Boolean) as LedgerEntry[];

      setLedgerEntries(rows);
    } catch (err) {
      console.error('Error building general ledger from documents:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      'ASSET': 'success',
      'LIABILITY': 'error',
      'EQUITY': 'info',
      'INCOME': 'primary',
      'EXPENSE': 'warning',
      'CUSTOMER': 'secondary',
      'CONTRACTOR': 'default',
      'SUPPLIER': 'default'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      'ASSET': 'دارایی',
      'LIABILITY': 'بدهی',
      'EQUITY': 'سرمایه',
      'INCOME': 'درآمد',
      'EXPENSE': 'هزینه',
      'CUSTOMER': 'مشتری',
      'CONTRACTOR': 'پیمانکار',
      'SUPPLIER': 'تأمین‌کننده'
    };
    return labels[type as keyof typeof labels] || type;
  };


  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const handlePrintConfirm = () => {
    const printWindow = window.open('', '_blank');
    
    // Build header row based on settings
    let tableHTML = `
      <table class="print-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #757575; color: white;">
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">ردیف</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">شماره سند</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">تاریخ سند</th>
    `;

    if (showDescription) {
      tableHTML += `<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">شرح</th>`;
    }
    if (showSubsidiaryDescription) {
      tableHTML += `<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">نام معین</th>`;
    }
    if (showDetailDescription) {
      tableHTML += `<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">نام تفصیلی</th>`;
    }

    tableHTML += `
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">بدهکار</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">بستانکار</th>
          </tr>
        </thead>
        <tbody>
    `;

    ledgerEntries.forEach((entry, index) => {
      const rowNumber = index + 1;
      tableHTML += `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${rowNumber}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.documentNumber || entry.reference || '-'}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${formatDate(entry.date)}</td>
      `;

      if (showDescription) {
        tableHTML += `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.description}</td>`;
      }
      if (showSubsidiaryDescription) {
        tableHTML += `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.subsidiaryDescription || '-'}</td>`;
      }
      if (showDetailDescription) {
        tableHTML += `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.detailDescription || '-'}</td>`;
      }

      tableHTML += `
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}</td>
        </tr>
      `;
    });

    const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);

    tableHTML += `
          <tr style="background-color: #f5f5f5; font-weight: bold;">
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">جمع کل</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
    `;

    // Add empty cells for conditional columns
    if (showDescription) {
      tableHTML += `<td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>`;
    }
    if (showSubsidiaryDescription) {
      tableHTML += `<td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>`;
    }
    if (showDetailDescription) {
      tableHTML += `<td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>`;
    }

    tableHTML += `
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${totalDebit.toLocaleString('fa-IR')}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${totalCredit.toLocaleString('fa-IR')}</td>
          </tr>
        </tbody>
      </table>
    `;

    printWindow?.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>دفتر کل</title>
        <style>
          @page {
            margin: 20mm;
            @top-center {
              content: "دفتر کل - صفحه " counter(page);
            }
          }
          body {
            font-family: 'Vazirmatn', Arial, sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            font-size: 18px;
            font-weight: bold;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .print-range {
            text-align: center;
            margin-bottom: 15px;
            font-size: 14px;
            color: #666;
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
          }
          .print-table th {
            background-color: #757575;
            color: white;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="print-header">دفتر کل</div>
        <div class="print-range">${getDisplayRange()}</div>
        ${tableHTML}
      </body>
      </html>
    `);
    
    printWindow?.document.close();
    printWindow?.print();
    setShowPrintPreview(false);
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
    if (ledgerEntries.length === 0) {
      return 'هیچ رکوردی یافت نشد';
    }

    // Find selected account in hierarchical structure
    let selectedAccountData: Account | null = null;
    for (const account of mainAccounts) {
      if (account.id === selectedAccount) {
        selectedAccountData = account;
        break;
      }
      if (account.children) {
        const child = account.children.find(child => child.id === selectedAccount);
        if (child) {
          selectedAccountData = child;
          break;
        }
      }
    }

    let range = `حساب: ${selectedAccountData?.code} - ${selectedAccountData?.name}`;
    if (selectedAccountData?.level === 1) {
      range += ' (گروه)';
    } else if (selectedAccountData?.level === 2) {
      range += ' (سرفصل کل)';
    }

    return range;
  };

  const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);

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
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Accounting Coding Structure - First 2 Levels */}
          <Box sx={{ mb: 3 }}>
            {/* Group Row - Horizontal */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  minWidth: '80px',
                  textAlign: 'right'
                }}>
                  گروه:
                  </Typography>
                {mainAccounts.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                    textAlign: 'center',
                    py: 1,
                    display: 'block',
                    width: '100%'
                  }}>
                    در حال بارگذاری گروه‌ها...
                  </Typography>
                ) : (
                  mainAccounts.map((group) => (
                    <Box
                      key={group.id}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedAccount(group.id);
                      }}
                      sx={{
                        p: 1,
                        border: selectedAccount === group.id ? '2px solid' : '1px solid',
                        borderColor: selectedAccount === group.id ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        bgcolor: selectedAccount === group.id ? 'primary.light' : 'transparent',
                        '&:hover': {
                          bgcolor: selectedAccount === group.id ? 'primary.light' : 'action.hover'
                        },
                        transition: 'all 0.2s',
                        minWidth: '120px',
                        textAlign: 'center',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: selectedAccount === group.id ? 'bold' : 'normal',
                          fontSize: '0.8rem'
                        }}>
                          {group.name}
                  </Typography>
                        <Chip label={group.code} size="small" color="primary" sx={{ fontSize: '0.7rem', height: 20 }} />
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            {/* Main Heading Row - Horizontal */}
            <Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  minWidth: '80px',
                  textAlign: 'right'
                }}>
                  سرفصل کل:
                </Typography>
                {(() => {
                  // Find the selected account - could be a group or main heading
                  let selectedAcc = mainAccounts.find(acc => acc.id === selectedAccount);
                  let parentGroup = selectedAcc;
                  
                  // If not found in main accounts, search in children (main headings)
                  if (!selectedAcc) {
                    for (const group of mainAccounts) {
                      const found = group.children?.find(child => child.id === selectedAccount);
                      if (found) {
                        selectedAcc = found;
                        parentGroup = group;
                        break;
                      }
                    }
                  }
                  
                  console.log('Selected account:', selectedAcc);
                  console.log('Parent group:', parentGroup);
                  console.log('Parent group children:', parentGroup?.children);
                  
                  return !parentGroup?.children || parentGroup.children.length === 0 ? null : (
                    parentGroup.children.map((mainHeading) => (
                      <Box
                        key={mainHeading.id}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedAccount(mainHeading.id);
                        }}
                        sx={{
                          p: 1,
                          border: selectedAccount === mainHeading.id ? '2px solid' : '1px solid',
                          borderColor: selectedAccount === mainHeading.id ? 'secondary.main' : 'divider',
                          borderRadius: 1,
                          cursor: 'pointer',
                          bgcolor: selectedAccount === mainHeading.id ? 'secondary.light' : 'transparent',
                          '&:hover': {
                            bgcolor: selectedAccount === mainHeading.id ? 'secondary.light' : 'action.hover'
                          },
                          transition: 'all 0.2s',
                          minWidth: '120px',
                          textAlign: 'center',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            fontWeight: selectedAccount === mainHeading.id ? 'bold' : 'normal',
                            fontSize: '0.8rem'
                          }}>
                            {mainHeading.name}
                          </Typography>
                          <Chip 
                            label={mainHeading.code} 
                            size="small" 
                            color="secondary" 
                            sx={{ fontSize: '0.7rem', height: 20 }} 
                          />
                        </Box>
                      </Box>
                    ))
                  );
                })()}
              </Box>
            </Box>
          </Box>

          {/* Print Button and Settings */}
          <Box display="flex" gap={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: 100 }}
            >
              چاپ
            </Button>
            <Button
              variant="outlined"
              startIcon={showSettings ? <ExpandLess /> : <ExpandMore />}
              onClick={toggleSettings}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: 150 }}
            >
              تنظیمات دفتر کل
            </Button>
          </Box>

          {/* Settings Panel */}
          <Collapse in={showSettings}>
            <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}>
                انتخاب ستون‌های نمایش
              </Typography>
              <Box display="flex" gap={3} flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showDescription}
                      onChange={(e) => setShowDescription(e.target.checked)}
                    />
                  }
                  label="شرح سند"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showSubsidiaryDescription}
                      onChange={(e) => setShowSubsidiaryDescription(e.target.checked)}
                    />
                  }
                  label="نام معین"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showDetailDescription}
                      onChange={(e) => setShowDetailDescription(e.target.checked)}
                    />
                  }
                  label="نام تفصیلی"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
              </Box>
            </Box>
          </Collapse>

          {/* Main Table */}
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
                      ردیف
                    </TableCell>
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
                      تاریخ سند
                    </TableCell>
                    {showDescription && (
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
                    )}
                    {showSubsidiaryDescription && (
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}>
                        نام معین
                      </TableCell>
                    )}
                    {showDetailDescription && (
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}>
                        نام تفصیلی
                      </TableCell>
                    )}
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
                      </TableRow>
                    </TableHead>
                    <TableBody>
                  {ledgerEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5 + (showDescription ? 1 : 0) + (showSubsidiaryDescription ? 1 : 0) + (showDetailDescription ? 1 : 0)} sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 4
                      }}>
                        {loading ? 'در حال بارگذاری...' : 'هیچ ردیفی یافت نشد'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerEntries
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((entry, index) => (
                        <TableRow key={entry.id}>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center'
                      }}>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center'
                      }}>
                        {entry.documentNumber || entry.reference || '-'}
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center'
                      }}>
                        {formatDate(entry.date)}
                      </TableCell>
                      {showDescription && (
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {entry.description}
                        </TableCell>
                      )}
                      {showSubsidiaryDescription && (
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {entry.subsidiaryDescription || '-'}
                        </TableCell>
                      )}
                      {showDetailDescription && (
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {entry.detailDescription || '-'}
                        </TableCell>
                      )}
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center'
                      }}>
                            {entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}
                          </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center'
                      }}>
                            {entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}
                          </TableCell>
                    </TableRow>
                    ))
                  )}
                  {/* Total Row */}
                  {ledgerEntries.length > 0 && (
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
                      {showDescription && (
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                        </TableCell>
                      )}
                      {showSubsidiaryDescription && (
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                        </TableCell>
                      )}
                      {showDetailDescription && (
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                        </TableCell>
                      )}
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
                        </TableRow>
                  )}
                    </TableBody>
                  </Table>
                </TableContainer>

          {ledgerEntries.length > 0 && (
          <TablePagination
            component="div"
              count={ledgerEntries.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value))}
            labelRowsPerPage="تعداد ردیف در صفحه:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} از ${count}`
            }
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
          )}

          {ledgerEntries.length === 0 && !loading && selectedAccount && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}>
                هیچ رکوردی برای حساب انتخابی یافت نشد
              </Typography>
            </Box>
          )}


      {/* Print Preview Dialog */}
      <Dialog
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          پیش‌نمایش چاپ - دفتر کل
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
              pb: 1
            }}>
              دفتر کل
            </Box>
            
            {/* Print Range */}
            <Box className="print-range" sx={{ 
              textAlign: 'center', 
              mb: 2, 
              fontSize: '14px', 
              color: '#666'
            }}>
              {getDisplayRange()}
            </Box>

            {/* Print Table */}
            <Table sx={{ 
              width: '100%',
              '& .MuiTableCell-root': {
                border: '1px solid #000',
                fontSize: '12px',
                padding: '8px',
                textAlign: 'center'
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                backgroundColor: '#757575',
                color: 'white',
                fontWeight: 'bold'
              }
            }}>
              <TableHead>
                <TableRow>
                  <TableCell>ردیف</TableCell>
                  <TableCell>شماره سند</TableCell>
                  <TableCell>تاریخ سند</TableCell>
                  {showDescription && (
                    <TableCell>شرح</TableCell>
                  )}
                  {showSubsidiaryDescription && (
                    <TableCell>نام معین</TableCell>
                  )}
                  {showDetailDescription && (
                    <TableCell>نام تفصیلی</TableCell>
                  )}
                  <TableCell>بدهکار</TableCell>
                  <TableCell>بستانکار</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledgerEntries.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{entry.documentNumber || entry.reference || '-'}</TableCell>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    {showDescription && (
                      <TableCell>{entry.description}</TableCell>
                    )}
                    {showSubsidiaryDescription && (
                      <TableCell>{entry.subsidiaryDescription || '-'}</TableCell>
                    )}
                    {showDetailDescription && (
                      <TableCell>{entry.detailDescription || '-'}</TableCell>
                    )}
                    <TableCell>{entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}</TableCell>
                    <TableCell>{entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}</TableCell>
                  </TableRow>
                ))}
                {/* Total Row for Print Preview */}
                {ledgerEntries.length > 0 && (
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
                    {showDescription && (
                      <TableCell></TableCell>
                    )}
                    {showSubsidiaryDescription && (
                      <TableCell></TableCell>
                    )}
                    {showDetailDescription && (
                      <TableCell></TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {totalDebit.toLocaleString('fa-IR')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {totalCredit.toLocaleString('fa-IR')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPrintPreview(false)}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            انصراف
          </Button>
          <Button
            onClick={handlePrintConfirm}
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
