"use client";
import { useState, useEffect } from 'react';
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
  Badge
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
  Schedule
} from '@mui/icons-material';
import DocumentModal from './DocumentModal';
import AccountSelectorModal from './AccountSelectorModal';

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
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Sorting and filtering states
  const [sortField, setSortField] = useState<keyof Document | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sub-tab state
  const [subTabValue, setSubTabValue] = useState(0);

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

  // Filter documents based on search term
  const filterDocuments = (docs: Document[], search: string) => {
    if (!search) return docs;
    
    return docs.filter(doc => 
      doc.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase()) ||
      formatDate(doc.documentDate).includes(search) ||
      doc.totalDebit.toString().includes(search) ||
      doc.totalCredit.toString().includes(search)
    );
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

  // Handle filtering and sorting when documents, search term, sort settings, or sub-tab change
  useEffect(() => {
    let filtered = filterDocumentsByStatus(documents, subTabValue);
    filtered = filterDocuments(filtered, searchTerm);
    filtered = sortDocuments(filtered);
    setFilteredDocuments(filtered);
  }, [documents, searchTerm, sortField, sortDirection, subTabValue]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/documents?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
        setFilteredDocuments(data);
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
    setDeleteDialogOpen(true);
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
      } else {
        setError('خطا در حذف سند');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('خطا در حذف سند');
    }
  };

  const handleStatusChange = (document: Document) => {
    if (document.status === 'TEMPORARY') {
      setSelectedDocument(document);
      setStatusChangeDialogOpen(true);
    }
  };

  const confirmStatusChange = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch(`/api/accounting/documents/${selectedDocument.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PERMANENT' })
      });

      if (response.ok) {
        setDocuments(docs => 
          docs.map(doc => 
            doc.id === selectedDocument.id 
              ? { ...doc, status: 'PERMANENT' as const }
              : doc
          )
        );
        setStatusChangeDialogOpen(false);
        setSelectedDocument(null);
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
          value={searchTerm}
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
        <Table>
          <TableHead>
            <TableRow>
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
                <TableSortLabel
                  active={sortField === 'documentDate'}
                  direction={sortField === 'documentDate' ? sortDirection : 'asc'}
                  onClick={() => handleSort('documentDate')}
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  تاریخ سند
                </TableSortLabel>
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
            {filteredDocuments.map((document, index) => (
              <TableRow key={document.id}>
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
                  <Chip
                    label={document.status === 'TEMPORARY' ? 'موقت' : 'دائم'}
                    color={document.status === 'TEMPORARY' ? 'warning' : 'success'}
                    icon={document.status === 'TEMPORARY' ? <Schedule /> : <CheckCircle />}
                    size="small"
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
                  {document.status === 'TEMPORARY' && (
                    <Tooltip title="تبدیل به دائم">
                      <IconButton 
                        size="small" 
                        onClick={() => handleStatusChange(document)}
                        color="success"
                      >
                        <CheckCircle />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredDocuments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box py={4}>
                    <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'هیچ سندی با این جستجو یافت نشد' : 'هیچ سندی یافت نشد'}
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
        open={statusChangeDialogOpen}
        onClose={() => setStatusChangeDialogOpen(false)}
      >
        <DialogTitle>تبدیل به سند دائم</DialogTitle>
        <DialogContent>
          <Typography>
            آیا می‌خواهید سند "{selectedDocument?.documentNumber}" را به سند دائم تبدیل کنید؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            پس از تبدیل به دائم، این سند دیگر قابل ویرایش نخواهد بود.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeDialogOpen(false)}>
            لغو
          </Button>
          <Button onClick={confirmStatusChange} color="success" variant="contained">
            تبدیل به دائم
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
