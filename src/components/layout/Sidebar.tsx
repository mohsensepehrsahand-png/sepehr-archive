"use client";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  Chip
} from "@mui/material";
import {
  Dashboard,
  Folder,
  CloudUpload,
  Settings,
  Person,
  CalendarToday,
  Archive,
  AdminPanelSettings,
  Security,
  History
} from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const sidebarWidth = 280;

const mainMenuItems = [
  { text: "داشبورد", icon: <Dashboard />, href: "/dashboard" },
  { text: "پروژه‌ها", icon: <Folder />, href: "/projects" },
  { text: "آرشیو شده‌ها", icon: <Archive />, href: "/archived" },
  { text: "آپلود اسناد", icon: <CloudUpload />, href: "/upload" },
];

// منوی مدیریت کاربران فقط برای ادمین
const adminMenuItems = [
  { text: "مدیریت کاربران", icon: <AdminPanelSettings />, href: "/admin/users" },
  { text: "تنظیمات", icon: <Settings />, href: "/settings" },
  { text: "فعالیت‌های اخیر", icon: <History />, href: "/activities" },
];

// منوی محدود برای کاربران غیر ادمین
const userMenuItems = [
  { text: "پروژه‌ها", icon: <Folder />, href: "/projects" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  // انتخاب منوی مناسب بر اساس نقش کاربر
  const menuItems = isAdmin ? mainMenuItems : userMenuItems;

  const renderMenuItem = (item: any, index: number) => (
    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        component={Link}
        href={item.href}
        selected={pathname === item.href}
        sx={{
          borderRadius: 2,
          mx: 1,
          "&.Mui-selected": {
            backgroundColor: "primary.main",
            color: "white",
            "&:hover": {
              backgroundColor: "primary.dark",
            },
          },
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <ListItemIcon sx={{ 
          color: "inherit", 
          minWidth: 40,
          "& .MuiSvgIcon-root": {
            fontSize: 20
          }
        }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.text} 
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 500
          }}
        />
      </ListItemButton>
    </ListItem>
  );

  return (
    <Box
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: 1200,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 48,
              height: 48,
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
          >
            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.username || "کاربر"}
            </Typography>
            <Chip
              label={user?.role === "ADMIN" ? "مدیر سیستم" : "کاربر"}
              size="small"
              color={user?.role === "ADMIN" ? "error" : "primary"}
              variant="outlined"
              sx={{ 
                fontSize: "0.7rem",
                height: 20,
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{
            px: 2,
            mb: 1,
            display: "block",
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        >
          {isAdmin ? "منوی اصلی" : "منوی کاربری"}
        </Typography>
        <List>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </List>

        {/* Admin Menu */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{
                px: 2,
                mb: 1,
                display: "block",
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              مدیریت سیستم
            </Typography>
            <List>
              {adminMenuItems.map((item, index) => renderMenuItem(item, index))}
            </List>
          </>
        )}
      </Box>
    </Box>
  );
}
