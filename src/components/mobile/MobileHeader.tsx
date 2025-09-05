"use client";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  useMediaQuery, 
  useTheme,
  Button
} from "@mui/material";
import { 
  Menu, 
  ArrowBack, 
  Add,
  Search
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showAddButton?: boolean;
  showSearchButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  onAddClick?: () => void;
  onSearchClick?: () => void;
  subtitle?: string;
}

export default function MobileHeader({
  title,
  showBackButton = false,
  showMenuButton = false,
  showAddButton = false,
  showSearchButton = false,
  onBackClick,
  onMenuClick,
  onAddClick,
  onSearchClick,
  subtitle
}: MobileHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  if (!isMobile) return null;

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ px: 2 }}>
        {/* Left Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBackClick}
              sx={{ mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
          )}
          
          {showMenuButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={onMenuClick}
              sx={{ mr: 1 }}
            >
              <Menu />
            </IconButton>
          )}
        </Box>

        {/* Title */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="h6" 
            noWrap
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              fontWeight: 'bold'
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              noWrap
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showSearchButton && (
            <IconButton
              color="inherit"
              onClick={onSearchClick}
            >
              <Search />
            </IconButton>
          )}
          
          {showAddButton && (
            <IconButton
              color="inherit"
              onClick={onAddClick}
            >
              <Add />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

