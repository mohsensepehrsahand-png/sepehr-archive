"use client";
import { Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Avatar, Box, Chip, useTheme, alpha } from "@mui/material";
import { Person, Add, Edit, Delete, Download, Upload, Visibility } from "@mui/icons-material";

interface Activity {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'create' | 'edit' | 'delete' | 'download' | 'upload' | 'view';
}

interface RecentActivitiesProps {
  activities?: Activity[];
  compact?: boolean;
}

export default function RecentActivities({ activities = [], compact = false }: RecentActivitiesProps) {
  const theme = useTheme();

  const defaultActivities: Activity[] = [
    {
      id: 1,
      user: "احمد محمدی",
      action: "پروژه جدید ایجاد کرد",
      target: "ساختمان مسکونی",
      time: "5 دقیقه پیش",
      type: "create"
    },
    {
      id: 2,
      user: "فاطمه احمدی",
      action: "سند را ویرایش کرد",
      target: "پلان معماری.pdf",
      time: "15 دقیقه پیش",
      type: "edit"
    },
    {
      id: 3,
      user: "علی رضایی",
      action: "سند را دانلود کرد",
      target: "متره و برآورد.xlsx",
      time: "1 ساعت پیش",
      type: "download"
    },
    {
      id: 4,
      user: "مریم کریمی",
      action: "سند جدید آپلود کرد",
      target: "تصاویر سایت.jpg",
      time: "2 ساعت پیش",
      type: "upload"
    },
    {
      id: 5,
      user: "حسن نوری",
      action: "پروژه را مشاهده کرد",
      target: "مرکز خرید",
      time: "3 ساعت پیش",
      type: "view"
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create': return <Add />;
      case 'edit': return <Edit />;
      case 'delete': return <Delete />;
      case 'download': return <Download />;
      case 'upload': return <Upload />;
      case 'view': return <Visibility />;
      default: return <Person />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'create': return 'success';
      case 'edit': return 'info';
      case 'delete': return 'error';
      case 'download': return 'primary';
      case 'upload': return 'warning';
      case 'view': return 'default';
      default: return 'default';
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'create': return 'ایجاد';
      case 'edit': return 'ویرایش';
      case 'delete': return 'حذف';
      case 'download': return 'دانلود';
      case 'upload': return 'آپلود';
      case 'view': return 'مشاهده';
      default: return 'عملیات';
    }
  };

  if (compact) {
    return (
      <List sx={{ p: 0 }}>
        {displayActivities.slice(0, 4).map((activity, index) => (
          <Box key={activity.id}>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Avatar sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: alpha(theme.palette[getActionColor(activity.type) as any]?.main || theme.palette.primary.main, 0.1),
                  color: theme.palette[getActionColor(activity.type) as any]?.main || theme.palette.primary.main
                }}>
                  {getActionIcon(activity.type)}
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Typography variant="caption" fontWeight="bold" sx={{ color: 'primary.main', fontFamily: 'Vazirmatn, Arial, sans-serif', lineHeight: 1.2 }}>
                    {activity.user}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" component="span" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', lineHeight: 1.2 }}>
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" component="div" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mt: 0.5 }}>
                      {activity.time}
                    </Typography>
                  </Box>
                }
                sx={{ '& .MuiListItemText-primary': { mb: 0.5 } }}
              />
            </ListItem>
            {index < Math.min(displayActivities.length, 4) - 1 && (
              <Box sx={{ 
                height: 1, 
                bgcolor: alpha(theme.palette.divider, 0.2), 
                mx: 1 
              }} />
            )}
          </Box>
        ))}
      </List>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        فعالیت‌های اخیر کاربران
      </Typography>
      
      <List sx={{ p: 0 }}>
        {displayActivities.map((activity, index) => (
          <Box key={activity.id}>
            <ListItem sx={{ px: 0, py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: alpha(theme.palette[getActionColor(activity.type) as any]?.main || theme.palette.primary.main, 0.1),
                  color: theme.palette[getActionColor(activity.type) as any]?.main || theme.palette.primary.main
                }}>
                  {getActionIcon(activity.type)}
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: 'primary.main', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {activity.user}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {activity.action}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" component="span" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {activity.target}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={getActionText(activity.type)} 
                        size="small" 
                        color={getActionColor(activity.type) as any}
                        sx={{ borderRadius: 1, height: 20, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            {index < displayActivities.length - 1 && (
              <Box sx={{ 
                height: 1, 
                bgcolor: alpha(theme.palette.divider, 0.3), 
                mx: 2 
              }} />
            )}
          </Box>
        ))}
      </List>
    </Paper>
  );
}
