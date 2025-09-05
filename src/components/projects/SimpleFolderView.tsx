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
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Menu,
  MenuItem,
  Tooltip
} from "@mui/material";
import {
  CreateNewFolder,
  CloudUpload,
  Description,
  Folder,
  Home,
  MoreVert,
  Delete,
  Download,
  Visibility,
  Edit
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import DocumentUpload from "./DocumentUpload";
import { getSafeString, getSafeNumber } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  description: string;
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
  description: string;
  mimeType: string;
  sizeBytes: number;
  fileExt: string;
  uploadedBy: string;
  folderName: string;
  folderId?: string; // Added folderId to Document interface
  createdAt: string;
}

interface SimpleFolderViewProps {
  projectId: string;
  folders: Folder[];
  documents: Document[];
  onFolderCreate: (folderData: Omit<Folder, 'id' | 'createdAt'>) => void;
  onDocumentUpload: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
  onFolderDelete: (folderId: string) => void;
  creatingFolder: boolean;
}

export default function SimpleFolderView({
  projectId,
  folders,
  documents,
  onFolderCreate,
  onDocumentUpload,
  onDocumentDelete,
  onFolderDelete,
  creatingFolder
}: SimpleFolderViewProps) {
  const { isAdmin } = useAuth();
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [openNewFolder, setOpenNewFolder] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<Document | null>(null);
  const [newFolder, setNewFolder] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Get current user ID on component mount
  useEffect(() => {
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

    if (isAdmin) {
      getCurrentUser();
    }
  }, [isAdmin]);

  // Get current folder ID from path
  const getCurrentFolderId = (): string | null => {
    if (currentPath.length === 0) return null;
    const currentFolderName = currentPath[currentPath.length - 1];
    return folders.find(f => f.name === currentFolderName)?.id || null;
  };

  // Get folders in current path
  const getCurrentFolders = (): Folder[] => {
    const currentFolderId = getCurrentFolderId();
    return folders.filter(f => f.parentId === currentFolderId);
  };

  // Get current documents
  const getCurrentDocuments = (): Document[] => {
    const currentFolderId = getCurrentFolderId();
    if (!currentFolderId) {
      // If we're at root, show documents that don't have a folder (root level documents)
      return documents.filter(d => !d.folderId);
    }
    // Show documents in the current folder
    return documents.filter(d => d.folderId === currentFolderId);
  };

  // Navigate to folder
  const navigateToFolder = (folder: Folder) => {
    setCurrentPath([...currentPath, folder.name]);
  };

  // Navigate back
  const navigateBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  // Navigate to root
  const navigateToRoot = () => {
    setCurrentPath([]);
  };

  // Create folder
  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      setError("نام پوشه الزامی است");
      return;
    }


    // Check if folder name already exists in current path
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
      tabKey: 'BUYER', // Add the required tabKey field
      documents: 0,
      createdBy: currentUserId // Use the actual current user ID
    };

    console.log('Creating folder with data:', folderData);
    onFolderCreate(folderData);
    setNewFolder({ name: "", description: "" });
    setOpenNewFolder(false);
    setError("");
  };

  // Upload document
  const handleUploadDocument = () => {
    setUploadDialogOpen(true);
  };

  // View document
  const handleViewDocument = (document: Document) => {
    // Log view activity
    logDocumentActivity(document.id, 'view', document.name);
    setViewDocument(document);
  };

  // Download document
  const handleDownloadDocument = (document: Document) => {
    // Log download activity
    logDocumentActivity(document.id, 'download', document.name);
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    const safeBytes = getSafeNumber(bytes, 0);
    if (safeBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(safeBytes) / Math.log(k));
    return parseFloat((safeBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    return '📄';
  };

  const currentFolders = getCurrentFolders();
  const currentDocuments = getCurrentDocuments();

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Breadcrumbs>
          <MuiLink
            component="button"
            onClick={navigateToRoot}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          >
            <Home fontSize="small" />
            خانه
          </MuiLink>
          
          {currentPath.map((path, index) => (
            <MuiLink
              key={index}
              component="button"
              onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
              sx={{ cursor: 'pointer' }}
            >
              {getSafeString(path)}
            </MuiLink>
          ))}
        </Breadcrumbs>
      </Paper>

      {/* Header with Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {currentPath.length === 0 ? 'پوشه اصلی' : getSafeString(currentPath[currentPath.length - 1])}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isAdmin && (
            <>
              <Button
                variant="contained"
                startIcon={<CreateNewFolder />}
                onClick={() => setOpenNewFolder(true)}
                disabled={creatingFolder}
              >
                {creatingFolder ? 'در حال ایجاد...' : 'پوشه جدید'}
              </Button>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={handleUploadDocument}
              >
                آپلود سند
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Content Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {/* Folders */}
        {currentFolders.map(folder => (
          <Box key={folder.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 8px)', lg: 'calc(25% - 8px)' } }}>
            <Paper 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => navigateToFolder(folder)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                <Folder color="primary" sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold" noWrap>
                    {getSafeString(folder.name, 'نامشخص')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {getSafeString(folder.description, 'بدون توضیحات')}
                  </Typography>
                  <Chip 
                    label={`${getSafeNumber(folder.documents, 0)} سند`} 
                    size="small" 
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              {isAdmin && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1 }}>
                  <Tooltip title="حذف پوشه">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('آیا از حذف این پوشه اطمینان دارید؟')) {
                          try {
                            await onFolderDelete(folder.id);
                          } catch (error) {
                            console.error('Error deleting folder:', error);
                            alert('خطا در حذف پوشه');
                          }
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Paper>
          </Box>
        ))}

        {/* Documents */}
        {currentDocuments.map(document => (
          <Box key={document.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 8px)', lg: 'calc(25% - 8px)' } }}>
            <Paper>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                <Typography variant="h4">
                  {getFileIcon(getSafeString(document.mimeType))}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold" noWrap>
                    {getSafeString(document.name, 'نامشخص')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {getSafeString(document.description, 'بدون توضیحات')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(document.sizeBytes)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1 }}>
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
                    onClick={() => handleDownloadDocument(document)}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
                {isAdmin && (
                  <Tooltip title="حذف">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={async () => {
                        if (confirm('آیا از حذف این سند اطمینان دارید؟')) {
                          try {
                            await onDocumentDelete(document.id);
                          } catch (error) {
                            console.error('Error deleting document:', error);
                            alert('خطا در حذف سند');
                          }
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Empty State */}
      {currentFolders.length === 0 && currentDocuments.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            این پوشه خالی است
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            پوشه یا سند جدید ایجاد کنید
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {isAdmin && (
              <>
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
                  onClick={handleUploadDocument}
                >
                  آپلود سند
                </Button>
              </>
            )}
          </Box>
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

      {/* Document Upload Dialog */}
      <DocumentUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        projectId={projectId}
        folderId={getCurrentFolderId() || projectId} // Use projectId as root folder if no current folder
        onUploadSuccess={onDocumentUpload}
      />

      {/* Document View Dialog */}
      <Dialog 
        open={!!viewDocument} 
        onClose={() => setViewDocument(null)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          مشاهده سند: {viewDocument?.name}
        </DialogTitle>
        <DialogContent>
          {viewDocument && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>نام:</strong> {getSafeString(viewDocument.name, 'نامشخص')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>توضیحات:</strong> {getSafeString(viewDocument.description, 'بدون توضیحات')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>نوع فایل:</strong> {getSafeString(viewDocument.mimeType, 'نامشخص')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>حجم:</strong> {formatFileSize(viewDocument.sizeBytes)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>تاریخ آپلود:</strong> {new Date(viewDocument.createdAt).toLocaleDateString('fa-IR')}
              </Typography>
              
              {/* File Preview */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                {viewDocument.mimeType.includes('image') ? (
                  <img 
                    src={`/api/documents/${viewDocument.id}/download`} 
                    alt={getSafeString(viewDocument.name, 'نامشخص')}
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                  />
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h1" sx={{ mb: 2 }}>
                      {getFileIcon(getSafeString(viewDocument.mimeType))}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {getSafeString(viewDocument.name, 'نامشخص')}
                    </Typography>
                                         <Button
                       variant="contained"
                       href={`/api/documents/${viewDocument.id}/download`}
                       target="_blank"
                       download
                     >
                       دانلود فایل
                     </Button>
                  </Paper>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDocument(null)}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
