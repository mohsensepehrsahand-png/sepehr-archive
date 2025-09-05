"use client";
import { Box, Breadcrumbs, Link as MuiLink, Typography, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Home, ArrowBack } from "@mui/icons-material";

interface MobileBreadcrumbProps {
  currentPath: string[];
  onNavigateToRoot: () => void;
  onNavigateToPath: (index: number) => void;
  onNavigateBack?: () => void;
  showBackButton?: boolean;
}

export default function MobileBreadcrumb({
  currentPath,
  onNavigateToRoot,
  onNavigateToPath,
  onNavigateBack,
  showBackButton = false
}: MobileBreadcrumbProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        {showBackButton && currentPath.length > 0 && (
          <IconButton 
            size="small" 
            onClick={onNavigateBack}
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>
        )}
        
        <Breadcrumbs 
          separator="›" 
          sx={{ 
            flex: 1,
            '& .MuiBreadcrumbs-separator': {
              color: 'text.secondary'
            }
          }}
        >
          <MuiLink
            component="button"
            onClick={onNavigateToRoot}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'primary.main',
              fontSize: '0.875rem',
              fontFamily: 'Vazirmatn, Arial, sans-serif'
            }}
          >
            <Home fontSize="small" />
            خانه
          </MuiLink>
          
          {currentPath.map((path, index) => (
            <MuiLink
              key={index}
              component="button"
              onClick={() => onNavigateToPath(index)}
              sx={{ 
                cursor: 'pointer',
                textDecoration: 'none',
                color: index === currentPath.length - 1 ? 'text.primary' : 'primary.main',
                fontSize: '0.875rem',
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: index === currentPath.length - 1 ? 'bold' : 'normal'
              }}
            >
              {path}
            </MuiLink>
          ))}
        </Breadcrumbs>
      </Box>
    );
  }

  // Desktop version
  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs 
        separator="›"
        sx={{ 
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary'
          }
        }}
      >
        <MuiLink
          component="button"
          onClick={onNavigateToRoot}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            cursor: 'pointer',
            textDecoration: 'none',
            color: 'primary.main',
            fontFamily: 'Vazirmatn, Arial, sans-serif'
          }}
        >
          <Home fontSize="small" />
          خانه
        </MuiLink>
        
        {currentPath.map((path, index) => (
          <MuiLink
            key={index}
            component="button"
            onClick={() => onNavigateToPath(index)}
            sx={{ 
              cursor: 'pointer',
              textDecoration: 'none',
              color: index === currentPath.length - 1 ? 'text.primary' : 'primary.main',
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              fontWeight: index === currentPath.length - 1 ? 'bold' : 'normal'
            }}
          >
            {path}
          </MuiLink>
        ))}
      </Breadcrumbs>
    </Box>
  );
}

