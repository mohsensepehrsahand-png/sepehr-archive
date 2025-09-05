"use client";
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  useMediaQuery,
  useTheme,
  Box,
  Typography
} from "@mui/material";
import { 
  Dashboard, 
  Folder, 
  Description, 
  Settings, 
  Archive,
  Backup,
  Report,
  People,
  Security
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { text: 'داشبورد', icon: <Dashboard />, path: '/dashboard' },
    { text: 'پروژه‌ها', icon: <Folder />, path: '/projects' },
    { text: 'اسناد', icon: <Description />, path: '/documents' },
    { text: 'آرشیو', icon: <Archive />, path: '/archived' },
    { text: 'پشتیبان‌گیری', icon: <Backup />, path: '/backup' },
    { text: 'گزارشات', icon: <Report />, path: '/reports' },
    { text: 'کاربران', icon: <People />, path: '/users' },
    { text: 'تنظیمات', icon: <Settings />, path: '/settings' },
  ];

  const adminItems = [
    { text: 'مدیریت دسترسی‌ها', icon: <Security />, path: '/admin/permissions' },
    { text: 'مدیریت کاربران', icon: <People />, path: '/admin/users' },
  ];

  const handleItemClick = (path: string) => {
    router.push(path);
    onClose();
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  if (!isMobile) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          bgcolor: 'background.paper',
          direction: 'rtl'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="h6" 
          fontWeight="bold"
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            textAlign: 'center',
            mb: 2
          }}
        >
          منوی اصلی
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleItemClick(item.path)}
              selected={isActive(item.path)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
                '& .MuiListItemText-primary': {
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="subtitle2" 
          color="text.secondary"
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            mb: 1
          }}
        >
          مدیریت
        </Typography>
      </Box>
      
      <List>
        {adminItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleItemClick(item.path)}
              selected={isActive(item.path)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
                '& .MuiListItemText-primary': {
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

