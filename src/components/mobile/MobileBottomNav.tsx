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
import { useQueryClient } from "@tanstack/react-query";

export default function MobileBottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

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
        router.prefetch('/dashboard');
        queryClient.prefetchQuery({
          queryKey: ["dashboard"],
          queryFn: async () => {
            const [activitiesRes, documentsRes, projectsRes] = await Promise.all([
              fetch("/api/dashboard/recent-activities"),
              fetch("/api/dashboard/recent-documents"),
              fetch("/api/projects")
            ]);
            const [activities, documents, projects] = await Promise.all([
              activitiesRes.ok ? activitiesRes.json() : [],
              documentsRes.ok ? documentsRes.json() : [],
              projectsRes.ok ? projectsRes.json() : []
            ]);
            return { activities, documents, projects };
          },
          staleTime: 1 * 60 * 1000,
        });
        router.push('/dashboard');
        break;
      case 1:
        router.prefetch('/projects');
        queryClient.prefetchQuery({
          queryKey: ["projects"],
          queryFn: async () => {
            const response = await fetch("/api/projects");
            if (!response.ok) throw new Error("Failed to fetch projects");
            return response.json();
          },
          staleTime: 2 * 60 * 1000,
        });
        router.push('/projects');
        break;
      case 2:
        router.prefetch('/documents');
        router.push('/documents');
        break;
      case 3:
        router.prefetch('/settings');
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

