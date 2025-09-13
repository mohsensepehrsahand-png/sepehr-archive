"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Breadcrumbs,
  Link as MuiLink
} from "@mui/material";
import {
  Close,
  Search,
  PictureAsPdf,
  Image,
  Description,
  Link,
  Folder,
  FolderOpen,
  Home,
  NavigateNext,
  AttachFile
} from "@mui/icons-material";
import { useState, useEffect } from "react";

interface Document {
  id: string;
  name: string;
  description?: string;
  mimeType: string;
  fileExt: string;
  createdAt: string;
  filePath: string;
  folderId?: string;
  folder?: {
    id: string;
    name: string;
  };
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  documents?: Document[];
}

interface DocumentSelectorProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  installmentId: string;
  onDocumentSelected: (documentId: string) => void;
}

export default function DocumentSelector({
  open,
  onClose,
  projectId,
  installmentId,
  onDocumentSelected
}: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [linking, setLinking] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{id: string, name: string}>>([]);
  const [currentDocuments, setCurrentDocuments] = useState<Document[]>([]);
  const [currentFolders, setCurrentFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (open && projectId) {
      fetchDocuments();
    }
  }, [open, projectId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch folders and documents
      const [foldersRes, documentsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/folders`),
        fetch(`/api/projects/${projectId}/documents`)
      ]);
      
      if (!foldersRes.ok || !documentsRes.ok) {
        throw new Error("خطا در دریافت اطلاعات");
      }
      
      const [foldersData, documentsData] = await Promise.all([
        foldersRes.json(),
        documentsRes.json()
      ]);
      
      setFolders(foldersData);
      setDocuments(documentsData);
      
      console.log('Fetched folders:', foldersData);
      console.log('Fetched documents:', documentsData);
      
      // Set initial view (root level)
      setCurrentFolderId(null);
      setBreadcrumbs([]);
      updateCurrentView(null, foldersData, documentsData);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentView = (folderId: string | null, allFolders: Folder[], allDocuments: Document[]) => {
    // Filter folders for current level
    const foldersInCurrentLevel = allFolders.filter(folder => {
      if (folderId === null) {
        // Root level - show folders with no parent or parentId is null
        return !folder.parentId;
      } else {
        return folder.parentId === folderId;
      }
    });
    setCurrentFolders(foldersInCurrentLevel);
    
    // Filter documents for current level
    const documentsInCurrentLevel = allDocuments.filter(doc => {
      if (folderId === null) {
        // Root level - show documents with no folder or folderId is null
        return !doc.folderId;
      } else {
        return doc.folderId === folderId;
      }
    });
    setCurrentDocuments(documentsInCurrentLevel);
  };

  const handleFolderClick = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    updateCurrentView(folderId, folders, documents);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    
    if (index === -1) {
      // Root level
      setCurrentFolderId(null);
      updateCurrentView(null, folders, documents);
    } else {
      const targetFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
      setCurrentFolderId(targetFolder.id);
      updateCurrentView(targetFolder.id, folders, documents);
    }
  };

  const handleLinkDocument = async (documentId: string) => {
    try {
      setLinking(documentId);
      
      // For receipt document selection, we don't need to link to installment
      // Just select the document and close the dialog
      onDocumentSelected(documentId);
      onClose();
    } catch (err) {
      console.error("Error selecting document:", err);
      setError(err instanceof Error ? err.message : "خطا در انتخاب سند");
    } finally {
      setLinking(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image color="primary" />;
    } else if (mimeType === "application/pdf") {
      return <PictureAsPdf color="error" />;
    } else {
      return <Description color="action" />;
    }
  };

  const filteredDocuments = searchTerm ? 
    currentDocuments.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    }) : currentDocuments;

  const filteredFolders = searchTerm ? 
    currentFolders.filter(folder => {
      const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (folder.description && folder.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    }) : currentFolders;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        fontFamily: 'Vazirmatn, Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFile color="primary" />
          انتخاب سند فیش
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          placeholder="جستجو در اسناد و پوشه‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        />

        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />} 
          sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          <MuiLink
            component="button"
            variant="body2"
            onClick={() => handleBreadcrumbClick(-1)}
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Home fontSize="small" />
            ریشه
          </MuiLink>
          {breadcrumbs.map((crumb, index) => (
            <MuiLink
              key={crumb.id}
              component="button"
              variant="body2"
              onClick={() => handleBreadcrumbClick(index)}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {crumb.name}
            </MuiLink>
          ))}
        </Breadcrumbs>

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 400, overflow: 'auto' }}>
            {/* Folders */}
            {filteredFolders.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif', 
                    mb: 1,
                    fontWeight: 'bold'
                  }}
                >
                  پوشه‌ها:
                </Typography>
                <List dense>
                  {filteredFolders.map((folder) => (
                    <ListItem key={folder.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleFolderClick(folder.id, folder.name)}
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      >
                        <ListItemIcon>
                          <FolderOpen color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={folder.name}
                          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Documents */}
            {filteredDocuments.length > 0 && (
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif', 
                    mb: 1,
                    fontWeight: 'bold'
                  }}
                >
                  اسناد:
                </Typography>
                <List dense>
                  {filteredDocuments.map((document) => (
                    <ListItem key={document.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleLinkDocument(document.id)}
                        disabled={linking === document.id}
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      >
                        <ListItemIcon>
                          {linking === document.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            getFileIcon(document.mimeType)
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={document.name}
                          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                        />
                        {linking !== document.id && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Link />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLinkDocument(document.id);
                            }}
                            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                          >
                            انتخاب
                          </Button>
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {filteredFolders.length === 0 && filteredDocuments.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  هیچ پوشه یا سندی یافت نشد
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          انصراف
        </Button>
      </DialogActions>
    </Dialog>
  );
}
