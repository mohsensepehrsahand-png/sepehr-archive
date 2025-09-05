"use client";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Alert
} from "@mui/material";
import {
  Folder,
  CreateNewFolder,
  Delete,
  Description,
  ExpandMore,
  ExpandLess,
  OpenInNew
} from "@mui/icons-material";
import { useState } from "react";

interface Folder {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  parentId?: string;
  path: string;
  depth: number;
  documents: number;
  children?: Folder[];
  createdAt: string;
}

interface FolderTreeProps {
  folders: Folder[];
  projectId: string;
  onFolderCreate: (folder: Omit<Folder, 'id' | 'createdAt'>) => void;
  onFolderSelect: (folder: Folder) => void;
  onFolderDelete?: (folderId: string) => void;
  onFolderEnter?: (folder: Folder) => void;
  selectedFolderId?: string;
  currentFolderId?: string;
  onDocumentUpload?: (document: any) => void;
  onDocumentSelect?: (document: any) => void;
  onDocumentDelete?: (documentId: string) => void;
}

export default function FolderTree({ 
  folders, 
  projectId, 
  onFolderCreate, 
  onFolderSelect,
  onFolderDelete,
  onFolderEnter,
  selectedFolderId,
  currentFolderId,
  onDocumentUpload,
  onDocumentSelect,
  onDocumentDelete
}: FolderTreeProps) {
  const [openNewFolder, setOpenNewFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolder, setNewFolder] = useState({
    name: "",
    description: "",
    parentId: ""
  });
  const [error, setError] = useState("");
  const [showDocuments, setShowDocuments] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      setError("نام پوشه الزامی است");
      return;
    }

    const folderData = {
      name: newFolder.name.trim(),
      description: newFolder.description.trim(),
      projectId,
      parentId: newFolder.parentId || undefined,
      path: newFolder.parentId ? "" : `/${newFolder.name.trim()}`,
      depth: newFolder.parentId ? 0 : 1,
      documents: 0,
      createdBy: "cmezdaayb0000udykn1pjrrq1" // شناسه کاربر admin
    };

    onFolderCreate(folderData);
    setNewFolder({ name: "", description: "", parentId: "" });
    setOpenNewFolder(false);
    setError("");
  };

  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <Grid item xs={12} sm={6} md={4} key={folder.id}>
        <Card 
          sx={{ 
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: isSelected ? '2px solid' : '1px solid',
            borderColor: isSelected ? 'primary.main' : 'divider',
            bgcolor: isSelected ? 'primary.light' : 'background.paper',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3,
              borderColor: 'primary.main'
            }
          }}
          onClick={() => onFolderSelect(folder)}
        >
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Folder color={isSelected ? "inherit" : "primary"} />
              <Typography variant="h6" fontWeight="bold" noWrap>
                {folder.name}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {folder.description || 'بدون توضیحات'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${folder.documents} سند`}
                size="small" 
                variant="outlined"
                color="primary"
              />
              <Chip 
                label={`عمق: ${folder.depth}`}
                size="small" 
                variant="outlined"
                color="secondary"
              />
            </Box>
          </CardContent>
          
          <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {folder.path}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="ورود به پوشه">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentFolder(folder);
                    setShowDocuments(true);
                    if (onFolderEnter) {
                      onFolderEnter(folder);
                    }
                  }}
                >
                  <OpenInNew />
                </IconButton>
              </Tooltip>
              
              {hasChildren && (
                <Tooltip title={isExpanded ? "بستن" : "باز کردن"}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolderExpansion(folder.id);
                    }}
                  >
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="حذف پوشه">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onFolderDelete && confirm(`آیا از حذف پوشه "${folder.name}" اطمینان دارید؟\n\n⚠️ توجه: تمام اسناد داخل این پوشه نیز حذف خواهند شد!`)) {
                      onFolderDelete(folder.id);
                    }
                  }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </CardActions>
        </Card>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <Box sx={{ mt: 1, ml: 2 }}>
            <Grid container spacing={2}>
              {folder.children!.map(child => renderFolder(child, level + 1))}
            </Grid>
          </Box>
        )}
      </Grid>
    );
  };

  const getParentFolders = (): Folder[] => {
    return folders.filter(folder => !folder.parentId);
  };

  const getNestedFolders = (): Folder[] => {
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];

    // First pass: create map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Second pass: build tree structure
    folders.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children!.push(folderMap.get(folder.id)!);
        }
      } else {
        rootFolders.push(folderMap.get(folder.id)!);
      }
    });

    return rootFolders;
  };

  const nestedFolders = getNestedFolders();
  const parentFolders = getParentFolders();

  if (showDocuments && currentFolder) {
    return (
      <Box>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ExpandLess />}
              onClick={() => {
                setShowDocuments(false);
                setCurrentFolder(null);
              }}
            >
              بازگشت
            </Button>
            <Typography variant="h5" fontWeight="bold">
              پوشه: {currentFolder.name}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CreateNewFolder />}
            onClick={() => setOpenNewFolder(true)}
            size="small"
          >
            پوشه جدید
          </Button>
        </Box>

        {/* Documents Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            اسناد این پوشه
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              هنوز سندی در این پوشه آپلود نشده است
            </Typography>
            <Button
              variant="contained"
              startIcon={<CreateNewFolder />}
              onClick={() => {/* TODO: Open document upload dialog */}}
              sx={{ mt: 2 }}
            >
              آپلود سند جدید
            </Button>
          </Box>
        </Box>

        {/* New Folder Dialog */}
        <Dialog open={openNewFolder} onClose={() => setOpenNewFolder(false)} maxWidth="sm" fullWidth>
          <DialogTitle>ایجاد پوشه جدید</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="نام پوشه"
              value={newFolder.name}
              onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
              margin="normal"
              required
              autoFocus
              error={!!error}
            />
            
            <TextField
              fullWidth
              label="توضیحات (اختیاری)"
              value={newFolder.description}
              onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>پوشه والد</InputLabel>
              <Select
                value={newFolder.parentId}
                label="پوشه والد"
                onChange={(e) => setNewFolder({ ...newFolder, parentId: e.target.value })}
              >
                <MenuItem value="">بدون والد (پوشه اصلی)</MenuItem>
                {folders.map((folder) => (
                  <MenuItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              ایجاد پوشه
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          ساختار پوشه‌ها
        </Typography>
        <Button
          variant="contained"
          startIcon={<CreateNewFolder />}
          onClick={() => setOpenNewFolder(true)}
          size="small"
        >
          پوشه جدید
        </Button>
      </Box>

      {/* Folder Tree */}
      {nestedFolders.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 6,
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}>
          <Folder sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            هنوز پوشه‌ای ایجاد نشده است
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            برای شروع، پوشه جدیدی ایجاد کنید
          </Typography>
          <Button
            variant="contained"
            startIcon={<CreateNewFolder />}
            onClick={() => setOpenNewFolder(true)}
          >
            ایجاد اولین پوشه
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {nestedFolders.map(folder => renderFolder(folder))}
        </Grid>
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
          
          <TextField
            fullWidth
            label="نام پوشه"
            value={newFolder.name}
            onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
            margin="normal"
            required
            autoFocus
            error={!!error}
          />
          
          <TextField
            fullWidth
            label="توضیحات (اختیاری)"
            value={newFolder.description}
            onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>پوشه والد</InputLabel>
            <Select
              value={newFolder.parentId}
              label="پوشه والد"
              onChange={(e) => setNewFolder({ ...newFolder, parentId: e.target.value })}
            >
              <MenuItem value="">بدون والد (پوشه اصلی)</MenuItem>
              {parentFolders.map((folder) => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folder.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
            ایجاد پوشه
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
