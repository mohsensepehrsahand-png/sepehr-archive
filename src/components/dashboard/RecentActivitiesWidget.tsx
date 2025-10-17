"use client";
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Avatar, Divider, IconButton, Tooltip } from "@mui/material";
import { Refresh, History, Delete, Edit, Folder, CreateNewFolder, Upload, Info } from "@mui/icons-material";
import { formatPersianDate } from "@/utils/dateUtils";
import { useRouter } from "next/navigation";

interface RecentActivitiesWidgetProps {
  activities: any[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function RecentActivitiesWidget({ activities, onRefresh, isLoading }: RecentActivitiesWidgetProps) {
  const router = useRouter();

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

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          فعالیت‌های اخیر
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="مشاهده همه فعالیت‌ها">
            <IconButton 
              size="small" 
              onClick={() => router.push('/activities')}
              sx={{ color: 'primary.main', bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
            >
              <History />
            </IconButton>
          </Tooltip>
          {onRefresh && (
            <Tooltip title="بروزرسانی">
              <IconButton size="small" onClick={onRefresh} disabled={isLoading} sx={{ color: 'primary.main' }}>
                <Refresh sx={{ 
                  animation: isLoading ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {activities.length > 0 ? (
        <List dense sx={{ flex: 1, overflow: 'auto' }}>
          {activities.slice(0, 10).map((activity, index) => (
            <Box key={activity.id}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: `${activity.color}.main`, fontSize: '0.75rem' }}>
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {activity.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {activity.user} • {formatPersianDate(activity.timestamp)}
                    </Typography>
                  }
                />
              </ListItem>
              {index < activities.slice(0, 10).length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', textAlign: 'center', py: 4 }}>
          هیچ فعالیتی در هفته گذشته ثبت نشده است
        </Typography>
      )}
    </Paper>
  );
}

