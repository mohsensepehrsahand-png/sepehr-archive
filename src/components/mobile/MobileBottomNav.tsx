"use client";
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  useMediaQuery, 
  useTheme,
  Paper
} from "@mui/material";
import { 
  Home, 
  Folder, 
  Description, 
  Settings,
  Dashboard
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentValue = () => {
    if (pathname === '/dashboard') return 0;
    if (pathname.startsWith('/projects')) return 1;
    if (pathname.startsWith('/documents')) return 2;
    if (pathname === '/settings') return 3;
    return 0;
  };

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        router.push('/dashboard');
        break;
      case 1:
        router.push('/projects');
        break;
      case 2:
        router.push('/documents');
        break;
      case 3:
        router.push('/settings');
        break;
    }
  };

  if (!isMobile) return null;

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderTop: 1,
        borderColor: 'divider'
      }} 
      elevation={3}
    >
      <BottomNavigation 
        value={getCurrentValue()} 
        onChange={handleChange}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontSize: '0.75rem'
          }
        }}
      >
        <BottomNavigationAction
          label="داشبورد"
          icon={<Dashboard />}
        />
        <BottomNavigationAction
          label="پروژه‌ها"
          icon={<Folder />}
        />
        <BottomNavigationAction
          label="اسناد"
          icon={<Description />}
        />
        <BottomNavigationAction
          label="تنظیمات"
          icon={<Settings />}
        />
      </BottomNavigation>
    </Paper>
  );
}

