"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Tooltip,
  Chip
} from "@mui/material";
import {
  CreateNewFolder,
  CloudUpload,
  Home,
  ArrowBack,
  Add,
  Folder,
  Visibility,
  Download,
  Delete
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import FolderCard from "./FolderCard";
import DocumentUpload from "./DocumentUpload";
import MobileFolderCard from "@/components/mobile/MobileFolderCard";
import MobileDocumentCard from "@/components/mobile/MobileDocumentCard";
import MobileBreadcrumb from "@/components/mobile/MobileBreadcrumb";
import MobileDocumentViewer from "@/components/mobile/MobileDocumentViewer";
import { useMediaQuery, useTheme } from "@mui/material";

interface Folder {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  parentId?: string;
  path: string;
  depth: number;
  documents: number;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  description?: string;
  mimeType: string;
  sizeBytes: number;
  fileExt: string;
  uploadedBy: string;
  folderId?: string;
  createdAt: string;
}

interface FolderManagerProps {
  projectId: string;
  folders: Folder[];
  documents: Document[];
  onFolderCreate: (folderData: Omit<Folder, 'id' | 'createdAt'>) => void;
  onDocumentUpload: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
  onFolderDelete: (folderId: string) => void;
  creatingFolder: boolean;
  projectPermissions?: any[];
}

export default function FolderManager({
  projectId,
  folders,
  documents,
  onFolderCreate,
  onDocumentUpload,
  onDocumentDelete,
  onFolderDelete,
  creatingFolder,
  projectPermissions = []
}: FolderManagerProps) {
  const { isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [openNewFolder, setOpenNewFolder] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editFolderData, setEditFolderData] = useState({ name: "", description: "" });
  const [folderPermissions, setFolderPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && folders.length > 0) {
      fetchFolderPermissions();
    }
  }, [currentUserId, folders]);

  // Refresh folder permissions when they change
  useEffect(() => {
    if (Object.keys(folderPermissions).length > 0) {
      console.log('Folder permissions updated:', folderPermissions);
    }
  }, [folderPermissions]);

  // Function to refresh folder permissions (can be called from parent)
  const refreshPermissions = () => {
    console.log('Refreshing permissions...');
    fetchFolderPermissions();
  };

  // Expose refresh function to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshFolderPermissions = refreshPermissions;
    }
  }, []);

  // Listen for permission changes
  useEffect(() => {
    const handlePermissionChange = () => {
      console.log('Permission change detected, refreshing...');
      setTimeout(() => fetchFolderPermissions(), 100);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('permissionsChanged', handlePermissionChange);
      return () => window.removeEventListener('permissionsChanged', handlePermissionChange);
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/current-user');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUserId(userData.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchFolderPermissions = async () => {
    try {
      console.log('=== FETCHING FOLDER PERMISSIONS ===');
      console.log('Current user ID:', currentUserId);
      console.log('Folders to check:', folders.map(f => ({ id: f.id, name: f.name })));
      
      // Get permissions for all folders in the project
      const promises = folders.map(folder => 
        fetch(`/api/folders/${folder.id}/permissions`)
      );
      
      console.log('API requests:', promises.length);
      
      const responses = await Promise.all(promises);
      const permMap: Record<string, Record<string, boolean>> = {};
      
      for (let i = 0; i < responses.length; i++) {
        console.log(`Response ${i} for folder ${folders[i].name}:`, responses[i].status, responses[i].ok);
        if (responses[i].ok) {
          const data = await responses[i].json();
          console.log(`Permissions data for folder ${folders[i].name}:`, data);
          data.forEach((perm: any) => {
            if (!permMap[perm.folderId]) {
              permMap[perm.folderId] = {};
            }
            permMap[perm.folderId][perm.userId] = perm.canView;
          });
        } else {
          console.error(`Failed to fetch permissions for folder ${folders[i].name}:`, responses[i].status);
        }
      }
      
      console.log('Final permissions map:', permMap);
      console.log('Setting folder permissions...');
      setFolderPermissions(permMap);
      console.log('=== FETCHING COMPLETE ===');
    } catch (error) {
      console.error('Error fetching folder permissions:', error);
    }
  };

  const getCurrentFolderId = (): string | null => {
    if (currentPath.length === 0) return null;
    const currentFolderName = currentPath[currentPath.length - 1];
    return folders.find(f => f.name === currentFolderName)?.id || null;
  };

  const getCurrentFolders = (): Folder[] => {
    const currentFolderId = getCurrentFolderId();
    let availableFolders = folders.filter(f => f.parentId === currentFolderId);
    
    // اگر کاربر admin نیست، فقط پوشه‌های مجاز را نمایش بده
    if (!isAdmin && currentUserId) {
      availableFolders = availableFolders.filter(folder => {
        const userPermissions = folderPermissions[folder.id];
        // اگر دسترسی تعریف نشده، پوشه را نمایش نده
        return userPermissions && userPermissions[currentUserId] === true;
      });
      
      console.log('Filtered folders for user:', currentUserId);
      console.log('Available folders:', availableFolders.map(f => f.name));
      console.log('Folder permissions:', folderPermissions);
    }
    
    return availableFolders;
  };

  // تابع کمکی برای بررسی دسترسی کاربر به پوشه
  const hasFolderAccess = (folderId: string): boolean => {
    if (isAdmin) return true;
    if (!currentUserId) return false;
    
    const userPermissions = folderPermissions[folderId];
    return userPermissions && userPermissions[currentUserId] === true;
  };

  const getCurrentDocuments = (): Document[] => {
    const currentFolderId = getCurrentFolderId();
    if (!currentFolderId) {
      return documents.filter(d => !d.folderId);
    }
    return documents.filter(d => d.folderId === currentFolderId);
  };

  const navigateToFolder = (folder: Folder) => {
    setCurrentPath([...currentPath, folder.name]);
  };

  const navigateBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const navigateToRoot = () => {
    setCurrentPath([]);
  };

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      setError("نام پوشه الزامی است");
      return;
    }


    if (!currentUserId) {
      setError("خطا در شناسایی کاربر. لطفاً صفحه را refresh کنید");
      return;
    }

    const existingFolder = folders.find(f => 
      f.parentId === getCurrentFolderId() && 
      f.name.toLowerCase() === newFolder.name.trim().toLowerCase()
    );
    
    if (existingFolder) {
      setError("پوشه‌ای با این نام در مسیر فعلی وجود دارد");
      return;
    }

    const currentFolderId = getCurrentFolderId();
    const parentPath = currentPath.join('/');
    
    const folderData = {
      name: newFolder.name.trim(),
      description: newFolder.description.trim(),
      projectId,
      parentId: currentFolderId || undefined,
      path: parentPath ? `/${parentPath}/${newFolder.name.trim()}` : `/${newFolder.name.trim()}`,
      depth: currentPath.length + 1,
      tabKey: 'BUYER',
      documents: 0,
      createdBy: currentUserId
    };

    console.log('Creating folder with data:', folderData);
    console.log('Name:', folderData.name);
    console.log('CreatedBy:', folderData.createdBy);

    onFolderCreate(folderData);
    setNewFolder({ name: "", description: "" });
    setOpenNewFolder(false);
    setError("");
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setEditFolderData({ 
      name: folder.name, 
      description: folder.description || "" 
    });
    setError("");
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder) return;
    
    if (!editFolderData.name.trim()) {
      setError("نام پوشه الزامی است");
      return;
    }

    try {
      const response = await fetch(`/api/folders/${editingFolder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFolderData.name.trim(),
          description: editFolderData.description.trim()
        }),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'خطا در ویرایش پوشه');
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      setError('خطا در ویرایش پوشه');
    }
  };

  const handleCancelEdit = () => {
    setEditingFolder(null);
    setEditFolderData({ name: "", description: "" });
    setError("");
  };

  const handleFolderDelete = (folderId: string) => {
    if (confirm('آیا از حذف این پوشه اطمینان دارید؟')) {
      onFolderDelete(folderId);
    }
  };

  const handleViewDocument = (document: Document) => {
    // Log view activity
    logDocumentActivity(document.id, 'view', document.name);
    
    if (isMobile) {
      setViewingDocument(document);
    } else {
      // باز کردن سند در تب جدید
      window.open(`/api/documents/${document.id}/download`, '_blank');
    }
  };

  const handleDocumentDownload = (document: Document) => {
    // Log download activity
    logDocumentActivity(document.id, 'download', document.name);
    
    // Open download link
    window.open(`/api/documents/${document.id}/download`, '_blank');
  };

  const logDocumentActivity = async (documentId: string, action: 'view' | 'download', documentName: string) => {
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'document',
          action,
          documentId,
          documentName,
          projectId,
          details: {
            action: action === 'view' ? 'مشاهده سند' : 'دانلود سند',
            documentName
          }
        }),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleDocumentDelete = (documentId: string) => {
    if (confirm('آیا از حذف این سند اطمینان دارید؟')) {
      onDocumentDelete(documentId);
    }
  };

  const currentFolders = getCurrentFolders();
  const currentDocuments = getCurrentDocuments();

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <MobileBreadcrumb
        currentPath={currentPath}
        onNavigateToRoot={navigateToRoot}
        onNavigateToPath={(index) => setCurrentPath(currentPath.slice(0, index + 1))}
        onNavigateBack={navigateBack}
        showBackButton={currentPath.length > 0}
      />

      {/* Header with Actions */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Typography 
          variant="h5" 
          fontWeight="bold"
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontSize: { xs: '1.25rem', md: '1.5rem' }
          }}
        >
          {currentPath.length === 0 ? 'پوشه اصلی' : currentPath[currentPath.length - 1]}
        </Typography>
        
        {isAdmin && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button
              variant="contained"
              startIcon={<CreateNewFolder />}
              onClick={() => setOpenNewFolder(true)}
              disabled={creatingFolder}
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {creatingFolder ? 'در حال ایجاد...' : 'پوشه جدید'}
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              آپلود سند
            </Button>
          </Box>
        )}
      </Box>

      {/* Content */}
      {isMobile ? (
        <Box>
          {/* Mobile Folders */}
          {currentFolders.map(folder => (
            <MobileFolderCard
              key={folder.id}
              folder={folder}
              onClick={() => navigateToFolder(folder)}
              onEdit={() => handleEditFolder(folder)}
              onDelete={() => handleFolderDelete(folder.id)}
              showActions={isAdmin}
            />
          ))}

          {/* Mobile Documents */}
          {currentDocuments.map(document => (
            <MobileDocumentCard
              key={document.id}
              document={document}
              onView={() => handleViewDocument(document)}
              onDownload={() => handleDocumentDownload(document)}
              onDelete={() => handleDocumentDelete(document.id)}
              showActions={isAdmin}
            />
          ))}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Desktop Folders */}
          {currentFolders.map(folder => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
              <FolderCard
                folder={folder}
                onClick={() => navigateToFolder(folder)}
                onEdit={() => handleEditFolder(folder)}
                onDelete={() => handleFolderDelete(folder.id)}
                showActions={isAdmin}
              />
            </Grid>
          ))}

          {/* Desktop Documents */}
          {currentDocuments.map(document => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={document.id}>
              <Paper sx={{ 
                p: 2, 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 3 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4">
                    📄
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" noWrap sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {document.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {document.description || 'بدون توضیحات'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {(document.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                </Box>
                
                {/* Document Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                  <Tooltip title="مشاهده">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewDocument(document)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="دانلود">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleDocumentDownload(document)}
                    >
                      <Download />
                    </IconButton>
                  </Tooltip>
                  {isAdmin && (
                    <Tooltip title="حذف">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDocumentDelete(document.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {currentFolders.length === 0 && currentDocuments.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            این پوشه خالی است
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            پوشه یا سند جدید ایجاد کنید
          </Typography>
          {isAdmin && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<CreateNewFolder />}
                onClick={() => setOpenNewFolder(true)}
              >
                پوشه جدید
              </Button>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setUploadDialogOpen(true)}
              >
                آپلود سند
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* New Folder Dialog */}
      <Dialog open={openNewFolder} onClose={() => setOpenNewFolder(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ایجاد پوشه جدید</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="نام پوشه"
              value={newFolder.name}
              onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="توضیحات"
              value={newFolder.description}
              onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewFolder(false)}>
            انصراف
          </Button>
          <Button 
            onClick={handleCreateFolder} 
            variant="contained"
            disabled={!newFolder.name.trim()}
          >
            ایجاد
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>ویرایش پوشه</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="نام پوشه"
              value={editFolderData.name}
              onChange={(e) => setEditFolderData({ ...editFolderData, name: e.target.value })}
              fullWidth
              required
              variant="outlined"
            />
            <TextField
              label="توضیحات (اختیاری)"
              value={editFolderData.description}
              onChange={(e) => setEditFolderData({ ...editFolderData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>
            انصراف
          </Button>
          <Button
            onClick={handleUpdateFolder}
            variant="contained"
            disabled={!editFolderData.name.trim()}
          >
            ذخیره تغییرات
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Upload Dialog */}
      <DocumentUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        projectId={projectId}
        folderId={getCurrentFolderId() || projectId}
        onUploadSuccess={onDocumentUpload}
      />

      {/* Mobile Document Viewer */}
      <MobileDocumentViewer
        open={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
        onDownload={() => {
          if (viewingDocument) {
            handleDocumentDownload(viewingDocument);
          }
        }}
        onDelete={() => {
          if (viewingDocument) {
            handleDocumentDelete(viewingDocument.id);
            setViewingDocument(null);
          }
        }}
        showDelete={isAdmin}
      />
    </Box>
  );
}
