"use client";
import { 
  Box, 
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
  Clear
} from "@mui/icons-material";
import { useState, useEffect } from "react";

interface Activity {
  id: string;
  type: string;
  action: string;
  userId: string;
  userName: string;
  projectId: string;
  documentId?: string;
  documentName?: string;
  details: string;
  timestamp: string;
}

interface RecentActivitiesProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecentActivities({ 
  projectId, 
  isOpen, 
  onClose 
}: RecentActivitiesProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchActivities = async (reset = false) => {
    try {
      setLoading(true);
      setError("");
      
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        projectId,
        limit: '20',
        offset: currentOffset.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter) params.append('action', actionFilter);
      
      const response = await fetch(`/api/activity-log?${params}`);
      if (!response.ok) throw new Error('خطا در دریافت فعالیت‌ها');
      
      const data = await response.json();
      
      if (reset) {
        setActivities(data.activities);
        setOffset(20);
      } else {
        setActivities(prev => [...prev, ...data.activities]);
        setOffset(prev => prev + 20);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت فعالیت‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchActivities(true);
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (isOpen && projectId) {
      const timeoutId = setTimeout(() => {
        fetchActivities(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, actionFilter]);

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
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    return date.toLocaleDateString('fa-IR');
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
  };

  if (!isOpen) return null;

  return (
    <Paper 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderLeft: 1,
        borderColor: 'divider'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography 
          variant="h6" 
          fontWeight="bold"
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          فعالیت‌های اخیر
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <Refresh />
          </IconButton>
          {!isMobile && (
            <IconButton size="small" onClick={onClose}>
              <Clear />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
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
            mb: 2,
            '& .MuiInputBase-input': { 
              fontFamily: 'Vazirmatn, Arial, sans-serif' 
            } 
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ flex: 1 }}>
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
          
          {(searchTerm || actionFilter) && (
            <IconButton size="small" onClick={handleClearFilters}>
              <Clear />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
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
              variant="body2" 
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
                      width: 32, 
                      height: 32,
                      bgcolor: `${getActionColor(activity.action)}.light`,
                      color: `${getActionColor(activity.action)}.main`
                    }}
                  >
                    {getActionIcon(activity.action)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography 
                        variant="body2" 
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
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      >
                        {activity.documentName && `${activity.documentName} - `}
                        {JSON.parse(activity.details || '{}').action || activity.action}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      >
                        {formatTime(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
            
            {hasMore && (
              <ListItem>
                <Box sx={{ width: '100%', textAlign: 'center', py: 2 }}>
                  <IconButton 
                    onClick={handleLoadMore}
                    disabled={loading}
                    sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'بارگذاری بیشتر'}
                  </IconButton>
                </Box>
              </ListItem>
            )}
          </List>
        )}
      </Box>
    </Paper>
  );
}

