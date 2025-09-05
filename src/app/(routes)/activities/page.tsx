"use client";
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Avatar, 
  Chip, 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton, 
  Divider,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { 
  Search, 
  FilterList, 
  Visibility, 
  Download, 
  Create, 
  Delete, 
  Folder,
  Refresh,
  Clear,
  History,
  ArrowBack
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatPersianDate, formatRelativeTime } from "@/utils/dateUtils";

interface Activity {
  id: string;
  type: string;
  action: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName?: string;
  documentId?: string;
  documentName?: string;
  folderName?: string;
  details: string;
  metadata?: string;
  timestamp: string;
}

interface Project {
  id: string;
  name: string;
}

export default function ActivitiesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin } = useAuth();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const fetchActivities = async (reset = false) => {
    try {
      setLoading(true);
      setError("");
      
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: '50',
        offset: currentOffset.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter) params.append('action', actionFilter);
      if (projectFilter) params.append('projectId', projectFilter);
      
      const response = await fetch(`/api/activity-log?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`خطا در دریافت فعالیت‌ها: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (reset) {
        setActivities(data.activities);
        setOffset(50);
      } else {
        setActivities(prev => [...prev, ...data.activities]);
        setOffset(prev => prev + 50);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'خطا در دریافت فعالیت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchActivities(true);
    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchTerm || actionFilter || projectFilter) {
      const timeoutId = setTimeout(() => {
        fetchActivities(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, actionFilter, projectFilter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view': return <Visibility />;
      case 'download': return <Download />;
      case 'create': return <Create />;
      case 'delete': return <Delete />;
      case 'folder': return <Folder />;
      default: return <Visibility />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'view': return 'primary';
      case 'download': return 'secondary';
      case 'create': return 'success';
      case 'delete': return 'error';
      case 'folder': return 'info';
      default: return 'default';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'view': return 'مشاهده';
      case 'download': return 'دانلود';
      case 'create': return 'ایجاد';
      case 'delete': return 'حذف';
      case 'folder': return 'پوشه';
      default: return action;
    }
  };

  const formatTime = (timestamp: string) => {
    return formatRelativeTime(timestamp);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchActivities(false);
    }
  };

  const handleRefresh = () => {
    fetchActivities(true);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setActionFilter("");
    setProjectFilter("");
  };

  const handleDeleteAllActivities = async () => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید همه فعالیت‌ها را پاک کنید؟ این عمل قابل بازگشت نیست.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch('/api/activity-log', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('خطا در پاک کردن فعالیت‌ها');
      }

      const result = await response.json();
      setActivities([]);
      setOffset(0);
      setHasMore(false);
      alert(`همه فعالیت‌ها با موفقیت پاک شدند. تعداد: ${result.deletedCount}`);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'خطا در پاک کردن فعالیت‌ها');
    } finally {
      setDeleting(false);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'پروژه نامشخص';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 3, 
        borderRadius: 3,
        boxShadow: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component={Link}
              href="/dashboard"
              variant="outlined"
              startIcon={<ArrowBack />}
              size="small"
              sx={{ 
                borderRadius: 2, 
                px: 2,
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}
            >
              بازگشت
            </Button>
            <Typography 
              variant="h4" 
              component="h1" 
              fontWeight="bold"
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}
            >
              فعالیت‌های اخیر
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isAdmin && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteAllActivities}
                disabled={deleting || activities.length === 0}
                sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  borderRadius: 2
                }}
              >
                {deleting ? 'در حال پاک کردن...' : 'پاک کردن همه'}
              </Button>
            )}
            <IconButton 
              onClick={handleRefresh}
              disabled={loading}
              sx={{ 
                bgcolor: 'primary.light',
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: 'white' }
              }}
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 3, 
        borderRadius: 3,
        boxShadow: 2
      }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="جستجو در فعالیت‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontFamily: 'Vazirmatn, Arial, sans-serif' 
                } 
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>فیلتر عملیات</InputLabel>
              <Select
                value={actionFilter}
                label="فیلتر عملیات"
                onChange={(e) => setActionFilter(e.target.value)}
                sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
              >
                <MenuItem value="" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>همه</MenuItem>
                <MenuItem value="view" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>مشاهده</MenuItem>
                <MenuItem value="download" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>دانلود</MenuItem>
                <MenuItem value="create" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>ایجاد</MenuItem>
                <MenuItem value="delete" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>حذف</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>فیلتر پروژه</InputLabel>
              <Select
                value={projectFilter}
                label="فیلتر پروژه"
                onChange={(e) => setProjectFilter(e.target.value)}
                sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
              >
                <MenuItem value="" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>همه پروژه‌ها</MenuItem>
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              disabled={!searchTerm && !actionFilter && !projectFilter}
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                height: '40px'
              }}
            >
              پاک کردن
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      <Paper sx={{ 
        borderRadius: 3,
        boxShadow: 2,
        overflow: 'hidden'
      }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading && activities.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              هیچ فعالیتی یافت نشد
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {activities.map((activity, index) => (
              <ListItem 
                key={activity.id}
                sx={{ 
                  borderBottom: index < activities.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon>
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40,
                      bgcolor: `${getActionColor(activity.action)}.light`,
                      color: `${getActionColor(activity.action)}.main`
                    }}
                  >
                    {getActionIcon(activity.action)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Typography 
                        variant="body1" 
                        fontWeight="bold"
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      >
                        {activity.userName}
                      </Typography>
                      <Chip 
                        label={getActionText(activity.action)}
                        size="small"
                        color={getActionColor(activity.action) as any}
                        variant="outlined"
                      />
                      <Chip 
                        label={getProjectName(activity.projectId)}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 0.5 }}
                      >
                        {(() => {
                          const parts = [];
                          
                          // Add folder name if available
                          if (activity.folderName) {
                            parts.push(`پوشه: ${activity.folderName}`);
                          }
                          
                          // Add document name if available
                          if (activity.documentName) {
                            parts.push(`سند: ${activity.documentName}`);
                          }
                          
                          // Add action details
                          if (activity.details) {
                            parts.push(activity.details);
                          }
                          
                          // Add metadata details if available
                          if (activity.metadata) {
                            try {
                              const metadata = JSON.parse(activity.metadata);
                              if (metadata.folderName && metadata.folderName !== activity.folderName) {
                                parts.push(`در پوشه: ${metadata.folderName}`);
                              }
                              if (metadata.action && metadata.action !== activity.action) {
                                parts.push(`عملیات: ${metadata.action}`);
                              }
                            } catch {
                              // Ignore JSON parse errors
                            }
                          }
                          
                          return parts.length > 0 ? parts.join(' - ') : getActionText(activity.action);
                        })()}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                        >
                          {formatTime(activity.timestamp)}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.disabled"
                          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                        >
                          •
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                        >
                          {formatPersianDate(activity.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
            
            {hasMore && (
              <ListItem>
                <Box sx={{ width: '100%', textAlign: 'center', py: 2 }}>
                  <Button 
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outlined"
                    sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'بارگذاری بیشتر'}
                  </Button>
                </Box>
              </ListItem>
            )}
          </List>
        )}
      </Paper>
    </Container>
  );
}

