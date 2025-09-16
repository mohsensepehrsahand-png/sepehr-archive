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
  TextField,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Collapse,
  FormControlLabel,
  Checkbox,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Print,
  Search,
  Clear,
  Settings,
  ExpandMore,
  ExpandLess,
  FilterList
} from '@mui/icons-material';

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  level: number;
  parentId?: string;
  isActive: boolean;
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

interface DocumentEntry {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
  subsidiaryDescription?: string;
  detailDescription?: string;
}

interface DaybookProps {
  projectId: string;
}

export default function Daybook({ projectId }: DaybookProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [documentNumberFrom, setDocumentNumberFrom] = useState('');
  const [documentNumberTo, setDocumentNumberTo] = useState('');
  const [sortField, setSortField] = useState<'documentDate' | 'documentNumber' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAccountName, setShowAccountName] = useState(false);
  const [showSubsidiaryDescription, setShowSubsidiaryDescription] = useState(false);
  const [showDetailDescription, setShowDetailDescription] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/documents?projectId=${projectId}&status=PERMANENT`);
      
      if (!response.ok) {
        throw new Error('خطا در دریافت اسناد');
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اسناد');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
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


  const handleSort = (field: 'documentDate' | 'documentNumber') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setDocumentNumberFrom('');
    setDocumentNumberTo('');
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const handlePrintConfirm = () => {
    // ساخت محتوای چاپ به صورت دستی
    const printWindow = window.open('', '_blank');
    
    // ساخت جدول HTML برای چاپ
    let tableHTML = `
      <table class="print-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #757575; color: white;">
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">شماره سند</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">تاریخ</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">کد حساب</th>
            ${showAccountName ? '<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">نام حساب</th>' : ''}
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">شرح عملیات</th>
            ${showSubsidiaryDescription ? '<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">شرح سرفصل معین</th>' : ''}
            ${showDetailDescription ? '<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">شرح تفصیلی</th>' : ''}
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">بدهکار</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">بستانکار</th>
          </tr>
        </thead>
        <tbody>
    `;

    // اضافه کردن ردیف‌های داده
    sortedDocuments.forEach((document, docIndex) => {
      document.entries.forEach((entry, entryIndex) => {
        const isEvenDocument = docIndex % 2 === 0;
        const backgroundColor = isEvenDocument ? '#ffffff' : '#f8f9fa';
        
        tableHTML += `
          <tr style="background-color: ${backgroundColor};">
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${document.documentNumber}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${formatDate(document.documentDate)}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.accountCode}</td>
            ${showAccountName ? `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.accountName}</td>` : ''}
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.description || document.description}</td>
            ${showSubsidiaryDescription ? `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.subsidiaryDescription || '-'}</td>` : ''}
            ${showDetailDescription ? `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.detailDescription || '-'}</td>` : ''}
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}</td>
          </tr>
        `;
      });
    });

    // Add total row to print table
    tableHTML += `
          <tr style="background-color: #f5f5f5; font-weight: bold; font-size: 16px;">
            <td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: 2px solid #333; border-right: none; padding: 8px; text-align: center; font-weight: bold;">جمع کل</td>
            <td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: none; border-right: none; padding: 8px; text-align: center;"></td>
            <td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: none; border-right: none; padding: 8px; text-align: center;"></td>
            ${showAccountName ? '<td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: none; border-right: none; padding: 8px; text-align: center;"></td>' : ''}
            <td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: none; border-right: none; padding: 8px; text-align: center;"></td>
            ${showSubsidiaryDescription ? '<td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: none; border-right: none; padding: 8px; text-align: center;"></td>' : ''}
            ${showDetailDescription ? '<td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: none; border-right: none; padding: 8px; text-align: center;"></td>' : ''}
            <td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: none; border-right: none; padding: 8px; text-align: center; font-weight: bold; color: #1976d2;">${totalDebit.toLocaleString('fa-IR')}</td>
            <td style="border-top: 2px solid #333; border-bottom: 2px solid #333; border-left: none; border-right: 2px solid #333; padding: 8px; text-align: center; font-weight: bold; color: #1976d2;">${totalCredit.toLocaleString('fa-IR')}</td>
          </tr>
        </tbody>
      </table>
    `;

    printWindow?.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>دفتر روزنامه</title>
        <style>
          @page {
            margin: 20mm;
            @top-center {
              content: "دفتر روزنامه - صفحه " counter(page);
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
        <div class="print-header">دفتر روزنامه</div>
        <div class="print-range">${getDisplayRange()}</div>
        ${tableHTML}
      </body>
      </html>
    `);
    
    printWindow?.document.close();
    printWindow?.print();
    setShowPrintPreview(false);
  };

  const getDisplayRange = () => {
    if (sortedDocuments.length === 0) {
      return 'هیچ سند دایمی یافت نشد';
    }

    const firstDoc = sortedDocuments[0];
    const lastDoc = sortedDocuments[sortedDocuments.length - 1];
    
    let range = `از شماره سند ${firstDoc.documentNumber} تا شماره سند ${lastDoc.documentNumber}`;
    
    // محاسبه محدوده تاریخ از داده‌های جدول
    const allDates = sortedDocuments.map(doc => new Date(doc.documentDate));
    const minDate = new Date(Math.min(...allDates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(date => date.getTime())));
    
    // اضافه کردن محدوده تاریخ
    if (dateFrom || dateTo) {
      // اگر فیلتر تاریخ اعمال شده باشد، از فیلتر استفاده کن
      if (dateFrom && dateTo) {
        range += ` و از تاریخ ${formatDate(dateFrom)} تا تاریخ ${formatDate(dateTo)}`;
      } else if (dateFrom) {
        range += ` و از تاریخ ${formatDate(dateFrom)}`;
      } else if (dateTo) {
        range += ` تا تاریخ ${formatDate(dateTo)}`;
      }
    } else {
      // اگر فیلتر تاریخ اعمال نشده باشد، از داده‌های جدول استفاده کن
      range += ` و از تاریخ ${formatDate(minDate.toISOString())} تا تاریخ ${formatDate(maxDate.toISOString())}`;
    }
    
    // اضافه کردن محدوده شماره سند اگر فیلتر شماره سند اعمال شده باشد
    if (documentNumberFrom || documentNumberTo) {
      if (documentNumberFrom && documentNumberTo) {
        range += ` و از شماره سند ${documentNumberFrom} تا شماره سند ${documentNumberTo}`;
      } else if (documentNumberFrom) {
        range += ` و از شماره سند ${documentNumberFrom}`;
      } else if (documentNumberTo) {
        range += ` تا شماره سند ${documentNumberTo}`;
      }
    }

    range += ' می‌شود';
    return range;
  };







  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date range filter
    const docDate = new Date(document.documentDate);
    const matchesDateFrom = !dateFrom || docDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || docDate <= new Date(dateTo + 'T23:59:59');
    
    // Document number range filter
    const matchesDocFrom = !documentNumberFrom || document.documentNumber >= documentNumberFrom;
    const matchesDocTo = !documentNumberTo || document.documentNumber <= documentNumberTo;
    
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesDocFrom && matchesDocTo;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: string | number;
    let bValue: string | number;
    
    if (sortField === 'documentDate') {
      aValue = new Date(a.documentDate).getTime();
      bValue = new Date(b.documentDate).getTime();
    } else {
      aValue = a.documentNumber;
      bValue = b.documentNumber;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate totals for debit and credit columns
  const totalDebit = sortedDocuments.reduce((sum, document) => 
    sum + document.entries.reduce((entrySum, entry) => entrySum + entry.debit, 0), 0
  );
  
  const totalCredit = sortedDocuments.reduce((sum, document) => 
    sum + document.entries.reduce((entrySum, entry) => entrySum + entry.credit, 0), 0
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

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
              startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
              onClick={toggleFilters}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: 120 }}
            >
              فیلتر
            </Button>
            <Button
              variant="outlined"
              startIcon={showSettings ? <ExpandLess /> : <ExpandMore />}
              onClick={toggleSettings}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: 150 }}
            >
              تنظیمات دفتر روزنامه
            </Button>
          </Box>

          <Collapse in={showFilters}>
            <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}>
                فیلترها و جستجو
              </Typography>
              <Box display="flex" gap={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                  sx={{ minWidth: 200, flex: 1 }}
                label="جستجو در توضیحات و شماره سند"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
                <TextField
                  sx={{ minWidth: 150 }}
                  type="date"
                  label="از تاریخ"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              <TextField
                  sx={{ minWidth: 150 }}
                type="date"
                  label="تا تاریخ"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
                <TextField
                  sx={{ minWidth: 150 }}
                  label="از شماره سند"
                  value={documentNumberFrom}
                  onChange={(e) => setDocumentNumberFrom(e.target.value)}
                />
                <TextField
                  sx={{ minWidth: 150 }}
                  label="تا شماره سند"
                  value={documentNumberTo}
                  onChange={(e) => setDocumentNumberTo(e.target.value)}
                />
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: 120 }}
                >
                  پاک کردن فیلترها
                </Button>
              </Box>
            </Box>
          </Collapse>

          <Collapse in={showSettings}>
            <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}>
                انتخاب ستون‌های نمایش
              </Typography>
              <Box display="flex" gap={3} flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showAccountName}
                      onChange={(e) => setShowAccountName(e.target.checked)}
                    />
                  }
                  label="نام حساب"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showSubsidiaryDescription}
                      onChange={(e) => setShowSubsidiaryDescription(e.target.checked)}
                    />
                  }
                  label="شرح سرفصل معین"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showDetailDescription}
                      onChange={(e) => setShowDetailDescription(e.target.checked)}
                    />
                  }
                  label="شرح تفصیلی"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
              </Box>
            </Box>
          </Collapse>

          <TableContainer component={Paper}>
            <Table id="printable-content">
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
                    <TableSortLabel
                      active={sortField === 'documentNumber'}
                      direction={sortField === 'documentNumber' ? sortDirection : 'asc'}
                      onClick={() => handleSort('documentNumber')}
                      sx={{ color: '#ffffff', fontWeight: 'bold' }}
                    >
                      شماره سند
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}>
                    <TableSortLabel
                      active={sortField === 'documentDate'}
                      direction={sortField === 'documentDate' ? sortDirection : 'asc'}
                      onClick={() => handleSort('documentDate')}
                      sx={{ color: '#ffffff', fontWeight: 'bold' }}
                    >
                      تاریخ
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}>
                    کد حساب
                  </TableCell>
                  {showAccountName && (
                    <TableCell sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}>
                      نام حساب
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
                    شرح عملیات
                  </TableCell>
                  {showSubsidiaryDescription && (
                    <TableCell sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}>
                      شرح سرفصل معین
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
                      شرح تفصیلی
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
                {sortedDocuments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((document, docIndex) => 
                    document.entries.map((entry, entryIndex) => {
                      // تعیین رنگ بر اساس شماره سند (یکی در میان)
                      const isEvenDocument = docIndex % 2 === 0;
                      const backgroundColor = isEvenDocument ? '#ffffff' : '#f8f9fa';
                      
                      return (
                        <TableRow 
                          key={`${document.id}-${entry.id}`}
                          sx={{ backgroundColor }}
                        >
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {document.documentNumber}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {formatDate(document.documentDate)}
                        </TableCell>
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {entry.accountCode}
                        </TableCell>
                        {showAccountName && (
                          <TableCell sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            textAlign: 'center'
                          }}>
                            {entry.accountName}
                      </TableCell>
                        )}
                        <TableCell sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          textAlign: 'center'
                        }}>
                          {entry.description || document.description}
                      </TableCell>
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
                      );
                    })
                  )}
                {/* Total Row */}
                {sortedDocuments.length > 0 && (
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
                    {showAccountName && (
                      <TableCell sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center'
                      }}>
                      </TableCell>
                    )}
                    <TableCell sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      textAlign: 'center'
                    }}>
                    </TableCell>
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

          <TablePagination
            component="div"
            count={sortedDocuments.length}
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

          {sortedDocuments.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}>
                هیچ سند دایمی یافت نشد
            </Typography>
          </Box>
          )}
        </CardContent>
      </Card>

      {/* Print Preview Dialog */}
      <Dialog
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          پیش‌نمایش چاپ - دفتر روزنامه
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
              دفتر روزنامه
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
                  <TableCell>شماره سند</TableCell>
                  <TableCell>تاریخ</TableCell>
                  <TableCell>کد حساب</TableCell>
                  {showAccountName && <TableCell>نام حساب</TableCell>}
                  <TableCell>شرح عملیات</TableCell>
                  {showSubsidiaryDescription && <TableCell>شرح سرفصل معین</TableCell>}
                  {showDetailDescription && <TableCell>شرح تفصیلی</TableCell>}
                  <TableCell>بدهکار</TableCell>
                  <TableCell>بستانکار</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedDocuments.map((document, docIndex) => 
                  document.entries.map((entry, entryIndex) => {
                    const isEvenDocument = docIndex % 2 === 0;
                    const backgroundColor = isEvenDocument ? '#ffffff' : '#f8f9fa';
                    
                    return (
                      <TableRow key={`${document.id}-${entry.id}`} sx={{ backgroundColor }}>
                        <TableCell>{document.documentNumber}</TableCell>
                        <TableCell>{formatDate(document.documentDate)}</TableCell>
                        <TableCell>{entry.accountCode}</TableCell>
                        {showAccountName && <TableCell>{entry.accountName}</TableCell>}
                        <TableCell>{entry.description || document.description}</TableCell>
                        {showSubsidiaryDescription && <TableCell>{entry.subsidiaryDescription || '-'}</TableCell>}
                        {showDetailDescription && <TableCell>{entry.detailDescription || '-'}</TableCell>}
                        <TableCell>{entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}</TableCell>
                        <TableCell>{entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
                {/* Total Row for Print Preview */}
                {sortedDocuments.length > 0 && (
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
                    {showAccountName && <TableCell></TableCell>}
                    <TableCell></TableCell>
                    {showSubsidiaryDescription && <TableCell></TableCell>}
                    {showDetailDescription && <TableCell></TableCell>}
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
