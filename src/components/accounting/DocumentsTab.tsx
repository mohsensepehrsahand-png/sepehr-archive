"use client";
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Tooltip,
  TableSortLabel,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Snackbar
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Receipt,
  Search,
  ArrowUpward,
  ArrowDownward,
  CheckCircle,
  Schedule,
  FilterList
} from '@mui/icons-material';
import { Switch } from '@mui/material';
import DocumentModal from './DocumentModal';
import AccountSelectorModal from './AccountSelectorModal';
import { useTableFilters, TableFilters } from '@/components/common';
import DateFilterModal from './DateFilterModal';

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
}

interface DocumentsTabProps {
  projectId: string;
}

export default function DocumentsTab({ projectId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusChangeMessage, setStatusChangeMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'warning'>('success');
  
  // Sorting states
  const [sortField, setSortField] = useState<keyof Document | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Sub-tab state
  const [subTabValue, setSubTabValue] = useState(0);
  
  // Date filter modal state
  const [dateFilterModalOpen, setDateFilterModalOpen] = useState(false);

  // Use the new filter hook
  const {
    filteredData: filteredDocuments,
    filters,
    setSearchTerm,
    setDateFilter,
    setCustomFilter,
    clearAllFilters,
    hasActiveFilters
  } = useTableFilters({
    data: documents,
    searchFields: ['documentNumber', 'description'],
    dateField: 'documentDate',
    customFilterFields: {
      status: (item: Document, value: string) => {
        if (value === 'all') return true;
        return item.status === value;
      }
    }
  });

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

  // Sorting function
  const handleSort = (field: keyof Document) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter documents by status based on sub-tab
  const filterDocumentsByStatus = (docs: Document[], tabIndex: number) => {
    switch (tabIndex) {
      case 0: // همه اسناد
        return docs;
      case 1: // اسناد موقت
        return docs.filter(doc => doc.status === 'TEMPORARY');
      case 2: // اسناد دایم
        return docs.filter(doc => doc.status === 'PERMANENT');
      default:
        return docs;
    }
  };

  // Get documents count for temporary tab badge
  const getTemporaryDocumentsCount = () => {
    return documents.filter(doc => doc.status === 'TEMPORARY').length;
  };

  // Handle sub-tab change
  const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSubTabValue(newValue);
  };

  // Sort documents
  const sortDocuments = (docs: Document[]) => {
    if (!sortField) return docs;
    
    return [...docs].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle date sorting
      if (sortField === 'documentDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      // Handle number sorting
      if (sortField === 'totalDebit' || sortField === 'totalCredit') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  // Apply sub-tab filtering to the already filtered data
  const finalFilteredDocuments = useMemo(() => {
    const statusFiltered = filterDocumentsByStatus(filteredDocuments, subTabValue);
    return sortDocuments(statusFiltered);
  }, [filteredDocuments, subTabValue, sortField, sortDirection]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/documents?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        setError('خطا در دریافت اسناد');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('خطا در دریافت اسناد');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = () => {
    setSelectedDocument(null);
    setIsEditMode(false);
    setDocumentModalOpen(true);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsEditMode(false);
    setViewModalOpen(true);
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsEditMode(true);
    setDocumentModalOpen(true);
  };

  const handleDeleteDocument = (document: Document) => {
    setSelectedDocument(document);
    
    // If document is permanent, show special confirmation dialog
    if (document.status === 'PERMANENT') {
      setPermanentDeleteDialogOpen(true);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch(`/api/accounting/documents/${selectedDocument.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocuments(docs => docs.filter(doc => doc.id !== selectedDocument.id));
        setDeleteDialogOpen(false);
        setSelectedDocument(null);
        
        // Show success message
        setStatusChangeMessage(`سند "${selectedDocument.documentNumber}" با موفقیت حذف شد`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        setError(errorData.error || 'خطا در حذف سند');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('خطا در حذف سند');
    }
  };

  const confirmConvertToTemporary = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch(`/api/accounting/documents/${selectedDocument.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'TEMPORARY' })
      });

      if (response.ok) {
        // Update document status in the list
        setDocuments(docs => 
          docs.map(doc => 
            doc.id === selectedDocument.id 
              ? { ...doc, status: 'TEMPORARY' as const }
              : doc
          )
        );
        
        setPermanentDeleteDialogOpen(false);
        setSelectedDocument(null);
        
        // Show success message
        setStatusChangeMessage(`سند "${selectedDocument.documentNumber}" به حالت موقت تبدیل شد`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'خطا در تبدیل وضعیت سند');
      }
    } catch (error) {
      console.error('Error converting document to temporary:', error);
      setError('خطا در تبدیل وضعیت سند');
    }
  };

  const handleStatusToggle = async (document: Document) => {
    const newStatus = document.status === 'TEMPORARY' ? 'PERMANENT' : 'TEMPORARY';
    
    try {
      const response = await fetch(`/api/accounting/documents/${document.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setDocuments(docs => 
          docs.map(doc => 
            doc.id === document.id 
              ? { ...doc, status: newStatus as const }
              : doc
          )
        );
        
        // Show success message
        const statusText = newStatus === 'TEMPORARY' ? 'موقت' : 'دائم';
        setStatusChangeMessage(`سند "${document.documentNumber}" به حالت ${statusText} تبدیل شد`);
        setSnackbarSeverity(newStatus === 'TEMPORARY' ? 'warning' : 'success');
        setSnackbarOpen(true);
      } else {
        setError('خطا در تغییر وضعیت سند');
      }
    } catch (error) {
      console.error('Error changing document status:', error);
      setError('خطا در تغییر وضعیت سند');
    }
  };


  const handleSaveDocument = async (documentData: Omit<Document, 'id'>) => {
    try {
      if (!projectId) {
        setError('شناسه پروژه یافت نشد');
        return;
      }
      
      const url = isEditMode && selectedDocument 
        ? `/api/accounting/documents/${selectedDocument.id}`
        : '/api/accounting/documents';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const requestBody = {
        ...documentData,
        projectId
      };
      
      // Clean up undefined values
      const cleanedBody = Object.fromEntries(
        Object.entries(requestBody).filter(([_, v]) => v !== undefined)
      );

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedBody)
      });

      if (response.ok) {
        const savedDocument = await response.json();
        
        if (isEditMode) {
          setDocuments(docs => 
            docs.map(doc => doc.id === selectedDocument?.id ? savedDocument : doc)
          );
        } else {
          setDocuments(docs => [...docs, savedDocument]);
        }
        
        setDocumentModalOpen(false);
        setSelectedDocument(null);
      } else {
        const errorData = await response.json();
        setError(`خطا در ذخیره سند: ${errorData.error || 'خطای نامشخص'}`);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setError('خطا در ذخیره سند');
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}


      {/* Sub-tabs and Add Button in same row */}
      <Box display="flex" alignItems="center" mb={3} sx={{ direction: 'rtl' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddDocument}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: '150px', order: 1 }}
        >
          افزودن سند
        </Button>
        <Paper sx={{ ml: 2, order: 2, maxWidth: '600px' }}>
          <Tabs
            value={subTabValue}
            onChange={handleSubTabChange}
            variant="standard"
            sx={{
              '& .MuiTab-root': {
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 600,
                minWidth: '120px',
                borderRight: '1px solid #e0e0e0',
                '&:last-child': {
                  borderRight: 'none'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1976d2'
              }
            }}
          >
            <Tab 
              label="همه اسناد" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Tab 
              label={
                <Badge 
                  badgeContent={getTemporaryDocumentsCount()} 
                  color="warning"
                  sx={{ '& .MuiBadge-badge': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
                >
                  اسناد موقت
                </Badge>
              }
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Tab 
              label="اسناد دایم" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
          </Tabs>
        </Paper>
      </Box>

      {/* Search Input */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="جستجو در اسناد (شماره سند، توضیحات، تاریخ، مبالغ)..."
          value={filters.searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { py: 1 } }}>
              <TableCell sx={{ textAlign: 'center' }}>ردیف</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <TableSortLabel
                  active={sortField === 'documentNumber'}
                  direction={sortField === 'documentNumber' ? sortDirection : 'asc'}
                  onClick={() => handleSort('documentNumber')}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  شماره سند
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                  <TableSortLabel
                    active={sortField === 'documentDate'}
                    direction={sortField === 'documentDate' ? sortDirection : 'asc'}
                    onClick={() => handleSort('documentDate')}
                    sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                  >
                    تاریخ سند
                  </TableSortLabel>
                  <Tooltip title="فیلتر تاریخ">
                    <IconButton 
                      size="small" 
                      onClick={() => setDateFilterModalOpen(true)}
                      sx={{ 
                        p: 0.5,
                        color: filters.dateFilter ? 'primary.main' : 'text.secondary',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <FilterList fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <TableSortLabel
                  active={sortField === 'description'}
                  direction={sortField === 'description' ? sortDirection : 'asc'}
                  onClick={() => handleSort('description')}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  توضیحات سند
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <TableSortLabel
                  active={sortField === 'totalDebit'}
                  direction={sortField === 'totalDebit' ? sortDirection : 'asc'}
                  onClick={() => handleSort('totalDebit')}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  جمع بدهکار
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <TableSortLabel
                  active={sortField === 'totalCredit'}
                  direction={sortField === 'totalCredit' ? sortDirection : 'asc'}
                  onClick={() => handleSort('totalCredit')}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  جمع بستانکار
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortDirection : 'asc'}
                  onClick={() => handleSort('status')}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  حالت
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {finalFilteredDocuments.map((document, index) => (
              <TableRow key={document.id} sx={{ '& .MuiTableCell-root': { py: 0.5 } }}>
                <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{document.documentNumber}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{formatDate(document.documentDate)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{document.description}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Chip 
                    label={document.totalDebit.toLocaleString('fa-IR')} 
                    color="error" 
                    size="small" 
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Chip 
                    label={document.totalCredit.toLocaleString('fa-IR')} 
                    color="success" 
                    size="small" 
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Switch
                    checked={document.status === 'PERMANENT'}
                    onChange={() => handleStatusToggle(document)}
                    color="success"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50', // Green color
                        '& + .MuiSwitch-track': {
                          backgroundColor: '#4caf50',
                        },
                      },
                      '& .MuiSwitch-switchBase': {
                        color: '#ff9800', // Yellow/Orange color
                        '& + .MuiSwitch-track': {
                          backgroundColor: '#ff9800',
                        },
                      },
                      '& .MuiSwitch-thumb': {
                        '&::before': {
                          content: `"${document.status === 'TEMPORARY' ? 'موقت' : 'دائم'}"`,
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: 'white',
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                        },
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Tooltip title="مشاهده">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewDocument(document)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  {document.status === 'TEMPORARY' && (
                    <Tooltip title="ویرایش">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditDocument(document)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="حذف">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteDocument(document)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {finalFilteredDocuments.length === 0 && (
              <TableRow sx={{ '& .MuiTableCell-root': { py: 1 } }}>
                <TableCell colSpan={8} align="center">
                  <Box py={4}>
                    <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      {filters.searchTerm ? 'هیچ سندی با این جستجو یافت نشد' : 'هیچ سندی یافت نشد'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <DocumentModal
        open={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        onSave={handleSaveDocument}
        document={selectedDocument}
        isEditMode={isEditMode}
        projectId={projectId}
      />

      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>مشاهده سند</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>شماره سند:</strong> {selectedDocument.documentNumber}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>تاریخ سند:</strong> {formatDate(selectedDocument.documentDate)}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>توضیحات:</strong> {selectedDocument.description}
                </Typography>
              </Box>
              
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>کد حساب</TableCell>
                      <TableCell>نام حساب</TableCell>
                      <TableCell>ماهیت</TableCell>
                      <TableCell>بدهکار</TableCell>
                      <TableCell>بستانکار</TableCell>
                      <TableCell>شرح</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedDocument.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.accountCode}</TableCell>
                        <TableCell>{entry.accountName}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              entry.accountNature === 'DEBIT' ? 'بدهکار' :
                              entry.accountNature === 'CREDIT' ? 'بستانکار' :
                              entry.accountNature === 'DEBIT_CREDIT' ? 'بدهکار-بستانکار' : '-'
                            }
                            color={
                              entry.accountNature === 'DEBIT' ? 'error' :
                              entry.accountNature === 'CREDIT' ? 'success' :
                              entry.accountNature === 'DEBIT_CREDIT' ? 'warning' : 'default'
                            }
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{entry.debit.toLocaleString('fa-IR')}</TableCell>
                        <TableCell>{entry.credit.toLocaleString('fa-IR')}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>تأیید حذف</DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف سند "{selectedDocument?.documentNumber}" اطمینان دارید؟
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            لغو
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={permanentDeleteDialogOpen}
        onClose={() => setPermanentDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'warning.main', fontWeight: 'bold' }}>
          ⚠️ تبدیل سند دائم به موقت
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
              سند "{selectedDocument?.documentNumber}" در حالت دائم است و قابل حذف مستقیم نیست.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              برای حذف این سند، ابتدا باید آن را به حالت موقت تبدیل کنید.
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
              آیا می‌خواهید این سند را به حالت موقت تبدیل کنید؟
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPermanentDeleteDialogOpen(false)}
            variant="outlined"
          >
            لغو
          </Button>
          <Button 
            onClick={confirmConvertToTemporary} 
            color="warning" 
            variant="contained"
            sx={{ fontWeight: 'bold' }}
          >
            تبدیل به موقت
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
          sx={{ 
            width: '100%',
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            '& .MuiAlert-message': {
              fontWeight: 'bold'
            },
            '& .MuiAlert-icon': {
              fontSize: '20px'
            }
          }}
        >
          {statusChangeMessage}
        </Alert>
      </Snackbar>

      <DateFilterModal
        open={dateFilterModalOpen}
        onClose={() => setDateFilterModalOpen(false)}
        onApply={setDateFilter}
        currentFilter={filters.dateFilter}
      />

    </Box>
  );
}
