"use client";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  alpha,
  Typography,
  Tooltip,
  Chip
} from "@mui/material";
import {
  Logout,
  Settings,
  Person,
  AdminPanelSettings,
  TrendingUp,
  Menu as MenuIcon
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getCookie, deleteCookie } from "cookies-next";
import { useMediaQuery } from "@mui/material";
import MobileDrawer from "@/components/mobile/MobileDrawer";
import { getCurrentPersianDate, getCurrentPersianTime } from "@/utils/dateUtils";

export default function Header() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear cookies
        deleteCookie("authToken", { path: "/" });
        deleteCookie("userRole", { path: "/" });
        deleteCookie("userData", { path: "/" });
        
        // Call context logout
        logout();
        handleClose();
        
        // Redirect to login
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      deleteCookie("authToken", { path: "/" });
      deleteCookie("userRole", { path: "/" });
      deleteCookie("userData", { path: "/" });
      logout();
      handleClose();
      router.push('/login');
    }
  };

  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Initialize date and time on client side
    setCurrentDate(getCurrentPersianDate());
    setCurrentTime(getCurrentPersianTime());
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentDate(getCurrentPersianDate());
      setCurrentTime(getCurrentPersianTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // تابع برای نمایش حروف اول نام و نام خانوادگی
  const getInitials = () => {
    if (!user) return '?';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    } else if (firstName) {
      return firstName.charAt(0);
    } else if (lastName) {
      return lastName.charAt(0);
    } else {
      return user.username.charAt(0).toUpperCase();
    }
  };

  // تابع برای نمایش نام کامل کاربر
  const getFullName = () => {
    if (!user) return 'کاربر';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return user.username;
    }
  };

  // تابع برای نمایش نقش کاربر
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'مدیر سیستم';
      case 'BUYER':
        return 'خریدار';
      case 'CONTRACTOR':
        return 'پیمانکار';
      case 'SUPPLIER':
        return 'تامین‌کننده';
      default:
        return 'کاربر';
    }
  };

  return (
    <AppBar
      position="static"
      sx={{
        width: "100%",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.default, 0.95)})`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 4px 32px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 }, py: 1 }}>

        {/* Left - Date and Time */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-start',
          gap: 0.5,
          ml: 2
        }}>
          <Typography 
            variant={isMobile ? "body1" : "h6"}
            color="text.primary" 
            fontWeight="bold" 
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              textAlign: 'right',
              fontSize: { xs: '0.9rem', md: '1.1rem' }
            }}
          >
            {currentDate}
          </Typography>
          <Typography 
            variant={isMobile ? "caption" : "body2"}
            color="text.secondary" 
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              textAlign: 'right',
              fontWeight: 600
            }}
          >
            {currentTime}
          </Typography>
        </Box>

        {/* Mobile Menu Button - Only show on mobile */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ ml: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Center - System Title */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 1,
          flex: 1
        }}>
          {/* System Title */}
          <Typography 
            variant={isMobile ? "h6" : "h5"}
            color="primary" 
            fontWeight="bold" 
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center'
            }}
          >
            {isMobile ? 'آرشیو سپهر' : 'سیستم آرشیو اسناد سپهر'}
          </Typography>
          
          {/* System Status - Hide on mobile */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<TrendingUp />}
                label="سیستم فعال"
                size="small"
                color="success"
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  fontFamily: 'Vazirmatn, Arial, sans-serif'
                }}
              />
            </Box>
          )}
        </Box>

        {/* Right Side - Actions and User Menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>

          {/* Settings - Only show for admin users and not on mobile */}
          {isAdmin && !isMobile && (
            <Tooltip title="تنظیمات">
              <IconButton
                color="inherit"
                component={Link}
                href="/settings"
                sx={{ 
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.2),
                    color: 'text.primary'
                  }
                }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          )}
          
          {/* User Avatar and Menu */}
          <Tooltip title={`حساب کاربری - ${getFullName()}`}>
            <IconButton
              size={isMobile ? "medium" : "large"}
              aria-label="حساب کاربری"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: 'primary.main',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.25),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Avatar 
                sx={{ 
                  width: isMobile ? 32 : 36, 
                  height: isMobile ? 32 : 36,
                  bgcolor: 'primary.main',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: 'bold'
                }}
              >
                {getInitials()}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                borderRadius: 3,
                minWidth: 220,
                mt: 1,
                boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }
            }}
          >
            <MenuItem onClick={handleClose} sx={{ py: 2, px: 2 }}>
              <Person sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  {getFullName()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  {getRoleLabel(user?.role || '')}
                </Typography>
              </Box>
            </MenuItem>
            
            {user?.role === 'ADMIN' && (
              <MenuItem 
                component={Link}
                href="/admin/users"
                onClick={handleClose} 
                sx={{ py: 1.5, px: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              >
                <AdminPanelSettings sx={{ mr: 2, color: 'text.secondary' }} />
                پنل مدیریت
              </MenuItem>
            )}
            
            
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2, color: 'error.main', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              <Logout sx={{ mr: 2 }} />
              خروج
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      
      {/* Mobile Drawer */}
      <MobileDrawer 
        open={mobileDrawerOpen} 
        onClose={() => setMobileDrawerOpen(false)} 
      />
    </AppBar>
  );
}
