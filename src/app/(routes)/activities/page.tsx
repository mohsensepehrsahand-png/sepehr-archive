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
  useMediaQuery,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Stack
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
  ArrowBack,
  ExpandMore,
  Description,
  Business,
  FolderOpen,
  Today,
  Schedule,
  CalendarMonth
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
  const [groupBy, setGroupBy] = useState<'date' | 'type' | 'none'>('date');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['today', 'yesterday']));

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
      if (actionFilter) {
        // Map frontend action names to API expected values
        const actionMap: { [key: string]: string } = {
          'view': 'view',
          'download': 'download',
          'create': 'create',
          'delete': 'delete',
          'update': 'update'
        };
        const apiAction = actionMap[actionFilter] || actionFilter;
        params.append('action', apiAction);
      }
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

  // Group activities by date
  const groupActivitiesByDate = (activities: Activity[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups = {
      today: [] as Activity[],
      yesterday: [] as Activity[],
      thisWeek: [] as Activity[],
      older: [] as Activity[]
    };

    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

      if (activityDateOnly.getTime() === today.getTime()) {
        groups.today.push(activity);
      } else if (activityDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(activity);
      } else if (activityDate >= thisWeek) {
        groups.thisWeek.push(activity);
      } else {
        groups.older.push(activity);
      }
    });

    return groups;
  };

  // Group activities by type
  const groupActivitiesByType = (activities: Activity[]) => {
    const groups = {
      document: [] as Activity[],
      project: [] as Activity[],
      folder: [] as Activity[]
    };

    activities.forEach(activity => {
      if (activity.type === 'document') {
        groups.document.push(activity);
      } else if (activity.type === 'project') {
        groups.project.push(activity);
      } else if (activity.type === 'folder') {
        groups.folder.push(activity);
      }
    });

    return groups;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <Description />;
      case 'project': return <Business />;
      case 'folder': return <FolderOpen />;
      default: return <History />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'primary';
      case 'project': return 'secondary';
      case 'folder': return 'success';
      default: return 'default';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'document': return 'اسناد';
      case 'project': return 'پروژه‌ها';
      case 'folder': return 'پوشه‌ها';
      default: return type;
    }
  };

  const getDateGroupIcon = (group: string) => {
    switch (group) {
      case 'today': return <Today />;
      case 'yesterday': return <Schedule />;
      case 'thisWeek': return <CalendarMonth />;
      case 'older': return <History />;
      default: return <History />;
    }
  };

  const getDateGroupText = (group: string) => {
    switch (group) {
      case 'today': return 'امروز';
      case 'yesterday': return 'دیروز';
      case 'thisWeek': return 'این هفته';
      case 'older': return 'قدیمی‌تر';
      default: return group;
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Component for rendering individual activity
  const ActivityItem = ({ activity, index }: { activity: Activity; index: number }) => (
    <Card 
      sx={{ 
        mb: 1, 
        borderRadius: 2,
        boxShadow: 1,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: `${getActionColor(activity.action)}.light`,
              color: `${getActionColor(activity.action)}.main`
            }}
          >
            {getActionIcon(activity.action)}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography 
                variant="subtitle1" 
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
                icon={getActionIcon(activity.action)}
              />
              <Chip 
                label={getProjectName(activity.projectId)}
                size="small"
                color="info"
                variant="outlined"
                icon={getTypeIcon(activity.type)}
              />
            </Box>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif', 
                mb: 1,
                lineHeight: 1.5
              }}
            >
              {(() => {
                const parts = [];
                
                if (activity.folderName) {
                  parts.push(`پوشه: ${activity.folderName}`);
                }
                
                if (activity.documentName) {
                  parts.push(`سند: ${activity.documentName}`);
                }
                
                if (activity.details) {
                  parts.push(activity.details);
                }
                
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
        </Box>
      </CardContent>
    </Card>
  );

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
              startIcon={<ArrowBack sx={{ transform: 'rotate(180deg)' }} />}
              size="small"
              sx={{ 
                borderRadius: 2, 
                px: 2,
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                direction: 'rtl',
                '& .MuiButton-startIcon': { ml: 1 }
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
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>دسته‌بندی</InputLabel>
              <Select
                value={groupBy}
                label="دسته‌بندی"
                onChange={(e) => setGroupBy(e.target.value as 'date' | 'type' | 'none')}
                sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
              >
                <MenuItem value="date" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بر اساس تاریخ</MenuItem>
                <MenuItem value="type" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بر اساس نوع</MenuItem>
                <MenuItem value="none" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>بدون دسته‌بندی</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
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
              پاک کردن فیلترها
            </Button>
          </Grid>
        </Grid>

        {/* Quick Filter Chips */}
        <Box sx={{ mt: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif', 
              mb: 1,
              color: 'text.secondary'
            }}
          >
            فیلترهای سریع:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="همه فعالیت‌ها"
              variant={!actionFilter ? "filled" : "outlined"}
              color="primary"
              onClick={() => setActionFilter("")}
              icon={<History />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Chip
              label="مشاهده"
              variant={actionFilter === "view" ? "filled" : "outlined"}
              color="primary"
              onClick={() => setActionFilter(actionFilter === "view" ? "" : "view")}
              icon={<Visibility />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Chip
              label="دانلود"
              variant={actionFilter === "download" ? "filled" : "outlined"}
              color="secondary"
              onClick={() => setActionFilter(actionFilter === "download" ? "" : "download")}
              icon={<Download />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Chip
              label="ایجاد"
              variant={actionFilter === "create" ? "filled" : "outlined"}
              color="success"
              onClick={() => setActionFilter(actionFilter === "create" ? "" : "create")}
              icon={<Create />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Chip
              label="حذف"
              variant={actionFilter === "delete" ? "filled" : "outlined"}
              color="error"
              onClick={() => setActionFilter(actionFilter === "delete" ? "" : "delete")}
              icon={<Delete />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Chip
              label="امروز"
              variant={groupBy === "date" ? "filled" : "outlined"}
              color="info"
              onClick={() => setGroupBy(groupBy === "date" ? "none" : "date")}
              icon={<Today />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Chip
              label="بر اساس نوع"
              variant={groupBy === "type" ? "filled" : "outlined"}
              color="info"
              onClick={() => setGroupBy(groupBy === "type" ? "none" : "type")}
              icon={<FilterList />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
          </Stack>
        </Box>
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
          <Box sx={{ p: 2 }}>
            {groupBy === 'date' && (() => {
              const dateGroups = groupActivitiesByDate(activities);
              return (
                <Stack spacing={2}>
                  {Object.entries(dateGroups).map(([groupKey, groupActivities]) => {
                    if (groupActivities.length === 0) return null;
                    const isExpanded = expandedSections.has(groupKey);
                    
                    return (
                      <Accordion 
                        key={groupKey}
                        expanded={isExpanded}
                        onChange={() => toggleSection(groupKey)}
                        sx={{ 
                          boxShadow: 2,
                          borderRadius: 2,
                          '&:before': { display: 'none' }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            bgcolor: 'primary.light',
                            borderRadius: 2,
                            '&.Mui-expanded': {
                              borderRadius: '8px 8px 0 0'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Badge badgeContent={groupActivities.length} color="primary">
                              {getDateGroupIcon(groupKey)}
                            </Badge>
                            <Typography 
                              variant="h6" 
                              fontWeight="bold"
                              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                            >
                              {getDateGroupText(groupKey)}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2 }}>
                          <Stack spacing={1}>
                            {groupActivities.map((activity, index) => (
                              <ActivityItem key={activity.id} activity={activity} index={index} />
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Stack>
              );
            })()}

            {groupBy === 'type' && (() => {
              const typeGroups = groupActivitiesByType(activities);
              return (
                <Stack spacing={2}>
                  {Object.entries(typeGroups).map(([typeKey, typeActivities]) => {
                    if (typeActivities.length === 0) return null;
                    const isExpanded = expandedSections.has(typeKey);
                    
                    return (
                      <Accordion 
                        key={typeKey}
                        expanded={isExpanded}
                        onChange={() => toggleSection(typeKey)}
                        sx={{ 
                          boxShadow: 2,
                          borderRadius: 2,
                          '&:before': { display: 'none' }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            bgcolor: `${getTypeColor(typeKey)}.light`,
                            borderRadius: 2,
                            '&.Mui-expanded': {
                              borderRadius: '8px 8px 0 0'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Badge badgeContent={typeActivities.length} color={getTypeColor(typeKey) as any}>
                              {getTypeIcon(typeKey)}
                            </Badge>
                            <Typography 
                              variant="h6" 
                              fontWeight="bold"
                              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                            >
                              {getTypeText(typeKey)}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2 }}>
                          <Stack spacing={1}>
                            {typeActivities.map((activity, index) => (
                              <ActivityItem key={activity.id} activity={activity} index={index} />
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Stack>
              );
            })()}

            {groupBy === 'none' && (
              <Stack spacing={1}>
                {activities.map((activity, index) => (
                  <ActivityItem key={activity.id} activity={activity} index={index} />
                ))}
              </Stack>
            )}
            
            {hasMore && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outlined"
                  size="large"
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                    borderRadius: 2,
                    px: 4
                  }}
                >
                  {loading ? <CircularProgress size={20} /> : 'بارگذاری بیشتر'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

