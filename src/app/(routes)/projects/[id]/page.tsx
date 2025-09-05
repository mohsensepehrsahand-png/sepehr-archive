"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Tabs,
  Tab
} from "@mui/material";

import {
  ArrowBack,
  Edit,
  Folder,
  Description,
  Security,
  History
} from "@mui/icons-material";
import Link from "next/link";
import FolderManager from "@/components/projects/FolderManager";
import ProjectPermissions from "@/components/projects/ProjectPermissions";
import FolderPermissions from "@/components/projects/FolderPermissions";
import { useAuth } from "@/contexts/AuthContext";
import MobileBreadcrumb from "@/components/mobile/MobileBreadcrumb";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  documents: number;
  folders: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  colorPrimary: string;
}

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

interface Document {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  folderId: string;
  uploadedBy: string;
  createdAt: string;
  filePath: string;
  fileExt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { isAdmin } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projectPermissions, setProjectPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [activeTab, setActiveTab] = useState(0);


  // دریافت اطلاعات پروژه
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // دریافت اطلاعات پروژه
        const projectRes = await fetch(`/api/projects/${projectId}`);
        if (!projectRes.ok) throw new Error('خطا در دریافت اطلاعات پروژه');
        const projectData = await projectRes.json();
        setProject(projectData);

        // دریافت پوشه‌ها
        const foldersRes = await fetch(`/api/folders?projectId=${projectId}`);
        if (!foldersRes.ok) throw new Error('خطا در دریافت پوشه‌ها');
        const foldersData = await foldersRes.json();
        setFolders(foldersData);

        // دریافت اسناد
        const documentsRes = await fetch(`/api/documents?projectId=${projectId}`);
        if (!documentsRes.ok) throw new Error('خطا در دریافت اسناد');
        const documentsData = await documentsRes.json();
        setDocuments(documentsData);

        // دریافت دسترسی‌های پروژه
        if (isAdmin) {
          const permissionsRes = await fetch(`/api/projects/${projectId}/permissions`);
          if (permissionsRes.ok) {
            const permissionsData = await permissionsRes.json();
            setProjectPermissions(permissionsData);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, isAdmin]);

  const handleFolderCreate = async (folderData: Omit<Folder, 'id' | 'createdAt'>) => {
    if (creatingFolder) return;
    
    try {
      setCreatingFolder(true);
      
      console.log('Received folder data:', folderData);
      console.log('Name:', folderData.name);
      console.log('CreatedBy:', folderData.createdBy);
      
      const currentUserId = folderData.createdBy;
      
      if (!currentUserId) {
        throw new Error('شناسه کاربر ایجادکننده پوشه یافت نشد');
      }
      
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...folderData,
          createdBy: currentUserId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`خطا در ایجاد پوشه: ${response.status} - ${errorData.error || 'خطای نامشخص'}`);
      }

      const newFolder = await response.json();
      console.log('Created folder response:', newFolder);
      
      setFolders(prev => [...prev, newFolder]);
      
      if (project) {
        setProject(prev => prev ? { ...prev, folders: prev.folders + 1 } : null);
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      const errorMessage = err instanceof Error ? err.message : 'خطا در ایجاد پوشه';
      alert(errorMessage);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDocumentUpload = async (document: any) => {
    try {
      setDocuments(prev => [document, ...prev]);
      
      if (project) {
        setProject(prev => prev ? { ...prev, documents: prev.documents + 1 } : null);
      }

      setFolders(prev => prev.map(folder => 
        folder.id === document.folderId 
          ? { ...folder, documents: folder.documents + 1 }
          : folder
      ));
    } catch (err) {
      console.error('Error handling document upload:', err);
      throw err;
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        if (project) {
          setProject(prev => prev ? { ...prev, documents: prev.documents - 1 } : null);
        }

        const deletedDoc = documents.find(doc => doc.id === documentId);
        if (deletedDoc) {
          setFolders(prev => prev.map(folder => 
            folder.id === deletedDoc.folderId 
              ? { ...folder, documents: Math.max(0, folder.documents - 1) }
              : folder
          ));
        }
      } else {
        console.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setFolders(prev => prev.filter(folder => folder.id !== folderId));
        
        if (project) {
          setProject(prev => prev ? { ...prev, folders: Math.max(0, prev.folders - 1) } : null);
        }
      } else {
        console.error('Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography>در حال بارگذاری...</Typography>
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          {error || 'پروژه یافت نشد'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>


      {/* Project Header */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 3, 
        background: `linear-gradient(135deg, ${project.colorPrimary}15 0%, ${project.colorPrimary}05 100%)`,
        border: `1px solid ${project.colorPrimary}20`,
        borderRadius: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' }, 
          justifyContent: 'space-between', 
          gap: 2 
        }}>
          {/* نام پروژه */}
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold"
            sx={{ 
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontFamily: 'Vazirmatn, Arial, sans-serif'
            }}
          >
            {project.name}
          </Typography>
          
          {/* آمار سند و پوشه */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 2, md: 3 },
            flexWrap: 'wrap'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description color="primary" />
              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {project.documents}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                سند
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Folder color="secondary" />
              <Typography variant="h6" color="secondary" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {project.folders}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                پوشه
              </Typography>
            </Box>
          </Box>
          
          {/* دکمه‌ها */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button
              component={Link}
              href="/projects"
              variant="outlined"
              startIcon={<ArrowBack />}
              size="small"
              sx={{ 
                borderRadius: 2, 
                px: 2,
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              بازگشت
            </Button>
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                size="small"
                sx={{ 
                  borderRadius: 2, 
                  px: 2,
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  width: { xs: '100%', sm: 'auto' }
                }}
                onClick={() => alert('قابلیت ویرایش پروژه در حال توسعه است')}
              >
                ویرایش پروژه
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 3, boxShadow: 2, bgcolor: 'background.paper' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              fontSize: { xs: '0.875rem', md: '1rem' }
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<Folder />} 
            label="پوشه‌ها و اسناد" 
            iconPosition="start"
          />
          {isAdmin && (
            <Tab 
              icon={<Security />} 
              label="مدیریت دسترسی‌ها" 
              iconPosition="start"
            />
          )}
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {activeTab === 0 && (
            <FolderManager
              projectId={projectId}
              folders={folders}
              documents={documents}
              onFolderCreate={handleFolderCreate}
              onDocumentUpload={handleDocumentUpload}
              onDocumentDelete={handleDocumentDelete}
              onFolderDelete={handleFolderDelete}
              creatingFolder={creatingFolder}
              projectPermissions={projectPermissions}
            />
          )}

          {activeTab === 1 && isAdmin && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <ProjectPermissions projectId={projectId} />
              <FolderPermissions 
                projectId={projectId} 
                folders={folders} 
                projectPermissions={projectPermissions}
                onPermissionsChanged={() => {
                  // Refresh folder permissions in FolderManager
                  console.log('Permissions changed, refreshing...');
                  // Call refresh function on FolderManager
                  if (typeof window !== 'undefined' && (window as any).refreshFolderPermissions) {
                    (window as any).refreshFolderPermissions();
                  }
                  // Force re-render of FolderManager
                  setFolders([...folders]);
                }}
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

