"use client";
import { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  Divider
} from "@mui/material";
import { CreateNewFolder, Add } from "@mui/icons-material";
import FolderCard from "./FolderCard";
import DocumentUpload from "./DocumentUpload";

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

interface ImprovedFolderTreeProps {
  folders: Folder[];
  projectId: string;
  onFolderCreate: (folder: Omit<Folder, 'id' | 'createdAt'>) => void;
  onFolderSelect: (folder: Folder) => void;
  onFolderDelete?: (folderId: string) => void;
  onFolderEnter?: (folder: Folder) => void;
  selectedFolderId?: string;
  onDocumentUpload?: (document: any) => void;
}

export default function ImprovedFolderTree({
  folders,
  projectId,
  onFolderCreate,
  onFolderSelect,
  onFolderDelete,
  onFolderEnter,
  selectedFolderId,
  onDocumentUpload
}: ImprovedFolderTreeProps) {
  const [openNewFolder, setOpenNewFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string>("");
  const [newFolder, setNewFolder] = useState({
    name: "",
    description: "",
    parentId: ""
  });
  const [error, setError] = useState("");

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      setError("نام پوشه الزامی است");
      return;
    }

    // Find parent folder to calculate correct path and depth
    let parentPath = "";
    let depth = 1;
    
    if (newFolder.parentId) {
      const parentFolder = folders.find(f => f.id === newFolder.parentId);
      if (parentFolder) {
        parentPath = parentFolder.path;
        depth = parentFolder.depth + 1;
      }
    }

    const folderData = {
      name: newFolder.name.trim(),
      description: newFolder.description.trim(),
      projectId,
      parentId: newFolder.parentId || undefined,
      path: parentPath ? `${parentPath}/${newFolder.name.trim()}` : `/${newFolder.name.trim()}`,
      depth: depth,
      documents: 0,
      createdBy: "cmezdaayb0000udykn1pjrrq1" // Correct admin user ID
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

  const handleUploadDocument = (folderId: string) => {
    setUploadFolderId(folderId);
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = (document: any) => {
    if (onDocumentUpload) {
      onDocumentUpload(document);
    }
  };

  const handleCreateSubfolder = (parentId: string) => {
    setNewFolder(prev => ({ ...prev, parentId }));
    setOpenNewFolder(true);
  };

  // Build folder tree structure
  const buildFolderTree = (folders: Folder[]): Folder[] => {
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];

    // Create a map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build the tree structure
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children!.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
        <Box sx={{ pl: level * 2 }}>
          <FolderCard
            folder={folder}
            isSelected={isSelected}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            onSelect={onFolderSelect}
            onEnter={(folder) => {
              if (onFolderEnter) onFolderEnter(folder);
            }}
            onDelete={(folderId) => {
              if (onFolderDelete) onFolderDelete(folderId);
            }}
            onToggleExpand={toggleFolderExpansion}
            onUploadDocument={handleUploadDocument}
            onCreateSubfolder={handleCreateSubfolder}
          />
        </Box>
        
        {hasChildren && isExpanded && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {folder.children?.map(child => renderFolder(child, level + 1))}
            </Grid>
          </Box>
        )}
      </Grid>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h5" fontWeight="bold">
          ساختار پوشه‌ها
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<CreateNewFolder />}
          onClick={() => setOpenNewFolder(true)}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1
          }}
        >
          پوشه جدید
        </Button>
      </Box>

      {/* Folders Grid */}
      {folders.length === 0 ? (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            bgcolor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <CreateNewFolder sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            هیچ پوشه‌ای وجود ندارد
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            اولین پوشه پروژه خود را ایجاد کنید
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenNewFolder(true)}
          >
            ایجاد پوشه
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {buildFolderTree(folders).map(folder => renderFolder(folder))}
        </Grid>
      )}

      {/* New Folder Dialog */}
      <Dialog open={openNewFolder} onClose={() => setOpenNewFolder(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreateNewFolder color="primary" />
          ایجاد پوشه جدید
        </DialogTitle>
        
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
        folderId={uploadFolderId}
        onUploadSuccess={handleUploadSuccess}
      />
    </Box>
  );
}
