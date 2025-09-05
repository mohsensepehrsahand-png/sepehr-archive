"use client";
import { useState, useEffect } from "react";
import { Box, Typography, useTheme, alpha, Grid, Paper, Chip, List, ListItem, ListItemText, ListItemIcon, Avatar, Divider, IconButton, Tooltip, TextField, InputAdornment, Card, CardContent } from "@mui/material";
import { LinearProgress } from "@mui/material";
import { Folder, CreateNewFolder, Upload, Description, Image, PictureAsPdf, TableChart, Refresh, Edit, Delete, Info, Search, Clear, History } from "@mui/icons-material";

// Import project context
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CompactProjectCard from "@/components/dashboard/CompactProjectCard";
import { formatPersianDate, formatRelativeTime } from "@/utils/dateUtils";


export default function DashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { projects, addProject } = useProjects();
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const theme = useTheme();
  
  // Filter out archived projects for dashboard
  const activeProjects = projects.filter(project => project.status !== 'آرشیو' && project.status !== 'ARCHIVED');

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && isAdmin === false) {
      router.push('/projects');
    }
  }, [isAdmin, authLoading, router]);

  // Function to fetch dashboard data
  const fetchDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      
      // Add cache busting parameter - only on client side
      const timestamp = typeof window !== 'undefined' ? Date.now() : 0;
      
      // Fetch recent activities
      const activitiesResponse = await fetch(`/api/dashboard/recent-activities?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (activitiesResponse.ok) {
        const activities = await activitiesResponse.json();
        setRecentActivities(activities);
      }

      // Fetch recent documents
      const documentsResponse = await fetch(`/api/dashboard/recent-documents?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (documentsResponse.ok) {
        const documents = await documentsResponse.json();
        setRecentDocuments(documents);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  };

  // Function to perform live search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search in projects
      const projectsResults = projects.filter(project => 
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.description?.toLowerCase().includes(query.toLowerCase())
      ).map(project => ({
        type: 'project',
        id: project.id,
        title: project.name,
        description: project.description,
        projectName: null,
        folderName: null,
        icon: <Folder />,
        color: 'primary'
      }));

      // Search in folders (we need to fetch folders from all projects)
      const foldersResults = [];
      for (const project of projects) {
        try {
          const response = await fetch(`/api/folders?projectId=${project.id}`);
          if (response.ok) {
            const folders = await response.json();
            const matchingFolders = folders.filter(folder =>
              folder.name.toLowerCase().includes(query.toLowerCase()) ||
              folder.description?.toLowerCase().includes(query.toLowerCase())
            ).map(folder => ({
              type: 'folder',
              id: folder.id,
              title: folder.name,
              description: folder.description,
              projectName: project.name,
              folderName: null,
              icon: <CreateNewFolder />,
              color: 'secondary'
            }));
            foldersResults.push(...matchingFolders);
          }
        } catch (error) {
          console.error('Error fetching folders for project:', project.id, error);
        }
      }

      // Search in documents with project and folder info
      const documentsResults = recentDocuments.filter(document =>
        document.name.toLowerCase().includes(query.toLowerCase()) ||
        document.description?.toLowerCase().includes(query.toLowerCase())
      ).map(document => ({
        type: 'document',
        id: document.id,
        title: document.name,
        description: document.description,
        projectName: document.projectName || 'نامشخص',
        folderName: document.folderName || 'پوشه اصلی',
        icon: getDocumentIcon(document.mimeType),
        color: 'info'
      }));

      setSearchResults([...projectsResults, ...foldersResults, ...documentsResults]);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, projects, recentDocuments]);

  // Fetch recent activities and documents
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }

    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [isAdmin]);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAdmin]);


  // Don't render the page if user is not admin (but wait for auth to load)
  if (!authLoading && !isAdmin) {
    return null;
  }

  // Function to add new project
  const handleAddProject = async (projectName: string, projectDescription: string, projectStatus: string) => {
    try {
      await addProject({
        name: projectName,
        description: projectDescription,
        status: projectStatus
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(`خطا در ایجاد پروژه: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
    }
  };

  // Safe calculation functions
  const getSafeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || isNaN(value)) {
      return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  const getSafeString = (value: any, defaultValue: string = ''): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return defaultValue;
    }
    return String(value);
  };

  // Helper function to format date - now using Persian format
  const formatDate = (dateString: string) => {
    return formatPersianDate(dateString);
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    if (type.includes('delete')) return <Delete />;
    if (type.includes('update') || type.includes('edit')) return <Edit />;
    if (type.includes('create')) {
      if (type.includes('project')) return <Folder />;
      if (type.includes('folder')) return <CreateNewFolder />;
      if (type.includes('document')) return <Upload />;
    }
    return <Info />;
  };

  // Helper function to get document icon
  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image />;
    if (mimeType === 'application/pdf') return <PictureAsPdf />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <Description />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <TableChart />;
    return <Description />;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 4 }}>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
      </Box>
    );
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Box sx={{ py: 4, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LinearProgress sx={{ width: '200px' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>

      </Box>

      {/* Main Layout with Left Sidebar and Center Content */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 320px' },
        gap: 3, 
        mt: 4, 
        minHeight: '600px',
        position: 'relative'
      }}>
        {/* Center Content - Projects */}
        <Box sx={{ 
          width: '100%',
          order: 1,
          gridColumn: { xs: '1', lg: '1' }
        }}>
          {/* Search Section */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Search sx={{ color: 'primary.main', fontSize: 24 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                جستجوی هوشمند
              </Typography>
            </Box>
            
            <TextField
              fullWidth
              placeholder="جستجو در پروژه‌ها، پوشه‌ها و اسناد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery("")}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2
                    }
                  }
                }
              }}
            />

            {/* Search Results */}
            {searchQuery && (
              <Box sx={{ mt: 2 }}>
                {isSearching ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                    <LinearProgress sx={{ flex: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      در حال جستجو...
                    </Typography>
                  </Box>
                ) : searchResults.length > 0 ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {searchResults.length} نتیجه یافت شد
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {searchResults.slice(0, 5).map((result, index) => (
                        <Card 
                          key={`${result.type}-${result.id}`}
                          sx={{ 
                            mb: 1, 
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                          onClick={async () => {
                            if (result.type === 'project') {
                              router.push(`/projects/${result.id}`);
                            } else if (result.type === 'folder') {
                              // Find the project that contains this folder
                              const project = projects.find(p => p.name === result.projectName);
                              if (project) {
                                router.push(`/projects/${project.id}?folder=${result.id}`);
                              }
                            } else if (result.type === 'document') {
                              // Download or view the document
                              try {
                                const response = await fetch(`/api/documents/${result.id}`);
                                if (response.ok) {
                                  const documentData = await response.json();
                                  // Open document in new tab or download
                                  if (documentData.filePath) {
                                    window.open(`/api/documents/${result.id}/download`, '_blank');
                                  }
                                }
                              } catch (error) {
                                console.error('Error opening document:', error);
                              }
                            }
                          }}
                        >
                          <CardContent sx={{ py: 1.5, px: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: `${result.color}.main`,
                                fontSize: '0.8rem'
                              }}>
                                {result.icon}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                  {result.title}
                                </Typography>
                                {result.description && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', display: 'block', mb: 0.5 }}>
                                    {result.description}
                                  </Typography>
                                )}
                                {/* Show project and folder info for folders and documents */}
                                {(result.type === 'folder' || result.type === 'document') && result.projectName && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Typography variant="caption" color="primary.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 600 }}>
                                      📁 {result.projectName}
                                    </Typography>
                                    {result.type === 'document' && result.folderName && (
                                      <>
                                        <Typography variant="caption" color="text.secondary">•</Typography>
                                        <Typography variant="caption" color="secondary.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                          📂 {result.folderName}
                                        </Typography>
                                      </>
                                    )}
                                  </Box>
                                )}
                              </Box>
                              <Chip 
                                label={result.type === 'project' ? 'پروژه' : result.type === 'folder' ? 'پوشه' : 'سند'}
                                size="small"
                                color={result.color}
                                variant="outlined"
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    هیچ نتیجه‌ای یافت نشد
                  </Typography>
                )}
              </Box>
            )}
          </Paper>

          {/* Projects Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif'
                }}
              >
                پروژه‌های اخیر
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="بروزرسانی پروژه‌ها">
                  <IconButton size="small" onClick={() => window.location.reload()} sx={{ color: 'primary.main' }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                {activeProjects.length > 0 && (
                  <Box 
                    component="a"
                    href="/projects"
                    sx={{ 
                      textDecoration: 'none',
                      color: 'primary.main',
                      fontSize: '0.875rem',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    مشاهده همه پروژه‌ها
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              gap: 2,
              p: 4,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2
            }}>
              {activeProjects.length === 0 ? (
                <>
                  <Typography variant="h6" color="text.secondary" textAlign="center">
                    هنوز پروژه‌ای ایجاد نشده است
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    برای شروع، پروژه جدیدی ایجاد کنید
                  </Typography>
                </>
              ) : (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 3,
                  width: '100%'
                }}>
                  {activeProjects.slice(0, 6).map((project) => (
                    <CompactProjectCard key={project.id} project={project} />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Right Sidebar - Statistics */}
        <Box sx={{ 
          width: '100%',
          display: 'block',
          order: 2,
          position: 'relative',
          zIndex: 1,
          gridColumn: { xs: '1', lg: '2' }
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Statistics Numbers - Compact */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                آمار کلی
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">{getSafeNumber(activeProjects.length)}</Typography>
                  <Typography variant="caption" color="text.secondary">پروژه‌ها</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary" fontWeight="bold">
                    {getSafeNumber(activeProjects.reduce((total, project) => total + getSafeNumber(project.documents, 0), 0))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">اسناد</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {getSafeNumber(activeProjects.filter(p => getSafeString(p.status) === 'فعال').length)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">فعال</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {activeProjects.length > 0 ? getSafeNumber(Math.round((activeProjects.filter(p => getSafeString(p.status) === 'فعال').length / activeProjects.length) * 100)) : 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">نرخ فعال</Typography>
                </Box>
              </Box>
            </Paper>


            {/* Recent Activities - Compact List */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  فعالیت‌های اخیر
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="مشاهده همه فعالیت‌ها">
                    <IconButton 
                      size="small" 
                      onClick={() => router.push('/activities')}
                      sx={{ 
                        color: 'primary.main',
                        bgcolor: 'primary.light',
                        '&:hover': { bgcolor: 'primary.main', color: 'white' }
                      }}
                    >
                      <History />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="بروزرسانی فعالیت‌ها">
                    <IconButton 
                      size="small" 
                      onClick={() => fetchDashboardData(true)} 
                      disabled={isRefreshing}
                      sx={{ color: 'primary.main' }}
                    >
                      <Refresh sx={{ 
                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {recentActivities.length > 0 ? (
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {recentActivities.slice(0, 10).map((activity, index) => (
                    <Box key={activity.id}>
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: `${activity.color}.main`,
                              fontSize: '0.75rem'
                            }}
                          >
                            {getActivityIcon(activity.type)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.8rem' }}>
                              {activity.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                              {activity.user} • {formatDate(activity.timestamp)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.slice(0, 10).length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  هیچ فعالیتی در هفته گذشته ثبت نشده است
                </Typography>
              )}
            </Paper>

            {/* Recent Documents - Compact List */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  اسناد اخیر
                </Typography>
                <Tooltip title="بروزرسانی اسناد">
                  <IconButton 
                    size="small" 
                    onClick={() => fetchDashboardData(true)} 
                    disabled={isRefreshing}
                    sx={{ color: 'primary.main' }}
                  >
                    <Refresh sx={{ 
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} />
                  </IconButton>
                </Tooltip>
              </Box>
              {recentDocuments.length > 0 ? (
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {recentDocuments.slice(0, 5).map((document, index) => (
                    <Box key={document.id}>
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: document.isImage ? 'success.main' : 
                                      document.isPdf ? 'error.main' : 
                                      document.isDocument ? 'primary.main' : 
                                      document.isSpreadsheet ? 'warning.main' : 'default',
                              fontSize: '0.75rem'
                            }}
                          >
                            {getDocumentIcon(document.mimeType)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.8rem' }}>
                              {document.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                              {document.sizeFormatted} • {formatDate(document.createdAt)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < recentDocuments.slice(0, 5).length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  هیچ سندی آپلود نشده است
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Mobile View - Show statistics below on small screens */}
      <Box sx={{ display: { xs: 'block', lg: 'none' }, mt: 4 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3 
        }}>
          {/* System Status */}
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              وضعیت سیستم
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
              <Chip label="آنلاین" color="success" size="small" />
              <Chip label="امن" color="success" size="small" />
              <Chip label="پایدار" color="success" size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              تمام سرویس‌ها در حال کار عادی هستند
            </Typography>
          </Paper>
          
          {/* Today's Activities */}
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              فعالیت‌های امروز
            </Typography>
            <Typography variant="h4" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
              24
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              عملیات انجام شده در 24 ساعت گذشته
            </Typography>
          </Paper>

          {/* Compact Statistics */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', textAlign: 'center', mb: 2 }}>
              آمار کلی
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary" fontWeight="bold">12</Typography>
                <Typography variant="caption" color="text.secondary">پروژه‌ها</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="secondary" fontWeight="bold">847</Typography>
                <Typography variant="caption" color="text.secondary">اسناد</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="success.main" fontWeight="bold">6</Typography>
                <Typography variant="caption" color="text.secondary">کاربران</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="info.main" fontWeight="bold">24%</Typography>
                <Typography variant="caption" color="text.secondary">فضا</Typography>
              </Box>
            </Box>
          </Paper>

        </Box>
      </Box>
    </Box>
  );
}

